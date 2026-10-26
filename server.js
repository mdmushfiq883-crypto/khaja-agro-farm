// Khaja Agro Farm - Production HTTP Server
const http = require('node:http');
const url = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const querystring = require('node:querystring');

const config = require('./src/config/config');
const { initSchema } = require('./src/db/database');
const { seedDatabase } = require('./src/db/seed');
const { authenticate, requireAuth, requireAdmin } = require('./src/middleware/auth');
const authService = require('./src/services/authService');
const pageRoutes = require('./src/routes/pageRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { renderLoginView, renderRegisterView, renderAccountView } = require('./src/views/customerViews');
const { renderAdminLoginView } = require('./src/views/adminViews');
const { renderLayout } = require('./src/views/layout');
const orderService = require('./src/services/orderService');

// MIME types for static assets
const MIME_TYPES = {
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.html': 'text/html'
};

// Helper: Parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            // 5MB safeguard against payload floods
            if (body.length > 5 * 1024 * 1024) {
                req.destroy();
                reject(new Error('Payload too large.'));
            }
        });
        req.on('end', () => {
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
                try {
                    resolve(JSON.parse(body || '{}'));
                } catch (e) {
                    resolve({});
                }
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                resolve(querystring.parse(body));
            } else {
                resolve(body);
            }
        });
        req.on('error', err => reject(err));
    });
}

// Helper: Serve static files securely
function serveStaticFile(req, res, filePath) {
    const safePath = path.normalize(filePath);
    if (!safePath.startsWith(path.join(config.ROOT_DIR, 'public'))) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File Not Found');
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': ext === '.css' || ext === '.js' ? 'public, max-age=3600' : 'public, max-age=86400',
            'X-Content-Type-Options': 'nosniff'
        });

        fs.createReadStream(safePath).pipe(res);
    });
}

