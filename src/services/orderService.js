// Order Placement, Processing, Lifecycle, and Audit Service
const { queryAll, queryOne, run, transaction } = require('../db/database');
const { generateOrderNumber } = require('../utils/security');
const inventoryService = require('./inventoryService');

class OrderService {
    /**
     * Server-side calculation and verification of cart items
     * NEVER trust client submitted prices!
     */
    calculateCart(rawItems, deliveryCity = 'Chattogram') {
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return {
                items: [],
                subtotal: 0,
                deliveryFee: 0,
                discount: 0,
                total: 0,
                isValid: false,
                errors: ['Shopping cart is empty.']
            };
        }

        const deliverySettings = queryOne('SELECT * FROM delivery_settings WHERE id = 1');
        const defaultFee = deliverySettings ? deliverySettings.default_charge : 60;
        const freeThreshold = deliverySettings ? deliverySettings.free_delivery_threshold : 1500;

        let verifiedItems = [];
        let subtotal = 0;
        let errors = [];

        for (const raw of rawItems) {
            const quantity = parseInt(raw.quantity, 10);
            if (!quantity || quantity <= 0) continue;

            const productId = parseInt(raw.productId, 10);
            const variationId = raw.variationId ? parseInt(raw.variationId, 10) : null;

            const product = queryOne('SELECT * FROM products WHERE id = ? AND is_active = 1', [productId]);
            if (!product) {
                errors.push(`A product in your cart is no longer available.`);
                continue;
            }

            let unitPrice = 0;
            let regularPrice = 0;
            let currentStock = 0;
            let variationName = null;
            let sku = `PRD-${product.id}`;
            let itemImage = product.featured_image;

            if (product.has_variations) {
                if (!variationId) {
                    errors.push(`Please select a variation for ${product.name}.`);
                    continue;
                }

                const variation = queryOne(`
                    SELECT * FROM product_variations
                    WHERE id = ? AND product_id = ? AND is_active = 1
                `, [variationId, productId]);

                if (!variation) {
                    errors.push(`The selected option for ${product.name} is no longer available.`);
                    continue;
                }

                unitPrice = variation.sale_price !== null && variation.sale_price !== undefined
                    ? variation.sale_price
                    : variation.regular_price;
                regularPrice = variation.regular_price;
                currentStock = variation.stock_quantity;
                variationName = variation.variation_name;
                sku = variation.sku;
                itemImage = variation.image_url || product.featured_image;

                if (currentStock < quantity) {
                    errors.push(`Only ${currentStock} units available for ${product.name} (${variationName}).`);
                }
            } else {
                unitPrice = product.base_sale_price !== null && product.base_sale_price !== undefined
                    ? product.base_sale_price
                    : product.base_price;
                regularPrice = product.base_price;
                currentStock = product.base_stock;

                if (currentStock < quantity) {
                    errors.push(`Only ${currentStock} units available for ${product.name}.`);
                }
            }

            const lineTotal = unitPrice * quantity;
            subtotal += lineTotal;

            verifiedItems.push({
                productId: product.id,
                variationId,
                productName: product.name,
                variationName,
                sku,
                unitPrice,
                regularPrice,
                quantity,
                lineTotal,
                currentStock,
                image: itemImage
            });
        }

        let deliveryFee = defaultFee;
        if (subtotal >= freeThreshold) {
            deliveryFee = 0;
        }

        const total = subtotal + deliveryFee;

