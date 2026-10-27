// Master HTML Layout Shell
const config = require('../config/config');
const { escapeHtml } = require('../utils/formatters');
const settingService = require('../services/settingService');
const categoryService = require('../services/categoryService');

function renderSocialIcons(socialLinks = []) {
    // Strictly filter out YouTube and any disabled social platforms
    const active = (socialLinks || []).filter(s => s && s.is_enabled && s.platform !== 'YouTube');

    return active.map(soc => {
        const platform = soc.platform;
        const url = soc.url;

        if (platform === 'Facebook') {
            return `
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="social-icon-circle soc-fb" aria-label="Khaja Agro Farm on Facebook" title="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            </a>`;
        }

        if (platform === 'Instagram') {
            const igUrl = url || 'https://www.instagram.com/khajaagro02/';
            return `
            <a href="${escapeHtml(igUrl)}" target="_blank" rel="noopener noreferrer" class="social-icon-circle soc-ig" aria-label="Khaja Agro Farm on Instagram (@khajaagro02)" title="Instagram (@khajaagro02)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
            </a>`;
        }

        if (platform === 'WhatsApp') {
            return `
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="social-icon-circle soc-wa" aria-label="Chat with Khaja Agro Farm on WhatsApp" title="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
            </a>`;
        }

        return '';
    }).join('');
}

