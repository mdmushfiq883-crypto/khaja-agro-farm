// Inventory & Stock Tracking Service
const { queryAll, queryOne, run, transaction } = require('../db/database');

class InventoryService {
    /**
     * Get inventory overview with low-stock and out-of-stock indicators
     */
    getInventoryOverview({ lowStockOnly = false, search = null } = {}) {
        let whereClauses = [];
        let params = [];

        if (search && search.trim()) {
            whereClauses.push('(p.name LIKE ? OR pv.variation_name LIKE ? OR pv.sku LIKE ?)');
            const q = `%${search.trim()}%`;
            params.push(q, q, q);
        }

        // Get simple products
        const simpleProducts = queryAll(`
            SELECT
                p.id as product_id,
                NULL as variation_id,
                p.name as product_name,
                'Simple' as type,
                'N/A' as variation_name,
                'PRD-' || p.id as sku,
                p.base_stock as stock_quantity,
                p.low_stock_threshold,
                p.featured_image as image_url,
                p.is_active,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.has_variations = 0
            ORDER BY p.name ASC
        `);

        // Get variation items
        const variableProducts = queryAll(`
            SELECT
                p.id as product_id,
                pv.id as variation_id,
                p.name as product_name,
                'Variable' as type,
                pv.variation_name,
                pv.sku,
                pv.stock_quantity,
                pv.low_stock_threshold,
                COALESCE(pv.image_url, p.featured_image) as image_url,
                pv.is_active,
                c.name as category_name
            FROM product_variations pv
            JOIN products p ON pv.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.name ASC, pv.display_order ASC
        `);

        const allItems = [...simpleProducts, ...variableProducts].map(item => {
            const isOutOfStock = item.stock_quantity <= 0;
            const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold;
            return {
                ...item,
                isOutOfStock,
                isLowStock,
                statusText: isOutOfStock ? 'Out of Stock' : (isLowStock ? 'Low Stock' : 'In Stock')
            };
        });

        if (lowStockOnly) {
            return allItems.filter(i => i.isOutOfStock || i.isLowStock);
        }

        return allItems;
    }

    /**
     * Adjust stock manually with audit ledger
     */
    adjustStock({ productId, variationId = null, changeQuantity, newStock = null, reason = 'Manual inventory adjustment', referenceId = null, createdBy = 'admin' }) {
        if (!productId) throw new Error('Product ID is required.');

        return transaction((db) => {
            let currentStock = 0;
            let targetNewStock = 0;

            if (variationId) {
                const variation = queryOne('SELECT id, stock_quantity FROM product_variations WHERE id = ? AND product_id = ?', [variationId, productId]);
                if (!variation) throw new Error('Product variation not found.');
                currentStock = variation.stock_quantity;

                if (newStock !== null) {
                    targetNewStock = parseInt(newStock, 10);
                } else {
                    targetNewStock = currentStock + parseInt(changeQuantity, 10);
                }

                if (targetNewStock < 0) {
                    throw new Error(`Insufficient stock. Current stock is ${currentStock}, adjustment would result in negative stock.`);
                }

                const actualDiff = targetNewStock - currentStock;
                run('UPDATE product_variations SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [targetNewStock, variationId]);

                run(`
                    INSERT INTO inventory_movements (product_id, variation_id, change_quantity, new_stock, reason, reference_id, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [productId, variationId, actualDiff, targetNewStock, reason, referenceId, createdBy]);

            } else {
                const prod = queryOne('SELECT id, base_stock FROM products WHERE id = ?', [productId]);
                if (!prod) throw new Error('Product not found.');
                currentStock = prod.base_stock;

                if (newStock !== null) {
                    targetNewStock = parseInt(newStock, 10);
                } else {
                    targetNewStock = currentStock + parseInt(changeQuantity, 10);
                }

                if (targetNewStock < 0) {
                    throw new Error(`Insufficient stock. Current stock is ${currentStock}, adjustment would result in negative stock.`);
                }

                const actualDiff = targetNewStock - currentStock;
                run('UPDATE products SET base_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [targetNewStock, productId]);

                run(`
                    INSERT INTO inventory_movements (product_id, variation_id, change_quantity, new_stock, reason, reference_id, created_by)
                    VALUES (?, NULL, ?, ?, ?, ?, ?)
                `, [productId, actualDiff, targetNewStock, reason, referenceId, createdBy]);
            }

            return {
                productId,
                variationId,
                previousStock: currentStock,
                newStock: targetNewStock
            };
        });
    }

    /**
     * Get stock movement history for audit
     */
    getMovements({ productId = null, variationId = null, limit = 50 } = {}) {
        let whereClauses = [];
        let params = [];

        if (productId) {
            whereClauses.push('im.product_id = ?');
            params.push(productId);
        }

        if (variationId) {
            whereClauses.push('im.variation_id = ?');
            params.push(variationId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        return queryAll(`
            SELECT
                im.*,
                p.name as product_name,
                pv.variation_name,
                pv.sku
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            LEFT JOIN product_variations pv ON im.variation_id = pv.id
            ${whereSql}
            ORDER BY im.id DESC
            LIMIT ?
        `, [...params, parseInt(limit, 10) || 50]);
    }
}

module.exports = new InventoryService();