// Request Handler
const server = http.createServer(async (req, res) => {
    try {
        const parsedUrl = new URL(req.url, 'http://localhost');
        const pathname = parsedUrl.pathname;
        const query = Object.fromEntries(parsedUrl.searchParams.entries());
        const method = req.method;

    // Attach user session from cookie
    authenticate(req, res);

    // 1. Static Assets (/css, /js, /images)
    if (pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/images/')) {
        const filePath = path.join(config.ROOT_DIR, 'public', pathname);
        serveStaticFile(req, res, filePath);
        return;
    }

    if (pathname === '/favicon.ico') {
        const filePath = path.join(config.ROOT_DIR, 'public', 'images', 'khaja_agro_logo.png');
        serveStaticFile(req, res, filePath);
        return;
    }

    // 2. Customer Auth Endpoints
    if (pathname === '/login') {
        if (method === 'GET') {
            const html = renderLayout({
                title: 'Customer Login - Khaja Agro Farm',
                content: renderLoginView({ error: query.error, returnUrl: query.returnUrl || '' }),
                user: req.user
            });
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }
        if (method === 'POST') {
            const body = await parseBody(req);
            try {
                const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                const { session, user } = authService.loginUser({
                    identifier: body.identifier,
                    password: body.password,
                    ipAddress: ip,
                    userAgent: req.headers['user-agent']
                });

                res.writeHead(302, {
                    'Set-Cookie': `kaf_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
                    'Location': user.role === 'admin' ? '/admin' : (body.returnUrl || '/account')
                });
                res.end();
            } catch (err) {
                res.writeHead(302, { Location: `/login?error=${encodeURIComponent(err.message)}` });
                res.end();
            }
            return;
        }
    }

    if (pathname === '/register') {
        if (method === 'GET') {
            const html = renderLayout({
                title: 'Register - Khaja Agro Farm',
                content: renderRegisterView({ error: query.error }),
                user: req.user
            });
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }
        if (method === 'POST') {
            const body = await parseBody(req);
            try {
                const session = authService.registerCustomer({
                    fullName: body.fullName,
                    phone: body.phone,
                    email: body.email,
                    password: body.password,
                    address: body.address
                });

                res.writeHead(302, {
                    'Set-Cookie': `kaf_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
                    'Location': '/account'
                });
                res.end();
            } catch (err) {
                res.writeHead(302, { Location: `/register?error=${encodeURIComponent(err.message)}` });
                res.end();
            }
            return;
        }
    }

    if (pathname === '/logout') {
        const cookies = req.headers['cookie'];
        if (cookies) {
            const token = cookies.split(';').find(c => c.trim().startsWith('kaf_session='))?.split('=')[1];
            if (token) authService.destroySession(token.trim());
        }
        res.writeHead(302, {
            'Set-Cookie': 'kaf_session=; Path=/; HttpOnly; Max-Age=0',
            'Location': '/'
        });
        res.end();
        return;
    }

    if (pathname === '/account') {
        if (!requireAuth(req, res)) return;
        const orders = orderService.getCustomerOrders(req.user.id);
        const html = renderLayout({
            title: 'My Account - Khaja Agro Farm',
            content: renderAccountView({ user: req.user, orders }),
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
    }

    if (pathname === '/account/change-password' && method === 'POST') {
        if (!requireAuth(req, res)) return;
        const body = await parseBody(req);
        try {
            authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
            res.writeHead(302, { Location: '/account?success=password' });
            res.end();
        } catch (err) {
            res.writeHead(302, { Location: `/account?error=${encodeURIComponent(err.message)}` });
            res.end();
        }
        return;
    }

    // 3. Admin Login & Protected Portal
    if (pathname === '/admin/login') {
        if (method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(renderAdminLoginView({ error: query.error }));
            return;
        }
        if (method === 'POST') {
            const body = await parseBody(req);
            try {
                const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
                const { session, user } = authService.loginUser({
                    identifier: body.identifier,
                    password: body.password,
                    ipAddress: ip,
                    userAgent: req.headers['user-agent']
                });

                if (user.role !== 'admin') {
                    throw new Error('Access denied: You do not have administrator privileges.');
                }

                res.writeHead(302, {
                    'Set-Cookie': `kaf_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
                    'Location': '/admin'
                });
                res.end();
            } catch (err) {
                res.writeHead(302, { Location: `/admin/login?error=${encodeURIComponent(err.message)}` });
                res.end();
            }
            return;
        }
    }

    // Protect all /admin routes
    if (pathname.startsWith('/admin')) {
        if (!requireAdmin(req, res)) return;

        // Admin Routes Dispatcher
        if (pathname === '/admin') return adminRoutes.dashboard(req, res);
        if (pathname === '/admin/orders') return adminRoutes.orders(req, res, query);

        // Order Detail & Actions
        const orderMatch = pathname.match(/^\/admin\/orders\/(\d+)$/);
        if (orderMatch && method === 'GET') return adminRoutes.orderDetail(req, res, orderMatch[1]);

        const orderStatusMatch = pathname.match(/^\/admin\/orders\/(\d+)\/status$/);
        if (orderStatusMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.updateOrderStatus(req, res, orderStatusMatch[1], body);
        }

        const orderPaymentMatch = pathname.match(/^\/admin\/orders\/(\d+)\/payment$/);
        if (orderPaymentMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.updateOrderPayment(req, res, orderPaymentMatch[1], body);
        }

        const orderNotesMatch = pathname.match(/^\/admin\/orders\/(\d+)\/notes$/);
        if (orderNotesMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.updateOrderNotes(req, res, orderNotesMatch[1], body);
        }

        // Products
        if (pathname === '/admin/products') {
            if (method === 'GET') return adminRoutes.products(req, res);
            if (method === 'POST') {
                const body = await parseBody(req);
                return adminRoutes.saveProduct(req, res, null, body);
            }
        }
        if (pathname === '/admin/products/new') return adminRoutes.productNew(req, res);

        const prodEditMatch = pathname.match(/^\/admin\/products\/(\d+)\/edit$/);
        if (prodEditMatch) return adminRoutes.productEdit(req, res, prodEditMatch[1]);

        const prodSaveMatch = pathname.match(/^\/admin\/products\/(\d+)$/);
        if (prodSaveMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.saveProduct(req, res, prodSaveMatch[1], body);
        }

        const prodDelMatch = pathname.match(/^\/admin\/products\/(\d+)\/delete$/);
        if (prodDelMatch && method === 'POST') return adminRoutes.deleteProduct(req, res, prodDelMatch[1]);

        // Categories
        if (pathname === '/admin/categories') {
            if (method === 'GET') return adminRoutes.categories(req, res, query);
            if (method === 'POST') {
                const body = await parseBody(req);
                return adminRoutes.saveCategory(req, res, null, body);
            }
        }
        const catSaveMatch = pathname.match(/^\/admin\/categories\/(\d+)$/);
        if (catSaveMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.saveCategory(req, res, catSaveMatch[1], body);
        }
        const catDelMatch = pathname.match(/^\/admin\/categories\/(\d+)\/delete$/);
        if (catDelMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.deleteCategory(req, res, catDelMatch[1], body);
        }

        // Attributes & Variations
        if (pathname === '/admin/attributes') {
            if (method === 'GET') return adminRoutes.attributes(req, res);
            if (method === 'POST') {
                const body = await parseBody(req);
                return adminRoutes.createAttribute(req, res, body);
            }
        }
        const attrDelMatch = pathname.match(/^\/admin\/attributes\/(\d+)\/delete$/);
        if (attrDelMatch && method === 'POST') return adminRoutes.deleteAttribute(req, res, attrDelMatch[1]);

        const attrValMatch = pathname.match(/^\/admin\/attributes\/(\d+)\/values$/);
        if (attrValMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.addAttributeValue(req, res, attrValMatch[1], body);
        }

        const attrValDelMatch = pathname.match(/^\/admin\/attributes\/values\/(\d+)\/delete$/);
        if (attrValDelMatch && method === 'POST') return adminRoutes.deleteAttributeValue(req, res, attrValDelMatch[1]);

        // Inventory
        if (pathname === '/admin/inventory') return adminRoutes.inventory(req, res, query);
        if (pathname === '/admin/inventory/adjust' && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.adjustStock(req, res, body);
        }

        // Customers
        if (pathname === '/admin/customers') return adminRoutes.customers(req, res);
        const custStatusMatch = pathname.match(/^\/admin\/customers\/(\d+)\/status$/);
        if (custStatusMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.setCustomerStatus(req, res, custStatusMatch[1], body);
        }

        // Settings (Payments, Delivery, Store, Banners, Social)
        if (pathname === '/admin/payments') return adminRoutes.payments(req, res);
        const paymentUpdateMatch = pathname.match(/^\/admin\/payments\/(\d+)$/);
        if (paymentUpdateMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.updatePayment(req, res, paymentUpdateMatch[1], body);
        }

        if (pathname === '/admin/delivery') {
            if (method === 'GET') return adminRoutes.delivery(req, res);
            if (method === 'POST') {
                const body = await parseBody(req);
                return adminRoutes.updateDelivery(req, res, body);
            }
        }

        if (pathname === '/admin/settings') {
            if (method === 'GET') return adminRoutes.settings(req, res);
            if (method === 'POST') {
                const body = await parseBody(req);
                return adminRoutes.updateSettings(req, res, body);
            }
        }

        if (pathname === '/admin/banners') return adminRoutes.banners(req, res);
        const bannerUpdateMatch = pathname.match(/^\/admin\/banners\/(\d+)$/);
        if (bannerUpdateMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.updateBanner(req, res, bannerUpdateMatch[1], body);
        }

        if (pathname === '/admin/social') return adminRoutes.social(req, res);
        const socialUpdateMatch = pathname.match(/^\/admin\/social\/(\d+)$/);
        if (socialUpdateMatch && method === 'POST') {
            const body = await parseBody(req);
            return adminRoutes.updateSocial(req, res, socialUpdateMatch[1], body);
        }
    }

    // 4. REST APIs
    if (pathname === '/api/orders/checkout' && method === 'POST') {
        const body = await parseBody(req);
        return apiRoutes.handleCheckout(req, res, body);
    }
    if (pathname === '/api/cart/verify' && method === 'POST') {
        const body = await parseBody(req);
        return apiRoutes.handleCartVerify(req, res, body);
    }
    if (pathname === '/api/products' && method === 'GET') {
        return apiRoutes.handleGetProducts(req, res, query);
    }
    const apiProductMatch = pathname.match(/^\/api\/products\/(\d+)$/);
    if (apiProductMatch && method === 'GET') {
        return apiRoutes.handleGetProductById(req, res, apiProductMatch[1]);
    }

    // 5. Storefront Customer Pages
    // Self-heal: If database has zero products (e.g. fresh deployment), auto-populate catalog, payment methods, and admin
    try {
        const { queryOne } = require('./src/db/database');
        const prodCheck = queryOne("SELECT count(*) as count FROM products");
        if (!prodCheck || prodCheck.count === 0) {
            console.log('Zero products detected. Running auto-seed for storefront...');
            seedDatabase();
        }
    } catch (e) {
        console.error('Storefront auto-seed notice:', e.message);
    }

    if (pathname === '/') return pageRoutes.home(req, res);
    if (pathname === '/shop') return pageRoutes.shop(req, res, query);
    if (pathname === '/cart') return pageRoutes.cart(req, res);
    if (pathname === '/checkout') return pageRoutes.checkout(req, res);

    const successMatch = pathname.match(/^\/order\/success\/([^/]+)$/);
    if (successMatch) return pageRoutes.orderSuccess(req, res, decodeURIComponent(successMatch[1]));

    const prodDetailMatch = pathname.match(/^\/product\/([^/]+)$/);
    if (prodDetailMatch) return pageRoutes.productDetail(req, res, decodeURIComponent(prodDetailMatch[1]));

    if (pathname === '/about') return pageRoutes.about(req, res);
    if (pathname === '/contact') return pageRoutes.contact(req, res);
    if (['/privacy-policy', '/terms-conditions', '/return-refund-policy'].includes(pathname)) {
        return pageRoutes.policy(req, res, pathname.slice(1));
    }

        // 404 Not Found
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderLayout({
            title: '404 - Page Not Found | Khaja Agro Farm',
            content: `
            <div class="container" style="padding:100px 20px;text-align:center;">
                <div style="font-size:4rem;color:var(--forest-green);margin-bottom:12px;">🌾</div>
                <h1 style="font-size:2.2rem;font-weight:900;color:var(--forest-green);">404 - Page Not Found</h1>
                <p style="color:var(--muted-text);margin-top:8px;margin-bottom:24px;">The page you are looking for does not exist or has been moved.</p>
                <a href="/" class="cart-btn-primary" style="display:inline-block;width:auto;padding:12px 28px;">Return to Homepage</a>
            </div>
            `,
            user: req.user
        }));
    } catch (err) {
        console.error('Unhandled Server Error:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>500 - Server Error | Khaja Agro Farm</title></head>
            <body style="font-family:sans-serif;padding:60px 20px;text-align:center;background:#FAFAF5;">
                <h1 style="color:#075B35;">An unexpected error occurred</h1>
                <p style="color:#666;">Our team has logged this issue. Please try again or return to the storefront.</p>
                <pre style="background:#fff;border:1px solid #ddd;padding:15px;max-width:700px;margin:20px auto;text-align:left;overflow:auto;color:#c00;">${err.message}\n${err.stack}</pre>
                <a href="/" style="display:inline-block;padding:10px 20px;background:#087A3E;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Return to Home</a>
            </body>
            </html>
            `);
        }
    }
});

// Start Server Function
function startServer(port = config.PORT, host = config.HOST) {
    return new Promise((resolve, reject) => {
        // Initialize schema
        initSchema();

        // Ensure database has initial seed if running on a fresh volume
        try {
            const { queryOne } = require('./src/db/database');
            const adminUser = queryOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
            const prodCheck = queryOne("SELECT count(*) as count FROM products");
            if (!adminUser || !prodCheck || prodCheck.count === 0) {
                console.log('🌱 Empty or unseeded database detected on startup. Initializing Khaja Agro store catalog & admin...');
                seedDatabase();
            } else {
                console.log('💾 Verified persistent database loaded. Existing catalog, orders, and credentials preserved.');
            }
        } catch (seedErr) {
            console.error('Initial auto-seed check notice:', seedErr.message);
        }

        server.listen(port, host, () => {
            console.log(`=======================================================`);
            console.log(`🌱 Khaja Agro Farm E-Commerce Server Running`);
            console.log(`🌐 Storefront URL: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
            console.log(`🛡 Admin Portal:  http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/admin`);
            console.log(`📞 Farm Contact: 01970271398 | mdmudhfiq883@gmail.com`);
            console.log(`📁 Database Path: ${config.DB_PATH}`);
            console.log(`=======================================================`);
            resolve(server);
        });

        server.on('error', err => reject(err));
    });
}

process.on('uncaughtException', (err) => {
    console.error('Critical Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Critical Unhandled Rejection at:', promise, 'reason:', reason);
});

if (require.main === module) {
    startServer();
}

module.exports = { server, startServer };
