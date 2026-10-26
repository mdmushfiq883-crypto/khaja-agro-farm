// Storefront & Admin Page Controllers
const { renderLayout } = require('../views/layout');
const { renderHomeView } = require('../views/homeView');
const { renderShopView } = require('../views/shopView');
const { renderProductDetailView } = require('../views/productDetailView');
const { renderCheckoutView } = require('../views/checkoutView');
const { renderOrderSuccessView } = require('../views/orderSuccessView');
const { renderLoginView, renderRegisterView, renderAccountView } = require('../views/customerViews');
const { renderAdminLayout, renderAdminDashboardView, renderAdminLoginView } = require('../views/adminViews');
const { renderAdminOrdersView, renderAdminOrderDetailView } = require('../views/adminOrdersView');
const { renderAdminProductsView, renderAdminProductEditView } = require('../views/adminProductsView');
const { renderAdminInventoryView } = require('../views/adminInventoryView');
const { renderAdminCategoriesView } = require('../views/adminCategoriesView');
const { renderAdminAttributesView } = require('../views/adminAttributesView');
const {
    renderAdminPaymentsView,
    renderAdminDeliveryView,
    renderAdminStoreSettingsView,
    renderAdminBannersView,
    renderAdminSocialView,
    renderAdminCustomersView
} = require('../views/adminSettingsView');

const productService = require('../services/productService');
const categoryService = require('../services/categoryService');
const attributeService = require('../services/attributeService');
const inventoryService = require('../services/inventoryService');
const orderService = require('../services/orderService');
const settingService = require('../services/settingService');
const customerService = require('../services/customerService');
const config = require('../config/config');

