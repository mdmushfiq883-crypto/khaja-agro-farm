// REST APIs for Storefront Cart, Checkout, and Products
const orderService = require('../services/orderService');
const productService = require('../services/productService');
const authService = require('../services/authService');
const { checkRateLimit } = require('../middleware/rateLimiter');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

class ApiRoutes {
    // POST /api/orders/checkout
    async handleCheckout(req, res, body) {
        if (!checkRateLimit(req, res, 15, 60000)) return;

        try {
            const customerId = req.user ? req.user.id : null;
            const order = orderService.createOrder({
                customerId,
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                customerEmail: body.customerEmail,
                deliveryAddress: body.deliveryAddress,
                deliveryCity: body.deliveryCity || 'Chattogram',
                customerNotes: body.customerNotes,
                items: body.items,
                paymentMethodCode: body.paymentMethodCode,
                transactionReference: body.transactionReference,
                idempotencyKey: body.idempotencyKey || null
            });

            sendJson(res, 201, { success: true, order });
        } catch (err) {
            sendJson(res, 400, { success: false, error: err.message });
        }
    }

    // POST /api/cart/verify
    handleCartVerify(req, res, body) {
        try {
            const result = orderService.calculateCart(body.items, body.deliveryCity || 'Chattogram');
            sendJson(res, 200, result);
        } catch (err) {
            sendJson(res, 400, { error: err.message });
        }
    }

    // GET /api/products
    handleGetProducts(req, res, query) {
        try {
            const products = productService.getAllProducts({
                categoryId: query.category_id ? Number(query.category_id) : null,
                categorySlug: query.category || null,
                search: query.q || null,
                sortBy: query.sort || 'display_order',
                isActive: 1,
                limit: query.limit ? Number(query.limit) : 50
            });
            sendJson(res, 200, products);
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
    }

    // GET /api/products/:id
    handleGetProductById(req, res, id) {
        try {
            const product = productService.getProductById(id);
            if (!product) {
                sendJson(res, 404, { error: 'Product not found.' });
                return;
            }
            sendJson(res, 200, product);
        } catch (err) {
            sendJson(res, 500, { error: err.message });
        }
    }
}

module.exports = new ApiRoutes();