function renderLayout({
    title = 'Khaja Agro Farm - Freshness You Can Trust',
    description = '100% natural, farm-fresh milk, grass-fed beef, desi ghee, fresh greens, and poultry directly from our Karnaphuli farm to your home.',
    content = '',
    user = null,
    activeNav = 'home'
} = {}) {
    const settings = settingService.getAllSettings();
    const categories = categoryService.getAllCategories({ includeInactive: false });
    const paymentMethods = settingService.getPaymentMethods({ activeOnly: true });
    const socialLinks = settingService.getSocialLinks({ activeOnly: true });

    const announcementText = settings.announcement_text || '🌱 Fresh & Healthy Products | From Our Farm To Your Home | 🚚 Free Delivery Over ৳1,500 | 🌿 100% Natural';
    const showAnnouncement = settings.announcement_enabled === '1' || settings.announcement_enabled === 'true';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="icon" type="image/png" href="/images/khaja_agro_logo.png">

    <!-- Open Graph SEO -->
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="/images/khaja_agro_logo.png">
    <meta property="og:type" content="website">

    <!-- Stylesheets -->
    <link rel="stylesheet" href="/css/style.css?v=20261027_v5">
</head>
<body>

    <!-- A. Announcement Bar -->
    ${showAnnouncement ? `
    <div class="announcement-bar">
        <div class="container">
            <div class="announcement-left">
                <span>${escapeHtml(announcementText)}</span>
            </div>
            <div class="announcement-right">
                <span>📞 Hotline: <strong>${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}</strong></span>
            </div>
        </div>
    </div>
    ` : ''}

    <!-- B. Main Header -->
    <header class="main-header">
        <div class="container">
            <!-- Mobile Hamburger Menu Button -->
            <button type="button" class="hamburger-btn js-mobile-nav-toggle" aria-label="Open Navigation Menu" aria-expanded="false" aria-controls="mobile-nav-drawer">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
            </button>

            <!-- Brand Logo -->
            <a href="/" class="brand-logo-wrap">
                <img src="/images/khaja_agro_logo.png" alt="Khaja Agro Farm Logo" class="brand-logo-img" width="48" height="48" style="width:48px;height:48px;max-width:48px;max-height:48px;object-fit:contain;">
                <div class="brand-logo-text">
                    <h1>Khaja Agro Farm</h1>
                    <span>Freshness You Can Trust</span>
                </div>
            </a>

            <!-- Product Search -->
            <div class="header-search">
                <form action="/shop" method="GET">
                    <input type="text" name="q" placeholder="Search for products (e.g. Milk, Beef, Ghee)..." autocomplete="off" required>
                    <button type="submit" aria-label="Search">🔍</button>
                </form>
            </div>

            <!-- Header User & Social Actions -->
            <div class="header-actions">
                <div class="user-auth-links">
                    ${user ? `
                        <a href="${user.role === 'admin' ? '/admin' : '/account'}">👤 ${escapeHtml(user.fullName.split(' ')[0])}</a>
                        <a href="/logout" style="color:var(--danger-red);font-size:0.82rem;">(Logout)</a>
                    ` : `
                        <a href="/login">👤 Login</a>
                        <span style="color:#C8D6CF;">|</span>
                        <a href="/register">👤+ Register</a>
                    `}
                </div>

                <!-- Quick Call Button -->
                <a href="tel:${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}" class="header-hotline-btn" aria-label="Call Hotline">
                    <span>📞</span>
                    <span class="hotline-number-text">${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}</span>
                </a>

                <!-- Mobile Header Cart Button -->
                <button type="button" class="header-mobile-cart js-cart-toggle" aria-label="Open Shopping Cart">
                    <span>🛒</span>
                    <span class="cart-badge-count header-cart-badge">0</span>
                </button>

                <!-- Social Icons -->
                <div class="header-social-icons">
                    ${renderSocialIcons(socialLinks)}
                </div>
            </div>
        </div>
    </header>

    <!-- C. Navigation Menu (Desktop) -->
    <nav class="main-nav">
        <div class="container">
            <div class="nav-left">
                <!-- All Categories Dropdown -->
                <div class="categories-btn-wrap">
                    <button type="button" class="categories-btn">
                        <span>☰</span>
                        <span>All Categories</span>
                        <span style="font-size:0.7rem;">▼</span>
                    </button>
                    <div class="categories-dropdown">
                        ${categories.map(c => `
                            <a href="/shop?category=${encodeURIComponent(c.slug)}">
                                <span>${escapeHtml(c.name)}</span>
                                <span style="font-size:0.75rem;color:var(--muted-text);">(${c.product_count || 0})</span>
                            </a>
                        `).join('')}
                    </div>
                </div>

                <!-- Nav Links -->
                <ul class="nav-links">
                    <li><a href="/" class="${activeNav === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="/shop" class="${activeNav === 'shop' ? 'active' : ''}">Shop</a></li>
                    <li><a href="/about" class="${activeNav === 'about' ? 'active' : ''}">About Us</a></li>
                    <li><a href="/contact" class="${activeNav === 'contact' ? 'active' : ''}">Contact Us</a></li>
                </ul>
            </div>

            <!-- Cart Trigger Button -->
            <button type="button" class="nav-cart-btn js-cart-toggle" aria-label="Open Cart">
                <span>🛒 My Cart</span>
                <span class="cart-badge-count">0</span>
                <span class="cart-nav-total">৳ 0</span>
            </button>
        </div>
    </nav>

    <!-- D. Mobile Category Scroll Strip (Mobile only) -->
    <div class="mobile-category-scroll">
        <a href="/shop" class="mobile-cat-chip ${activeNav === 'shop' ? 'active' : ''}">🔥 All Products</a>
        ${categories.map(c => `
            <a href="/shop?category=${encodeURIComponent(c.slug)}" class="mobile-cat-chip">
                ${escapeHtml(c.name)}
            </a>
        `).join('')}
    </div>

    <!-- Main Content Slot -->
    <main>
        ${content}
    </main>

    <!-- Side Shopping Cart Drawer -->
    <div id="cart-drawer-overlay" class="cart-drawer-overlay"></div>
    <aside id="cart-drawer" class="cart-drawer" aria-label="Shopping Cart">
        <div class="cart-drawer-header">
            <h3>Your Cart (<span class="cart-badge-count">0</span>)</h3>
            <button type="button" class="cart-drawer-close js-cart-close" aria-label="Close Cart">✕</button>
        </div>

        <div id="cart-drawer-items-list" class="cart-drawer-items">
            <!-- Rendered by app.js -->
        </div>

        <div id="cart-drawer-empty" class="cart-drawer-items" style="display:none;text-align:center;padding:60px 20px;">
            <div style="font-size:3rem;margin-bottom:12px;">🛒</div>
            <h4 style="font-size:1.1rem;color:var(--forest-green);margin-bottom:8px;">Your cart is empty</h4>
            <p style="font-size:0.85rem;color:var(--muted-text);margin-bottom:20px;">Explore our fresh farm products and add them to your cart.</p>
            <a href="/shop" class="cart-btn-primary js-cart-close" style="display:inline-block;width:auto;padding:10px 24px;">Start Shopping</a>
        </div>

        <div id="cart-drawer-footer" class="cart-drawer-footer">
            <div class="cart-subtotal-row">
                <span>Subtotal:</span>
                <span id="drawer-subtotal">৳ 0</span>
            </div>
            <a href="/cart" class="cart-btn-secondary js-cart-close" style="margin-bottom:8px;">View Full Cart</a>
            <a href="/checkout" class="cart-btn-primary js-cart-close">Proceed to Checkout →</a>
        </div>
    </aside>

    <!-- Dynamic Variation Selection Modal -->
    <div id="variation-modal" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h3 style="font-size:1.1rem;font-weight:800;color:var(--forest-green);">Choose Product Variation</h3>
                <button type="button" class="cart-drawer-close js-modal-close">✕</button>
            </div>
            <div id="variation-modal-body" class="modal-body">
                <!-- Rendered dynamically -->
            </div>
            <div class="modal-footer">
                <button type="button" class="cart-btn-secondary js-modal-close" style="width:auto;padding:8px 18px;">Cancel</button>
                <button type="button" id="btn-modal-add-to-cart" class="cart-btn-primary" style="width:auto;padding:8px 24px;margin-bottom:0;">Add to Cart</button>
            </div>
        </div>
    </div>

    <!-- I. Footer -->
    <footer class="main-footer">
        <div class="container">
            <div class="footer-grid">
                <!-- Brand Info -->
                <div class="footer-brand">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <img src="/images/khaja_agro_logo.png" alt="Khaja Agro Farm" style="width:48px;height:48px;object-fit:contain;background:#fff;border-radius:50%;padding:2px;">
                        <h3 style="margin-bottom:0;">Khaja Agro Farm</h3>
                    </div>
                    <p>We are committed to providing fresh, healthy and natural food products to support a better and healthier lifestyle.</p>
                    <div class="header-social-icons">
                        ${renderSocialIcons(socialLinks)}
                    </div>
                </div>

                <!-- Quick Links -->
                <div class="footer-col">
                    <h4>Quick Links</h4>
                    <ul class="footer-links">
                        <li><a href="/">Home</a></li>
                        <li><a href="/shop">Shop</a></li>
                        <li><a href="/about">About Us</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                        <li><a href="/faq">FAQ</a></li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div class="footer-col">
                    <h4>Contact Info</h4>
                    <div class="footer-contact-item">
                        <span>📍</span>
                        <span>${escapeHtml(settings.business_address || config.BUSINESS.ADDRESS)}</span>
                    </div>
                    <div class="footer-contact-item">
                        <span>📞</span>
                        <a href="tel:${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}">${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}</a>
                    </div>
                    <div class="footer-contact-item">
                        <span>✉</span>
                        <a href="mailto:${escapeHtml(settings.business_email || config.BUSINESS.EMAIL)}">${escapeHtml(settings.business_email || config.BUSINESS.EMAIL)}</a>
                    </div>
                </div>

                <!-- Payment Methods -->
                <div class="footer-col">
                    <h4>Payment Methods</h4>
                    <div class="footer-payments-grid">
                        ${paymentMethods.map(pm => `
                            <div class="footer-payment-card">
                                <div class="footer-payment-card-text">
                                    <strong>${escapeHtml(pm.name)}</strong>
                                    <span>${escapeHtml(pm.account_number)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Bottom Bar -->
            <div class="footer-bottom-bar">
                <div>
                    © 2026 Khaja Agro Farm. All rights reserved.
                </div>
                <div class="footer-bottom-links">
                    <a href="/privacy-policy">Privacy Policy</a>
                    <a href="/terms-conditions">Terms & Conditions</a>
                    <a href="/return-refund-policy">Return & Refund Policy</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Mobile Fixed Bottom Navigation Bar -->
    <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
        <a href="/" class="mobile-bottom-item ${activeNav === 'home' ? 'active' : ''}">
            <span class="mobile-bottom-icon">🏠</span>
            <span class="mobile-bottom-label">Home</span>
        </a>
        <a href="/shop" class="mobile-bottom-item ${activeNav === 'shop' ? 'active' : ''}">
            <span class="mobile-bottom-icon">🛍️</span>
            <span class="mobile-bottom-label">Shop</span>
        </a>
        <button type="button" class="mobile-bottom-item js-cart-toggle" aria-label="Open Shopping Cart">
            <span class="mobile-bottom-icon mobile-cart-icon-wrap">
                🛒
                <span class="cart-badge-count mobile-cart-badge">0</span>
            </span>
            <span class="mobile-bottom-label">Cart</span>
        </button>
        <a href="https://wa.me/8801970271398?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি খাজা এগ্রো ফার্ম থেকে প্রোডাক্ট অর্ডার করতে চাই।')}" target="_blank" rel="noopener noreferrer" class="mobile-bottom-item mobile-bottom-wa" aria-label="WhatsApp">
            <span class="mobile-bottom-icon">💬</span>
            <span class="mobile-bottom-label">WhatsApp</span>
        </a>
        <a href="${user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'}" class="mobile-bottom-item ${activeNav === 'account' ? 'active' : ''}">
            <span class="mobile-bottom-icon">👤</span>
            <span class="mobile-bottom-label">${user ? (user.role === 'admin' ? 'Admin' : 'Account') : 'Account'}</span>
        </a>
    </nav>
 
    <!-- Mobile Navigation Drawer Overlay -->
    <div id="mobile-nav-overlay" class="mobile-nav-overlay js-mobile-nav-close" style="display:none;" aria-hidden="true"></div>

    <!-- Mobile Navigation Drawer -->
    <aside id="mobile-nav-drawer" class="mobile-nav-drawer" style="display:none;" aria-label="Navigation Menu" aria-hidden="true">
        <div class="mobile-nav-header">
            <div class="mobile-nav-brand">
                <img src="/images/khaja_agro_logo.png" alt="Khaja Agro Farm" class="mobile-nav-logo" width="36" height="36" style="width:36px;height:36px;max-width:36px;max-height:36px;object-fit:contain;">
                <div class="mobile-nav-title-wrap">
                    <h3>Khaja Agro Farm</h3>
                    <span>Pure Food for a Better Life</span>
                </div>
            </div>
            <button type="button" class="mobile-nav-close js-mobile-nav-close" aria-label="Close Navigation Menu">✕</button>
        </div>

        <div class="mobile-nav-body">
            <!-- Navigation Links -->
            <div class="mobile-nav-label">Navigation</div>
            <ul class="mobile-nav-menu">
                <li>
                    <a href="/" class="mobile-nav-item ${activeNav === 'home' ? 'active' : ''}">
                        <span class="nav-ico">🏠</span>
                        <span>Home</span>
                    </a>
                </li>
                <li>
                    <a href="/shop" class="mobile-nav-item ${activeNav === 'shop' ? 'active' : ''}">
                        <span class="nav-ico">🛍️</span>
                        <span>Shop All Products</span>
                    </a>
                </li>
                <li>
                    <a href="/about" class="mobile-nav-item ${activeNav === 'about' ? 'active' : ''}">
                        <span class="nav-ico">🌾</span>
                        <span>About Us</span>
                    </a>
                </li>
                <li>
                    <a href="/contact" class="mobile-nav-item ${activeNav === 'contact' ? 'active' : ''}">
                        <span class="nav-ico">📞</span>
                        <span>Contact Us</span>
                    </a>
                </li>
            </ul>

            <!-- Categories Section -->
            <div class="mobile-nav-label" style="margin-top: 18px;">Product Categories</div>
            <ul class="mobile-nav-categories">
                ${categories.map(c => `
                    <li>
                        <a href="/shop?category=${encodeURIComponent(c.slug)}" class="mobile-cat-link">
                            <span class="cat-bullet">🌿</span>
                            <span class="cat-name">${escapeHtml(c.name)}</span>
                            <span class="cat-count">(${c.product_count || 0})</span>
                        </a>
                    </li>
                `).join('')}
            </ul>

            <!-- User Auth in Drawer -->
            <div class="mobile-nav-label" style="margin-top: 18px;">Customer Portal</div>
            <div class="mobile-nav-auth">
                ${user ? `
                    <div style="font-weight:700;color:var(--forest-green);margin-bottom:8px;">
                        👤 Logged in as: <strong>${escapeHtml(user.fullName)}</strong>
                    </div>
                    <a href="${user.role === 'admin' ? '/admin' : '/account'}" class="cart-btn-secondary" style="padding:8px 14px;margin-bottom:8px;">
                        ${user.role === 'admin' ? '🛡 Admin Panel' : '👤 My Account'}
                    </a>
                    <a href="/logout" style="color:var(--danger-red);font-size:0.88rem;font-weight:700;display:inline-block;padding:4px 0;">Logout</a>
                ` : `
                    <div style="display:flex;gap:10px;">
                        <a href="/login" class="cart-btn-primary" style="flex:1;padding:9px;font-size:0.88rem;margin-bottom:0;">👤 Login</a>
                        <a href="/register" class="cart-btn-secondary" style="flex:1;padding:9px;font-size:0.88rem;">👤+ Register</a>
                    </div>
                `}
            </div>

            <!-- Contact Hotline in Drawer -->
            <div class="mobile-nav-label" style="margin-top: 20px;">Direct Farm Contact</div>
            <div class="mobile-nav-contact">
                <a href="tel:${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}" class="mobile-contact-pill">
                    <span>📞 Phone:</span>
                    <strong>${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}</strong>
                </a>
                <a href="https://wa.me/8801970271398?text=${encodeURIComponent('Hello Khaja Agro Farm, I would like to order.')}" target="_blank" rel="noopener noreferrer" class="mobile-contact-pill wa">
                    <span>💬 WhatsApp:</span>
                    <strong>01970271398</strong>
                </a>
                <div class="mobile-nav-socials" style="margin-top:14px;">
                    ${renderSocialIcons(socialLinks)}
                </div>
            </div>
        </div>
    </aside>

    <!-- App Scripts -->
    <script src="/js/app.js?v=20261027_v5"></script>
</body>
</html>`;
}

module.exports = { renderLayout };
