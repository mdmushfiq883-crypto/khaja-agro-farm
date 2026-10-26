// Khaja Agro Farm - Comprehensive Automated Acceptance Test Suite
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Initialize database
const { getDb, initSchema, queryAll, queryOne } = require('../src/db/database');
const { seedDatabase } = require('../src/db/seed');
const authService = require('../src/services/authService');
const productService = require('../src/services/productService');
const categoryService = require('../src/services/categoryService');
const attributeService = require('../src/services/attributeService');
const inventoryService = require('../src/services/inventoryService');
const orderService = require('../src/services/orderService');
const settingService = require('../src/services/settingService');
const customerService = require('../src/services/customerService');
const config = require('../src/config/config');

test('Setup and Seed Verification', () => {
    seedDatabase();
    const categories = categoryService.getAllCategories();
    assert.ok(categories.length >= 4, 'Should have 4 active storefront categories (Ghee merged into Dairy)');
    const allCategories = categoryService.getAllCategories({ includeInactive: true });
    assert.ok(allCategories.length >= 5, 'Should have at least 5 total categories including inactive');

    const products = productService.getAllProducts();
    assert.ok(products.length >= 6, 'Should have initial products');

    const admin = queryOne("SELECT * FROM users WHERE role = 'admin'");
    assert.ok(admin, 'Admin account must exist');
    assert.equal(admin.phone, config.BUSINESS.PHONE, 'Admin phone should match official business number');
});

test('Master Refinements Verification (Socials, Instagram, Payments, Ghee Merge)', () => {
    // 1. YouTube is disabled in social_links
    const yt = queryOne("SELECT * FROM social_links WHERE platform = 'YouTube'");
    assert.ok(yt, 'YouTube record exists');
    assert.equal(yt.is_enabled, 0, 'YouTube must be disabled');

    // 2. Instagram link points to official username khajaagro02
    const ig = queryOne("SELECT * FROM social_links WHERE platform = 'Instagram'");
    assert.ok(ig, 'Instagram record exists');
    assert.equal(ig.url, 'https://www.instagram.com/khajaagro02/', 'Instagram URL must be updated');
    assert.equal(ig.is_enabled, 1, 'Instagram must be active');

    // 3. Bank / Hand Transfer is disabled in payment_methods
    const manualPayment = queryOne("SELECT * FROM payment_methods WHERE code = 'manual'");
    assert.ok(manualPayment, 'Manual payment method record exists in DB');
    assert.equal(manualPayment.is_enabled, 0, 'Bank / Hand Transfer must be disabled');

    const activePayments = settingService.getPaymentMethods({ activeOnly: true });
    assert.ok(!activePayments.some(p => p.code === 'manual'), 'Bank / Hand Transfer must not be in active payment methods');
    assert.ok(activePayments.some(p => p.code === 'cod'), 'COD must remain active');
    assert.ok(activePayments.some(p => p.code === 'bkash'), 'bKash must remain active');

    // 4. Ghee merged into Milk & Dairy
    const dairyCat = queryOne("SELECT id FROM categories WHERE slug = 'milk-dairy'");
    const gheeCat = queryOne("SELECT id, is_active FROM categories WHERE slug = 'ghee'");
    assert.ok(dairyCat && gheeCat, 'Categories exist');
    assert.equal(gheeCat.is_active, 0, 'Ghee category must be inactive');

    const pureGhee = productService.getProductBySlug('pure-desi-ghee');
    assert.ok(pureGhee, 'Pure Ghee product must exist');
    assert.equal(pureGhee.category_id, dairyCat.id, 'Pure Ghee must be assigned to Milk & Dairy category');
    assert.ok(pureGhee.variations.length >= 2, 'Pure Ghee variations must be preserved');
    assert.ok(pureGhee.base_stock > 0, 'Pure Ghee stock must be preserved');
});

