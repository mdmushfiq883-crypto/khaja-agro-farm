// Khaja Agro Farm - In-Process HTTP Server & Storefront Integration Tests
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { Readable } = require('node:stream');
const { server } = require('../server');
const productService = require('../src/services/productService');

function mockRequest(urlPath, { method = 'GET', headers = {}, body = null } = {}) {
    return new Promise((resolve) => {
        const req = new Readable({
            read() {
                if (body) {
                    this.push(typeof body === 'object' ? JSON.stringify(body) : body);
                }
                this.push(null);
            }
        });

        req.url = urlPath;
        req.method = method;
        req.headers = {
            host: 'localhost:3000',
            ...headers
        };
        req.socket = { remoteAddress: '127.0.0.1' };

        let resData = '';
        const res = new EventEmitter();
        res.statusCode = 200;
        res.headers = {};

        res.writeHead = (status, hdrs = {}) => {
            res.statusCode = status;
            res.headers = { ...res.headers, ...hdrs };
        };
        res.setHeader = (name, val) => {
            res.headers[name.toLowerCase()] = val;
        };
        res.getHeader = (name) => res.headers[name.toLowerCase()];
        res.write = (chunk) => {
            resData += chunk ? chunk.toString() : '';
        };
        res.end = (chunk) => {
            if (chunk) resData += chunk.toString();
            resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                body: resData
            });
        };

        server.emit('request', req, res);
    });
}