class PageRoutes {
    // GET /
    home(req, res) {
        const categories = categoryService.getAllCategories({ includeInactive: false });
        const products = productService.getAllProducts({ isActive: 1, limit: 10 });
        const slides = settingService.getSlides({ activeOnly: true });

        const body = renderHomeView({ categories, products, slides });
        const html = renderLayout({
            title: 'Khaja Agro Farm - Fresh & Natural Farm Products',
            content: body,
            user: req.user,
            activeNav: 'home'
        });

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    // GET /shop
    shop(req, res, query) {
        // Safe redirect for merged Ghee category into Milk & Dairy
        if (query.category === 'ghee') {
            res.writeHead(301, { 'Location': '/shop?category=milk-dairy' });
            res.end();
            return;
        }

        const categories = categoryService.getAllCategories({ includeInactive: false });
        const categorySlug = query.category || null;
        const searchQuery = query.q || null;
        const sortBy = query.sort || 'display_order';

        let currentCategory = null;
        if (categorySlug) {
            currentCategory = categoryService.getCategoryBySlug(categorySlug);
        }

        const products = productService.getAllProducts({
            categorySlug,
            search: searchQuery,
            sortBy,
            isActive: 1,
            limit: 50
        });

        const body = renderShopView({
            categories,
            products,
            currentCategory,
            searchQuery,
            sortBy
        });

        const html = renderLayout({
            title: currentCategory ? `${currentCategory.name} - Khaja Agro Farm` : 'Farm Shop - Khaja Agro Farm',
            content: body,
            user: req.user,
            activeNav: 'shop'
        });

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    // GET /product/:slug
    productDetail(req, res, slug) {
        const product = productService.getProductBySlug(slug);
        if (!product || !product.is_active) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(renderLayout({
                title: 'Product Not Found - Khaja Agro Farm',
                content: `<div class="container" style="padding:80px 20px;text-align:center;"><h2>Product Not Found</h2><p>The requested farm product is unavailable.</p><a href="/shop" class="cart-btn-primary" style="display:inline-block;width:auto;margin-top:16px;">Go to Shop</a></div>`,
                user: req.user
            }));
            return;
        }

        const body = renderProductDetailView({ product });
        const html = renderLayout({
            title: `${product.name} - Khaja Agro Farm`,
            description: product.short_description || product.description,
            content: body,
            user: req.user,
            activeNav: 'shop'
        });

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    // GET /cart
    cart(req, res) {
        const body = `
        <div class="container" style="padding:40px 16px 80px;max-width:880px;">
            <h1 style="font-size:2rem;font-weight:900;color:var(--forest-green);margin-bottom:24px;">Your Shopping Cart</h1>
            <div id="full-cart-container" style="background:#fff;padding:28px;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                <div id="full-cart-list"></div>
                <div style="border-top:1px solid #EDF5EC;padding-top:20px;display:flex;justify-content:space-between;align-items:center;margin-top:20px;">
                    <div>
                        <div style="font-size:0.9rem;color:var(--muted-text);">Estimated Subtotal:</div>
                        <div id="full-cart-subtotal" style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">৳ 0</div>
                    </div>
                    <div style="display:flex;gap:12px;">
                        <a href="/shop" class="cart-btn-secondary" style="width:auto;padding:12px 20px;">Continue Shopping</a>
                        <a href="/checkout" class="cart-btn-primary" style="width:auto;padding:12px 28px;margin-bottom:0;">Proceed to Checkout →</a>
                    </div>
                </div>
            </div>
        </div>
        <script>
        document.addEventListener('DOMContentLoaded', () => {
            const list = document.getElementById('full-cart-list');
            const subtotalEl = document.getElementById('full-cart-subtotal');
            const cart = window.KAF.AppState.cart;

            if (cart.length === 0) {
                list.innerHTML = '<div style="text-align:center;padding:40px;"><p style="font-size:1.1rem;color:var(--muted-text);margin-bottom:14px;">Your cart is empty.</p><a href="/shop" class="cart-btn-primary" style="display:inline-block;width:auto;">Explore Shop</a></div>';
                subtotalEl.textContent = '৳ 0';
                return;
            }

            list.innerHTML = cart.map(item => \`
                <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #F0F4EF;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <img src="\${item.image || '/images/khaja_agro_logo.png'}" style="width:54px;height:54px;object-fit:contain;background:#F8FAF7;border-radius:6px;border:1px solid #E2EAE1;">
                        <div>
                            <div style="font-weight:800;font-size:1rem;color:var(--dark-text);">\${item.productName}</div>
                            \${item.variationName ? \`<div style="font-size:0.8rem;color:var(--muted-text);">Option: \${item.variationName}</div>\` : ''}
                            <div style="font-size:0.85rem;color:var(--forest-green);font-weight:700;">\${window.KAF.formatMoney(item.unitPrice)} each</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.15rem;font-weight:900;color:var(--forest-green);">\${window.KAF.formatMoney(item.unitPrice * item.quantity)}</div>
                        <div style="font-size:0.8rem;color:var(--muted-text);">Qty: \${item.quantity}</div>
                    </div>
                </div>
            \`).join('');

            const subtotal = cart.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
            subtotalEl.textContent = window.KAF.formatMoney(subtotal);
        });
        </script>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderLayout({ title: 'Shopping Cart - Khaja Agro Farm', content: body, user: req.user }));
    }

    // GET /checkout
    checkout(req, res) {
        const body = renderCheckoutView({ user: req.user });
        const html = renderLayout({
            title: 'Checkout - Khaja Agro Farm',
            content: body,
            user: req.user
        });

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    // GET /order/success/:orderNumber
    orderSuccess(req, res, orderNumber) {
        const order = orderService.getOrderByNumber(orderNumber);
        if (!order) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(renderLayout({
                title: 'Order Not Found',
                content: '<div class="container" style="padding:60px 20px;text-align:center;"><h2>Order Not Found</h2></div>',
                user: req.user
            }));
            return;
        }

        const body = renderOrderSuccessView({ order });
        const html = renderLayout({
            title: `Order #${order.order_number} Confirmed - Khaja Agro Farm`,
            content: body,
            user: req.user
        });

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    // GET /about
    about(req, res) {
        const settings = settingService.getAllSettings();
        const body = `
        <div class="container" style="padding:40px 16px 80px;max-width:920px;">
            <div style="text-align:center;margin-bottom:36px;">
                <img src="/images/khaja_agro_logo.png" style="width:80px;height:80px;margin:0 auto 12px;object-fit:contain;">
                <h1 style="font-size:2.4rem;font-weight:900;color:var(--forest-green);">About Khaja Agro Farm</h1>
                <p style="font-size:1.05rem;color:var(--muted-text);">Pure Food for a Better Life — Farm to Home in Chattogram</p>
            </div>

            <div style="background:#fff;padding:36px;border-radius:var(--radius-lg);border:1px solid var(--border-color);line-height:1.8;color:#2F4F3F;font-size:1rem;">
                <h2 style="color:var(--forest-green);font-size:1.4rem;margin-bottom:12px;">Our Farm Story</h2>
                <p style="margin-bottom:18px;">
                    Located conveniently adjacent to Vellapara Bridge in Shikalbaha, Karnaphuli, Chattogram (ভেল্লাপাড়া ব্রিজ সংলগ্ন, শিকলবাহা, কর্ণফুলী, চট্টগ্রাম।),
                    <strong>Khaja Agro Farm</strong> was founded on a steadfast mission: to reconnect families with unadulterated, wholesome food straight from the pasture.
                </p>

                <h2 style="color:var(--forest-green);font-size:1.4rem;margin-bottom:12px;">What Sets Us Apart</h2>
                <ul style="margin-left:24px;margin-bottom:20px;">
                    <li><strong>100% Raw Whole Cow Milk:</strong> Chilled and bottled immediately after early morning and evening milking. Zero chemical stabilizers or water dilution.</li>
                    <li><strong>Grass-Fed Halal Beef:</strong> Naturally raised cattle on organic green fodder, prepared in strict compliance with halal standards.</li>
                    <li><strong>Danedar Pure Desi Ghee:</strong> Slow-cooked using traditional bilona techniques from cultured butter.</li>
                    <li><strong>Naturally Grown Vegetables:</strong> Plucked fresh daily from nutrient-rich soil without synthetic chemical sprays.</li>
                </ul>

                <h2 style="color:var(--forest-green);font-size:1.4rem;margin-bottom:12px;">Farm Location & Outlets</h2>
                <p>
                    <strong>Main Farm:</strong> ${settings.business_address || config.BUSINESS.ADDRESS}<br>
                    <strong>Direct Hotline / WhatsApp:</strong> ${settings.business_phone || config.BUSINESS.PHONE}<br>
                    <strong>Email:</strong> ${settings.business_email || config.BUSINESS.EMAIL}
                </p>
            </div>
        </div>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderLayout({ title: 'About Us - Khaja Agro Farm', content: body, user: req.user, activeNav: 'about' }));
    }

    // GET /contact
    contact(req, res) {
        const settings = settingService.getAllSettings();
        const body = `
        <div class="container" style="padding:40px 16px 80px;max-width:880px;">
            <div style="text-align:center;margin-bottom:32px;">
                <h1 style="font-size:2.2rem;font-weight:900;color:var(--forest-green);">Contact Khaja Agro Farm</h1>
                <p style="color:var(--muted-text);">We are always available to take your orders and answer your questions</p>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
                <div style="background:#fff;padding:28px;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                    <h3 style="font-size:1.2rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;">Direct Channels</h3>

                    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
                        <span style="font-size:1.3rem;">📍</span>
                        <div>
                            <strong>Farm Address:</strong>
                            <div style="font-size:0.9rem;color:var(--dark-text);margin-top:2px;">${settings.business_address || config.BUSINESS.ADDRESS}</div>
                        </div>
                    </div>

                    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
                        <span style="font-size:1.3rem;">📞</span>
                        <div>
                            <strong>Phone & WhatsApp:</strong>
                            <div><a href="tel:${settings.business_phone || config.BUSINESS.PHONE}" style="color:var(--primary-green);font-weight:800;font-size:1.05rem;">${settings.business_phone || config.BUSINESS.PHONE}</a></div>
                        </div>
                    </div>

                    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
                        <span style="font-size:1.3rem;">✉</span>
                        <div>
                            <strong>Email Inquiries:</strong>
                            <div><a href="mailto:${settings.business_email || config.BUSINESS.EMAIL}" style="color:var(--primary-green);font-weight:700;">${settings.business_email || config.BUSINESS.EMAIL}</a></div>
                        </div>
                    </div>

                    <a href="https://wa.me/8801970271398" target="_blank" class="cart-btn-primary" style="background:#25D366;text-align:center;margin-top:14px;">
                        💬 Chat Directly on WhatsApp
                    </a>
                </div>

                <div style="background:#fff;padding:28px;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                    <h3 style="font-size:1.2rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;">Send Us a Message</h3>
                    <form onsubmit="alert('Thank you for contacting Khaja Agro Farm. Our representative will call you shortly.'); return false;">
                        <div class="form-group">
                            <label class="form-label">Your Name *</label>
                            <input type="text" class="form-control" required placeholder="Karim Ullah">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mobile Number *</label>
                            <input type="tel" class="form-control" required placeholder="01700000000">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Message / Inquiry *</label>
                            <textarea rows="3" class="form-control" required placeholder="e.g. Daily milk subscription inquiry"></textarea>
                        </div>
                        <button type="submit" class="cart-btn-primary">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderLayout({ title: 'Contact Us - Khaja Agro Farm', content: body, user: req.user, activeNav: 'contact' }));
    }