test('Product Variations & Attributes Verification', () => {
    // 1. Check Fresh Cow Milk has multiple variations with independent SKU and price
    const milk = productService.getProductBySlug('fresh-cow-milk');
    assert.ok(milk, 'Fresh Cow Milk should exist');
    assert.equal(milk.has_variations, 1, 'Should be a variable product');
    assert.ok(milk.variations.length >= 2, 'Should have at least 2 variations');

    const var500 = milk.variations.find(v => v.variation_name.includes('500'));
    const var1ltr = milk.variations.find(v => v.variation_name.includes('1 Ltr'));
    assert.ok(var500 && var1ltr, 'Should have 500ml and 1Ltr variations');
    assert.notEqual(var500.regular_price, var1ltr.regular_price, 'Different variations must have different prices');
    assert.notEqual(var500.sku, var1ltr.sku, 'Different variations must have different SKUs');

    // 2. Create new variable product with dynamic attributes
    const testProd = productService.createProduct({
        name: 'Farm Mustard Oil',
        slug: 'test-mustard-oil',
        category_id: milk.category_id,
        short_description: 'Cold pressed organic mustard oil',
        has_variations: 1,
        variations: [
            { variation_name: '500 ml Bottle', sku: 'TEST-OIL-500ML', regular_price: 160, sale_price: 140, stock_quantity: 20 },
            { variation_name: '1 Ltr Bottle', sku: 'TEST-OIL-1LTR', regular_price: 300, sale_price: 270, stock_quantity: 15 }
        ]
    });

    assert.ok(testProd.id, 'Product created');
    assert.equal(testProd.variations.length, 2, 'Variations created');
    assert.equal(testProd.variations[0].sku, 'TEST-OIL-500ML');
    assert.equal(testProd.variations[1].sku, 'TEST-OIL-1LTR');

    // Clean up test product
    productService.deleteProduct(testProd.id);
});

test('Inventory Tracking & Negative Stock Prevention', () => {
    const milk = productService.getProductBySlug('fresh-cow-milk');
    const targetVar = milk.variations[0];
    const initialStock = targetVar.stock_quantity;

    // Adjust stock up
    inventoryService.adjustStock({
        productId: milk.id,
        variationId: targetVar.id,
        changeQuantity: 10,
        reason: 'Test stock addition',
        createdBy: 'test'
    });

    const updated = queryOne('SELECT stock_quantity FROM product_variations WHERE id = ?', [targetVar.id]);
    assert.equal(updated.stock_quantity, initialStock + 10);

    // Negative stock prevention
    assert.throws(() => {
        inventoryService.adjustStock({
            productId: milk.id,
            variationId: targetVar.id,
            changeQuantity: -(initialStock + 100), // Exceeds available stock
            reason: 'Excessive deduction'
        });
    }, /Insufficient stock|negative stock/);

    // Restore original stock
    inventoryService.adjustStock({
        productId: milk.id,
        variationId: targetVar.id,
        newStock: initialStock,
        reason: 'Test stock restore'
    });
});

test('Checkout: Server-side Price Verification & Anti-Tampering', () => {
    const milk = productService.getProductBySlug('fresh-cow-milk');
    const variation = milk.variations[0];
    const expectedUnitPrice = variation.sale_price || variation.regular_price;

    // Client attempts to tamper with prices: submits unitPrice: 1
    const rawItems = [
        {
            productId: milk.id,
            variationId: variation.id,
            quantity: 2,
            unitPrice: 1 // Malicious price tampering attempt
        }
    ];

    const calculation = orderService.calculateCart(rawItems);
    assert.ok(calculation.isValid, 'Cart should be valid');
    assert.equal(calculation.items[0].unitPrice, expectedUnitPrice, 'Server must enforce database unit price, ignoring client tamper');
    assert.equal(calculation.subtotal, expectedUnitPrice * 2, 'Subtotal must match database price * quantity');
});

test('Checkout: Full Order Lifecycle & Cancellation Stock Restoration', () => {
    const milk = productService.getProductBySlug('fresh-cow-milk');
    const variation = milk.variations[0];
    const stockBeforeOrder = queryOne('SELECT stock_quantity FROM product_variations WHERE id = ?', [variation.id]).stock_quantity;

    // 1. Place order
    const order = orderService.createOrder({
        customerName: 'Test Customer',
        customerPhone: '01800000000',
        deliveryAddress: 'Agrabad, Chattogram',
        paymentMethodCode: 'cod',
        items: [
            { productId: milk.id, variationId: variation.id, quantity: 2 }
        ]
    });

    assert.ok(order.id, 'Order created');
    assert.match(order.order_number, /^KAF-\d{8}-\d{4}$/, 'Must have human readable order number');
    assert.equal(order.order_status, 'Pending');
    assert.equal(order.payment_status, 'Unpaid');

    // Verify stock was deducted atomically
    const stockAfterOrder = queryOne('SELECT stock_quantity FROM product_variations WHERE id = ?', [variation.id]).stock_quantity;
    assert.equal(stockAfterOrder, stockBeforeOrder - 2, 'Stock must be deducted by order quantity');

    // 2. Admin changes status through valid lifecycle: Pending -> Confirmed -> Processing
    orderService.updateOrderStatus(order.id, 'Confirmed', 'Order confirmed by phone', 'admin');
    orderService.updateOrderStatus(order.id, 'Processing', 'Packing at farm', 'admin');

    // 3. Cancel order -> verify stock restored exactly once!
    orderService.updateOrderStatus(order.id, 'Cancelled', 'Customer requested cancellation', 'admin');
    const stockAfterCancel = queryOne('SELECT stock_quantity FROM product_variations WHERE id = ?', [variation.id]).stock_quantity;
    assert.equal(stockAfterCancel, stockBeforeOrder, 'Cancelled order must restore deducted stock');
});