test('HTTP Server In-Process Suite', async (t) => {
    await t.test('1. Homepage and HTML Layout', async () => {
        const res = await mockRequest('/');
        assert.equal(res.statusCode, 200);
        assert.match(res.body, /Khaja Agro Farm/);
        assert.match(res.body, /Pure Food for a Better Life/);
        assert.match(res.body, /Shop by Category/);
        assert.match(res.body, /01970271398/);
        assert.match(res.body, /class="mobile-bottom-nav"/, 'Must render mobile bottom navigation bar');
        assert.match(res.body, /class="mobile-category-scroll"/, 'Must render mobile category scroll bar');
        assert.match(res.body, /class="header-hotline-btn"/, 'Must render mobile/desktop header hotline button');
        assert.match(res.body, /class="hamburger-btn js-mobile-nav-toggle"/, 'Must render mobile hamburger menu button');
        assert.match(res.body, /id="mobile-nav-drawer"/, 'Must render mobile navigation drawer');
        assert.match(res.body, /Contact Us/, 'Must render Contact Us navigation link');
        assert.match(res.body, /About Us/, 'Must render About Us navigation link');
    });

    await t.test('2. Product Search & Catalog Filtering', async () => {
        const res = await mockRequest('/shop?q=milk');
        assert.equal(res.statusCode, 200);
        assert.match(res.body, /Fresh Cow Milk/);
    });

    await t.test('3. Product Details with Dynamic Variations and Direct Order Now Button', async () => {
        const res = await mockRequest('/product/fresh-cow-milk');
        assert.equal(res.statusCode, 200);
        assert.match(res.body, /MILK-500ML|MILK-1LTR/);
        assert.match(res.body, /Choose Variation \/ Size/);
        assert.match(res.body, /id="detail-add-btn"/, 'Must render Add to Cart button');
        assert.match(res.body, /id="detail-order-btn"/, 'Must render Order Now button');
        assert.match(res.body, /btn-detail-add-cart/, 'Must have btn-detail-add-cart CSS class');
        assert.match(res.body, /btn-detail-order-now/, 'Must have btn-detail-order-now CSS class');
        assert.match(res.body, /Add to Cart/);
        assert.match(res.body, /Order Now/);
    });

    await t.test('3b. Product Details without Variations (Direct Order Now & Add to Cart)', async () => {
        const res = await mockRequest('/product/broiler-chicken');
        assert.equal(res.statusCode, 200);
        assert.match(res.body, /Broiler Chicken/);
        assert.match(res.body, /id="detail-add-btn"/, 'Must render Add to Cart button');
        assert.match(res.body, /id="detail-order-btn"/, 'Must render Order Now button');
        assert.doesNotMatch(res.body, /Choose Variation \/ Size/, 'Non-variable product must not render variation choices');
    });

    await t.test('4. Security: Admin Route Protection (Unauthenticated 302)', async () => {
        const adminRes = await mockRequest('/admin');
        assert.equal(adminRes.statusCode, 302);
        assert.match(adminRes.headers.Location, /\/admin\/login/);

        const ordersRes = await mockRequest('/admin/orders');
        assert.equal(ordersRes.statusCode, 302);
        assert.match(ordersRes.headers.Location, /\/admin\/login/);
    });

    await t.test('5. REST API: Cart Verification with Price Tampering Rejection', async () => {
        const milk = productService.getProductBySlug('fresh-cow-milk');
        const variation = milk.variations[0];

        const res = await mockRequest('/api/cart/verify', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: {
                items: [
                    { productId: milk.id, variationId: variation.id, quantity: 2, unitPrice: 1 } // Tampered price
                ]
            }
        });

        assert.equal(res.statusCode, 200);
        const data = JSON.parse(res.body);
        assert.equal(data.isValid, true);
        assert.notEqual(data.items[0].unitPrice, 1, 'Server must reject manipulated price');
        assert.equal(data.subtotal, (variation.sale_price || variation.regular_price) * 2);
    });

    await t.test('6. REST API: Checkout & Atomic Order Placement', async () => {
        const milk = productService.getProductBySlug('fresh-cow-milk');
        const variation = milk.variations[0];

        const res = await mockRequest('/api/orders/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: {
                customerName: 'Live Test Customer',
                customerPhone: '01855554444',
                deliveryAddress: 'Karnaphuli, Chattogram',
                paymentMethodCode: 'cod',
                items: [
                    { productId: milk.id, variationId: variation.id, quantity: 1 }
                ]
            }
        });

        assert.equal(res.statusCode, 201);
        const data = JSON.parse(res.body);
        assert.equal(data.success, true);
        assert.match(data.order.order_number, /^KAF-\d{8}-\d{4}$/);

        // 6b. Validation: Reject invalid phone numbers
        const badPhoneRes = await mockRequest('/api/orders/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: {
                customerName: 'Bad Phone',
                customerPhone: '01855',
                deliveryAddress: 'Chittagong',
                paymentMethodCode: 'cod',
                items: [{ productId: milk.id, variationId: variation.id, quantity: 1 }]
            }
        });
        assert.equal(badPhoneRes.statusCode, 400);

        // 6c. Validation: Reject mobile banking without TrxID
        const noTrxRes = await mockRequest('/api/orders/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: {
                customerName: 'Mobile Banking User',
                customerPhone: '01855554444',
                deliveryAddress: 'Chittagong',
                paymentMethodCode: 'bkash',
                transactionReference: '',
                items: [{ productId: milk.id, variationId: variation.id, quantity: 1 }]
            }
        });
        assert.equal(noTrxRes.statusCode, 400);

        // 6d. Idempotency prevents duplicate order records
        const idemKey = 'test_idem_' + Date.now();
        const idemRes1 = await mockRequest('/api/orders/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: {
                customerName: 'Idem Customer',
                customerPhone: '01855554444',
                deliveryAddress: 'Chittagong',
                paymentMethodCode: 'cod',
                idempotencyKey: idemKey,
                items: [{ productId: milk.id, variationId: variation.id, quantity: 1 }]
            }
        });
        assert.equal(idemRes1.statusCode, 201);
        const idemData1 = JSON.parse(idemRes1.body);

        const idemRes2 = await mockRequest('/api/orders/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: {
                customerName: 'Idem Customer',
                customerPhone: '01855554444',
                deliveryAddress: 'Chittagong',
                paymentMethodCode: 'cod',
                idempotencyKey: idemKey,
                items: [{ productId: milk.id, variationId: variation.id, quantity: 1 }]
            }
        });
        assert.equal(idemRes2.statusCode, 201);
        const idemData2 = JSON.parse(idemRes2.body);
        assert.equal(idemData1.order.id, idemData2.order.id, 'Idempotent request must return the existing order without duplicates');
    });

    await t.test('7. Admin Portal Views Render without Exceptions', async () => {
        const authService = require('../src/services/authService');
        const { session } = authService.loginUser({ identifier: '01970271398', password: 'KhajaAgro@2026' });
        const adminHeaders = { cookie: `kaf_session=${session.token}` };

        const adminPaths = [
            '/admin',
            '/admin/orders',
            '/admin/products',
            '/admin/inventory',
            '/admin/categories',
            '/admin/attributes',
            '/admin/customers',
            '/admin/payments',
            '/admin/delivery',
            '/admin/settings',
            '/admin/banners',
            '/admin/social'
        ];

        for (const p of adminPaths) {
            const res = await mockRequest(p, { headers: adminHeaders });
            assert.equal(res.statusCode, 200, `Admin route ${p} failed with status ${res.statusCode}`);
            assert.match(res.body, /Khaja Agro Farm|Admin/, `Admin route ${p} response unexpected`);
        }
    });

    await t.test('8. Master Refinements: Socials, Instagram, Bank Transfer Removal, Ghee Merge', async () => {
        // A. Homepage social links and category cards
        const homeRes = await mockRequest('/');
        assert.equal(homeRes.statusCode, 200);

        // 1. YouTube must be absent from footer and header
        assert.doesNotMatch(homeRes.body, /youtube\.com/i, 'YouTube link must not appear');
        assert.doesNotMatch(homeRes.body, /soc-yt/i, 'YouTube icon class must not appear');

        // 2. Realistic SVG icons for Facebook, Instagram, WhatsApp
        assert.match(homeRes.body, /class="social-icon-circle soc-fb"/, 'Facebook icon must be present');
        assert.match(homeRes.body, /class="social-icon-circle soc-ig"/, 'Instagram icon must be present');
        assert.match(homeRes.body, /class="social-icon-circle soc-wa"/, 'WhatsApp icon must be present');
        assert.match(homeRes.body, /<svg width="18" height="18"/, 'Icons must render authentic SVG vectors');

        // 3. Instagram URL updated to khajaagro02
        assert.match(homeRes.body, /https:\/\/www\.instagram\.com\/khajaagro02\//, 'Instagram must link to official username khajaagro02');

        // 4. Separate Ghee category card must NOT appear on homepage
        assert.doesNotMatch(homeRes.body, /href="\/shop\?category=ghee"/, 'Separate Ghee category card must not be rendered');
        assert.match(homeRes.body, /href="\/shop\?category=milk-dairy"/, 'Milk & Dairy category must be rendered');

        // B. Redirect from /shop?category=ghee to /shop?category=milk-dairy
        const gheeRedirectRes = await mockRequest('/shop?category=ghee');
        assert.equal(gheeRedirectRes.statusCode, 301, 'Old ghee category URL must 301 redirect');
        assert.equal(gheeRedirectRes.headers.Location, '/shop?category=milk-dairy');

        // C. Milk & Dairy category page lists both Fresh Cow Milk and Pure Ghee
        const dairyRes = await mockRequest('/shop?category=milk-dairy');
        assert.equal(dairyRes.statusCode, 200);
        assert.match(dairyRes.body, /Fresh Cow Milk/, 'Dairy category must list Fresh Cow Milk');
        assert.match(dairyRes.body, /Pure Ghee/, 'Dairy category must list Pure Ghee');

        // D. Checkout page excludes Bank / Hand Transfer and displays 4 professional cards
        const checkoutRes = await mockRequest('/checkout');
        assert.equal(checkoutRes.statusCode, 200);
        assert.doesNotMatch(checkoutRes.body, /Bank \/ Hand Transfer/, 'Bank / Hand Transfer must not appear on checkout');
        assert.doesNotMatch(checkoutRes.body, /value="manual"/, 'Manual payment value must not appear on checkout');
        assert.match(checkoutRes.body, /Cash on Delivery/, 'Cash on Delivery must remain on checkout');
        assert.match(checkoutRes.body, /bKash Send Money/, 'bKash Send Money must remain on checkout');
        assert.match(checkoutRes.body, /Nagad Send Money/, 'Nagad Send Money must remain on checkout');
        assert.match(checkoutRes.body, /Rocket Send Money/, 'Rocket Send Money must remain on checkout');
        assert.match(checkoutRes.body, /class="checkout-payments-grid"/, 'Checkout must render payments grid');
        assert.match(checkoutRes.body, /01970271398/, 'Must show initial number 01970271398');
        assert.match(checkoutRes.body, /class="btn-copy-pm js-copy-btn"/, 'Must render copy-number buttons');

        // E. Footer payment cards: original restored appearance
        assert.match(homeRes.body, /class="footer-payments-grid"/, 'Footer must render payments grid');
        assert.match(homeRes.body, /class="footer-payment-card"/, 'Footer must render payment cards');
        assert.match(homeRes.body, /class="footer-payment-card-text"/, 'Footer must render payment card text');
        assert.match(homeRes.body, /01970271398/, 'Footer must show payment numbers');

        // F. Static SVG Asset Serving
        const bkashSvgRes = await mockRequest('/images/payments/bkash.svg');
        assert.equal(bkashSvgRes.statusCode, 200, 'bkash.svg should return 200');
        assert.equal(bkashSvgRes.headers['Content-Type'], 'image/svg+xml');

        const codSvgRes = await mockRequest('/images/payments/cod.svg');
        assert.equal(codSvgRes.statusCode, 200, 'cod.svg should return 200');
        assert.equal(codSvgRes.headers['Content-Type'], 'image/svg+xml');
    });
});