    // Policy Pages
    policy(req, res, policyType) {
        let title = 'Privacy Policy';
        let contentText = 'Khaja Agro Farm respects your privacy. We collect customer contact and delivery addresses strictly for order processing and delivery coordination. We never sell or share customer data with third parties.';

        if (policyType === 'terms-conditions') {
            title = 'Terms and Conditions';
            contentText = 'All orders placed through Khaja Agro Farm are fulfilled based on daily farm fresh availability. Delivery fees are applied according to area policies. Products should be stored under proper refrigerated temperature.';
        } else if (policyType === 'return-refund-policy') {
            title = 'Return and Refund Policy';
            contentText = 'We guarantee 100% farm freshness. If any perishable food item (fresh milk, beef, vegetables) is delivered in damaged or unsatisfactory condition, please notify our hotline (01970271398) within 2 hours of delivery for an immediate replacement or full refund.';
        }

        const body = `
        <div class="container" style="padding:40px 16px 80px;max-width:800px;">
            <h1 style="font-size:2rem;font-weight:900;color:var(--forest-green);margin-bottom:20px;">${title}</h1>
            <div style="background:#fff;padding:32px;border-radius:var(--radius-lg);border:1px solid var(--border-color);line-height:1.8;">
                <p>${contentText}</p>
            </div>
        </div>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderLayout({ title: `${title} - Khaja Agro Farm`, content: body, user: req.user }));
    }
}

module.exports = new PageRoutes();