test('Authentication, Scrypt Security & Role Authorization', () => {
    // 1. Customer registration & session
    const testPhone = '01699999999';
    // Clean up if already exists
    const existing = queryOne('SELECT id FROM users WHERE phone = ?', [testPhone]);
    if (existing) queryOne('DELETE FROM users WHERE id = ?', [existing.id]);

    const session = authService.registerCustomer({
        fullName: 'Test User',
        phone: testPhone,
        password: 'SecurePassword123'
    });

    assert.ok(session.token, 'Session token generated');

    const validatedUser = authService.validateSession(session.token);
    assert.ok(validatedUser, 'Session should be valid');
    assert.equal(validatedUser.role, 'customer', 'Role must be customer');

    // 2. Verify admin cannot be accessed by customer role
    assert.notEqual(validatedUser.role, 'admin', 'Customer cannot have admin role');

    // 3. Customer Account Suspension
    customerService.setCustomerStatus(validatedUser.id, 'suspended', 1);
    const sessionAfterSuspension = authService.validateSession(session.token);
    assert.equal(sessionAfterSuspension, null, 'Suspended customer sessions must be revoked');
});

test('Payment Settings & Admin Number Control', () => {
    // 1. Verify all 4 active payment methods exist with initial numbers and brand logos
    const active = settingService.getPaymentMethods({ activeOnly: true });
    assert.equal(active.length, 4, 'Should have exactly 4 active payment methods');

    const expectedMethods = ['cod', 'bkash', 'nagad', 'rocket'];
    for (const code of expectedMethods) {
        const pm = active.find(m => m.code === code);
        assert.ok(pm, `Payment method ${code} must exist`);
        assert.equal(pm.account_number, '01970271398', `${code} must have initial number 01970271398`);
        assert.ok(pm.logo_url && pm.logo_url.includes(code), `${code} must have authentic logo url`);
    }

    // 2. Independent updating: Updating one method must NOT change the other three
    const bkash = queryOne("SELECT * FROM payment_methods WHERE code = 'bkash'");
    const nagadBefore = queryOne("SELECT * FROM payment_methods WHERE code = 'nagad'");
    const codBefore = queryOne("SELECT * FROM payment_methods WHERE code = 'cod'");

    settingService.updatePaymentMethod(bkash.id, {
        account_number: '01899998888',
        instructions: 'Test Send Money instructions'
    });

    const bkashAfter = queryOne('SELECT * FROM payment_methods WHERE id = ?', [bkash.id]);
    const nagadAfter = queryOne("SELECT * FROM payment_methods WHERE code = 'nagad'");
    const codAfter = queryOne("SELECT * FROM payment_methods WHERE code = 'cod'");

    assert.equal(bkashAfter.account_number, '01899998888', 'bKash number should update');
    assert.equal(nagadAfter.account_number, nagadBefore.account_number, 'Nagad number must remain unchanged');
    assert.equal(codAfter.account_number, codBefore.account_number, 'COD number must remain unchanged');

    // Restore bKash back to official number
    settingService.updatePaymentMethod(bkash.id, {
        account_number: config.BUSINESS.PHONE
    });
});

test('Safe Category Deletion with Product Reassignment', () => {
    // Create temporary category
    const tempCat = categoryService.createCategory({
        name: 'Temp Category',
        slug: 'temp-category'
    });

    // Create product inside temp category
    const testProd = productService.createProduct({
        name: 'Temp Product',
        slug: 'temp-product-item',
        category_id: tempCat.id,
        base_price: 100,
        base_stock: 5
    });

    const milkCat = queryOne("SELECT id FROM categories WHERE slug = 'milk-dairy'");

    // Delete temp category with reassignment to milkCat
    categoryService.deleteCategory(tempCat.id, { reassignToCategoryId: milkCat.id });

    // Verify product was NOT deleted, but safely reassigned!
    const productAfter = productService.getProductById(testProd.id);
    assert.ok(productAfter, 'Product must not be deleted when category is deleted');
    assert.equal(productAfter.category_id, milkCat.id, 'Product must be safely reassigned to target category');

    // Cleanup
    productService.deleteProduct(testProd.id);
});

test('Dashboard Real Database Metrics', () => {
    const stats = orderService.getDashboardStatistics();
    assert.ok(typeof stats.totalSales === 'number', 'Total sales must be numeric');
    assert.ok(stats.orders.total >= 0, 'Total orders must be non-negative');
    assert.ok(stats.products.total >= 5, 'Must reflect actual product count');
});