        return {
            items: verifiedItems,
            subtotal,
            deliveryFee,
            discount: 0,
            total,
            freeDeliveryThreshold: freeThreshold,
            freeDeliveryRemaining: Math.max(0, freeThreshold - subtotal),
            isValid: errors.length === 0 && verifiedItems.length > 0,
            errors
        };
    }

    /**
     * Create order with atomic inventory deduction and snapshot creation
     */
    createOrder({
        customerId = null,
        customerName,
        customerPhone,
        customerEmail = null,
        deliveryAddress,
        deliveryCity = 'Chattogram',
        customerNotes = null,
        items,
        paymentMethodCode,
        transactionReference = null,
        idempotencyKey = null
    }) {
        if (!customerName || !customerName.trim()) throw new Error('Customer name is required.');
        if (!customerPhone || !customerPhone.trim()) throw new Error('Customer phone is required.');
        if (!deliveryAddress || !deliveryAddress.trim()) throw new Error('Delivery address is required.');
        if (!paymentMethodCode) throw new Error('Payment method is required.');

        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 11) {
            throw new Error('Please enter a valid 11-digit Bangladeshi mobile number.');
        }

        // Check payment method is enabled
        const paymentMethod = queryOne('SELECT * FROM payment_methods WHERE code = ? AND is_enabled = 1', [paymentMethodCode]);
        if (!paymentMethod) {
            throw new Error(`The selected payment method is currently unavailable.`);
        }

        // Validate Transaction ID for mobile banking
        if (paymentMethodCode !== 'cod' && (!transactionReference || !transactionReference.trim())) {
            throw new Error(`Please enter your Transaction ID (TrxID) or sender phone for ${paymentMethod.name} verification.`);
        }

        // Idempotency check to prevent duplicate order submissions
        if (idempotencyKey) {
            const existingOrder = queryOne('SELECT * FROM orders WHERE idempotency_key = ?', [idempotencyKey]);
            if (existingOrder) {
                return this.getOrderById(existingOrder.id);
            }
        }

        // Recalculate totals strictly on server
        const calculation = this.calculateCart(items, deliveryCity);
        if (!calculation.isValid) {
            throw new Error(calculation.errors.join(' '));
        }

        return transaction((db) => {
            const orderNumber = generateOrderNumber();
            const initialOrderStatus = 'Pending';
            const initialPaymentStatus = (paymentMethodCode === 'cod') ? 'Unpaid' : 'Awaiting Verification';

            const res = run(`
                INSERT INTO orders (
                    order_number, customer_id, customer_name, customer_phone,
                    customer_email, delivery_address, delivery_city, customer_notes,
                    subtotal, delivery_fee, discount, total_amount, payment_method_code,
                    payment_status, order_status, transaction_reference, idempotency_key
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                orderNumber,
                customerId || null,
                customerName.trim(),
                cleanPhone,
                customerEmail ? customerEmail.trim().toLowerCase() : null,
                deliveryAddress.trim(),
                deliveryCity.trim(),
                customerNotes?.trim() || null,
                calculation.subtotal,
                calculation.deliveryFee,
                calculation.discount,
                calculation.total,
                paymentMethodCode,
                initialPaymentStatus,
                initialOrderStatus,
                transactionReference?.trim() || null,
                idempotencyKey || null
            ]);

            const orderId = res.lastInsertRowid;

            // Deduct stock and write order items snapshot
            for (const item of calculation.items) {
                run(`
                    INSERT INTO order_items (
                        order_id, product_id, variation_id, product_name,
                        variation_name, sku, unit_price, regular_price,
                        quantity, subtotal_price, product_image
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    orderId,
                    item.productId,
                    item.variationId,
                    item.productName,
                    item.variationName,
                    item.sku,
                    item.unitPrice,
                    item.regularPrice,
                    item.quantity,
                    item.lineTotal,
                    item.image
                ]);

                // Atomic inventory deduction
                inventoryService.adjustStock({
                    productId: item.productId,
                    variationId: item.variationId,
                    changeQuantity: -item.quantity,
                    reason: `Order placed: #${orderNumber}`,
                    referenceId: String(orderId),
                    createdBy: customerId ? `customer:${customerId}` : 'guest'
                });
            }

            // Record initial status history
            run(`
                INSERT INTO order_status_history (order_id, previous_status, new_status, comment, changed_by)
                VALUES (?, NULL, ?, 'Order placed by customer', ?)
            `, [orderId, initialOrderStatus, customerName.trim()]);

            return this.getOrderById(orderId);
        });
    }

    /**
     * Get order by ID with items and status history
     */
    getOrderById(id) {
        const order = queryOne(`
            SELECT o.*, pm.name as payment_method_name, pm.instructions as payment_instructions,
                   pm.account_number as payment_account_number
            FROM orders o
            LEFT JOIN payment_methods pm ON o.payment_method_code = pm.code
            WHERE o.id = ?
        `, [id]);

        if (!order) return null;

        order.items = queryAll('SELECT * FROM order_items WHERE order_id = ?', [id]);
        order.status_history = queryAll('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC', [id]);
        return order;
    }

    /**
     * Get order by order number
     */
    getOrderByNumber(orderNumber) {
        const order = queryOne('SELECT id FROM orders WHERE order_number = ?', [orderNumber]);
        if (!order) return null;
        return this.getOrderById(order.id);
    }

    /**
     * Update order status with stock restoration on cancellation
     */
    updateOrderStatus(orderId, newStatus, comment = '', changedBy = 'admin') {
        const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Ready for Delivery', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid order status: ${newStatus}`);
        }

        const order = this.getOrderById(orderId);
        if (!order) throw new Error('Order not found.');

        const prevStatus = order.order_status;
        if (prevStatus === newStatus) return order;

        return transaction((db) => {
            // If order was cancelled, restore stock exactly once
            if (newStatus === 'Cancelled' && prevStatus !== 'Cancelled') {
                for (const item of order.items) {
                    if (item.product_id) {
                        inventoryService.adjustStock({
                            productId: item.product_id,
                            variationId: item.variation_id,
                            changeQuantity: item.quantity,
                            reason: `Order #${order.order_number} cancelled - stock restored`,
                            referenceId: String(orderId),
                            createdBy: changedBy
                        });
                    }
                }
            }

            // If an order that was cancelled is re-opened, re-deduct stock
            if (prevStatus === 'Cancelled' && newStatus !== 'Cancelled') {
                for (const item of order.items) {
                    if (item.product_id) {
                        inventoryService.adjustStock({
                            productId: item.product_id,
                            variationId: item.variation_id,
                            changeQuantity: -item.quantity,
                            reason: `Order #${order.order_number} re-opened from cancelled`,
                            referenceId: String(orderId),
                            createdBy: changedBy
                        });
                    }
                }
            }

            run('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, orderId]);

            run(`
                INSERT INTO order_status_history (order_id, previous_status, new_status, comment, changed_by)
                VALUES (?, ?, ?, ?, ?)
            `, [orderId, prevStatus, newStatus, comment || null, changedBy]);

            return this.getOrderById(orderId);
        });
    }

    /**
     * Update payment status (e.g. admin verifies transaction reference)
     */
    updatePaymentStatus(orderId, paymentStatus, transactionReference = null, changedBy = 'admin') {
        const valid = ['Unpaid', 'Awaiting Verification', 'Paid', 'Failed', 'Refunded'];
        if (!valid.includes(paymentStatus)) throw new Error(`Invalid payment status: ${paymentStatus}`);

        const order = this.getOrderById(orderId);
        if (!order) throw new Error('Order not found.');

        run(`
            UPDATE orders
            SET payment_status = ?,
                transaction_reference = COALESCE(?, transaction_reference),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [paymentStatus, transactionReference, orderId]);

        run(`
            INSERT INTO order_status_history (order_id, previous_status, new_status, comment, changed_by)
            VALUES (?, ?, ?, ?, ?)
        `, [orderId, order.payment_status, paymentStatus, `Payment status updated to ${paymentStatus}`, changedBy]);

        return this.getOrderById(orderId);
    }

    /**
     * Update internal notes
     */
    updateInternalNotes(orderId, internalNotes) {
        run('UPDATE orders SET internal_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [internalNotes, orderId]);
        return this.getOrderById(orderId);
    }

    /**
     * Search and filter orders for admin dashboard
     */
    listOrders({ status = null, paymentStatus = null, search = null, limit = 50, offset = 0 } = {}) {
        let whereClauses = [];
        let params = [];

        if (status) {
            whereClauses.push('o.order_status = ?');
            params.push(status);
        }

        if (paymentStatus) {
            whereClauses.push('o.payment_status = ?');
            params.push(paymentStatus);
        }

        if (search && search.trim()) {
            const q = `%${search.trim()}%`;
            whereClauses.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)');
            params.push(q, q, q);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const orders = queryAll(`
            SELECT o.*, pm.name as payment_method_name,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
            FROM orders o
            LEFT JOIN payment_methods pm ON o.payment_method_code = pm.code
            ${whereSql}
            ORDER BY o.id DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit, 10) || 50, parseInt(offset, 10) || 0]);

        return orders;
    }

    /**
     * Get orders for a specific customer
     */
    getCustomerOrders(customerId) {
        return queryAll(`
            SELECT o.*, pm.name as payment_method_name,
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
            FROM orders o
            LEFT JOIN payment_methods pm ON o.payment_method_code = pm.code
            WHERE o.customer_id = ?
            ORDER BY o.id DESC
        `, [customerId]);
    }

    /**
     * Real database dashboard metrics (NO HARDCODED NUMBERS)
     */
    getDashboardStatistics() {
        const orderCounts = queryAll(`
            SELECT order_status, COUNT(*) as count
            FROM orders
            GROUP BY order_status
        `);

        const orderStats = {
            total: 0,
            pending: 0,
            confirmed: 0,
            processing: 0,
            readyForDelivery: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };

        for (const row of orderCounts) {
            const c = row.count;
            orderStats.total += c;
            if (row.order_status === 'Pending') orderStats.pending = c;
            if (row.order_status === 'Confirmed') orderStats.confirmed = c;
            if (row.order_status === 'Processing') orderStats.processing = c;
            if (row.order_status === 'Ready for Delivery') orderStats.readyForDelivery = c;
            if (row.order_status === 'Shipped') orderStats.shipped = c;
            if (row.order_status === 'Delivered') orderStats.delivered = c;
            if (row.order_status === 'Cancelled') orderStats.cancelled = c;
        }

        const totalSalesResult = queryOne(`
            SELECT COALESCE(SUM(total_amount), 0) as total_sales
            FROM orders
            WHERE order_status IN ('Delivered', 'Shipped', 'Ready for Delivery', 'Processing', 'Confirmed')
        `);
        const totalSales = totalSalesResult ? totalSalesResult.total_sales : 0;

        const productStatsResult = queryOne(`
            SELECT
                COUNT(*) as total_products,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products
            FROM products
        `);

        const inventoryOverview = inventoryService.getInventoryOverview();
        const lowStockCount = inventoryOverview.filter(i => i.isLowStock).length;
        const outOfStockCount = inventoryOverview.filter(i => i.isOutOfStock).length;

        const customerCount = queryOne(`
            SELECT COUNT(*) as count FROM users WHERE role = 'customer'
        `)?.count || 0;

        const recentOrders = this.listOrders({ limit: 10 });

        return {
            orders: orderStats,
            totalSales,
            products: {
                total: productStatsResult?.total_products || 0,
                active: productStatsResult?.active_products || 0,
                lowStock: lowStockCount,
                outOfStock: outOfStockCount
            },
            customers: customerCount,
            recentOrders
        };
    }
}

module.exports = new OrderService();
