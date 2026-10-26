// Homepage View Template
const { formatPrice, escapeHtml } = require('../utils/formatters');

function renderHomeView({ categories = [], products = [], slides = [] }) {
    const mainSlide = slides[0] || {
        title: 'Khaja Agro Farm',
        subtitle: 'Fresh • Healthy • Natural',
        promo_text: 'We bring you fresh and natural products from our farm to your home. Quality, purity and health is our promise.',
        button_text: 'Shop Now',
        link_url: '/shop',
        image_url: '/images/hero/hero_banner_clean.png'
    };

    return `
    <!-- E. Hero Banner Section -->
    <section class="hero-section">
        <div class="container">
            <div class="hero-banner-container">
                <div class="hero-slide">
                    <img src="${escapeHtml(mainSlide.image_url)}" alt="Khaja Agro Farm Fresh Products" class="hero-bg-img">
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <div class="hero-subtitle">${escapeHtml(mainSlide.subtitle)}</div>
                        <h2 class="hero-title">Khaja <span>Agro Farm</span></h2>
                        <div class="hero-tagline">Pure Food for a Better Life</div>
                        <p class="hero-desc">${escapeHtml(mainSlide.promo_text)}</p>
                        <a href="${escapeHtml(mainSlide.link_url)}" class="hero-cta-btn">
                            <span>${escapeHtml(mainSlide.button_text)}</span>
                            <span>→</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- F. Shop by Category Section -->
    <section class="container" style="margin-bottom: 40px;">
        <div class="section-heading-wrap">
            <h2 class="section-title">Shop by Category</h2>
            <p class="section-subtitle">Explore our fresh and quality products</p>
        </div>

        <div class="categories-grid">
            ${categories.map(cat => `
                <a href="/shop?category=${encodeURIComponent(cat.slug)}" class="category-card">
                    <div class="category-card-img-wrap">
                        <img src="${cat.image_url || '/images/categories/milk-dairy.png'}" alt="${escapeHtml(cat.name)}" loading="lazy">
                    </div>
                    <div class="category-card-footer">
                        <span class="category-card-name">${escapeHtml(cat.name)}</span>
                        <span class="category-card-arrow">→</span>
                    </div>
                </a>
            `).join('')}
        </div>
    </section>

    <!-- G. Latest Products Section -->
    <section class="container">
        <div class="products-section-header">
            <div>
                <h2 class="section-title" style="text-align:left;">Latest Products</h2>
                <p class="section-subtitle">Fresh Arrivals — Best Quality, Always</p>
            </div>
            <a href="/shop" class="view-all-link">
                <span>View All Products</span>
                <span>→</span>
            </a>
        </div>

        <div class="products-grid">
            ${products.map(prod => {
                const hasVars = prod.has_variations && prod.variations && prod.variations.length > 0;
                let displayPrice = prod.base_price;
                let regularPrice = prod.base_price;
                let hasDiscount = false;
                let initialImage = prod.featured_image || '/images/khaja_agro_logo.png';

                if (hasVars) {
                    const firstVar = prod.variations[0];
                    displayPrice = firstVar.sale_price !== null ? firstVar.sale_price : firstVar.regular_price;
                    regularPrice = firstVar.regular_price;
                    hasDiscount = firstVar.sale_price !== null && firstVar.sale_price < firstVar.regular_price;
                    initialImage = firstVar.image_url || prod.featured_image;
                } else {
                    displayPrice = prod.base_sale_price !== null ? prod.base_sale_price : prod.base_price;
                    regularPrice = prod.base_price;
                    hasDiscount = prod.base_sale_price !== null && prod.base_sale_price < prod.base_price;
                }

                let badgeClass = 'badge-fresh';
                if (prod.badge_text === 'Best Seller') badgeClass = 'badge-bestseller';
                if (prod.badge_text === 'Popular') badgeClass = 'badge-popular';
                if (prod.badge_text === 'New') badgeClass = 'badge-new';

                return `
                <div class="product-card">
                    ${prod.badge_text ? `<span class="product-badge ${badgeClass}">${escapeHtml(prod.badge_text)}</span>` : ''}

                    <a href="/product/${encodeURIComponent(prod.slug)}" class="product-card-img-wrap">
                        <img src="${escapeHtml(initialImage)}" alt="${escapeHtml(prod.name)}" loading="lazy">
                    </a>

                    <div class="product-card-body">
                        <div class="product-card-cat">${escapeHtml(prod.category_name || 'Farm Fresh')}</div>
                        <h3 class="product-card-title">
                            <a href="/product/${encodeURIComponent(prod.slug)}">${escapeHtml(prod.name)}</a>
                        </h3>

                        <div class="product-card-rating">
                            ★★★★★ <span>(4.8)</span>
                        </div>

                        <div class="product-card-price-wrap">
                            <span class="price-current">${formatPrice(displayPrice)}</span>
                            ${hasDiscount ? `<span class="price-regular">${formatPrice(regularPrice)}</span>` : ''}
                        </div>

                        <div class="product-card-action">
                            <button type="button" class="btn-add-to-cart js-add-to-cart"
                                data-product-id="${prod.id}"
                                data-has-variations="${prod.has_variations ? '1' : '0'}"
                                data-name="${escapeHtml(prod.name)}"
                                data-price="${displayPrice}"
                                data-regular-price="${regularPrice}"
                                data-image="${escapeHtml(initialImage)}">
                                <span>🛒</span>
                                <span>${hasVars ? 'Select Options' : 'Add to Cart'}</span>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    </section>

    <!-- H. Trust and Service Section -->
    <section class="container">
        <div class="trust-strip">
            <div class="trust-grid">
                <div class="trust-item">
                    <div class="trust-icon">🌱</div>
                    <div class="trust-text">
                        <h4>100% Fresh & Natural</h4>
                        <p>Pure from our Karnaphuli farm</p>
                    </div>
                </div>

                <div class="trust-item">
                    <div class="trust-icon">🛡</div>
                    <div class="trust-text">
                        <h4>Secure Ordering</h4>
                        <p>Safe verified payment methods</p>
                    </div>
                </div>

                <div class="trust-item">
                    <div class="trust-icon">🚚</div>
                    <div class="trust-text">
                        <h4>Reliable Delivery</h4>
                        <p>Fast delivery to your home</p>
                    </div>
                </div>

                <div class="trust-item">
                    <div class="trust-icon">📞</div>
                    <div class="trust-text">
                        <h4>Direct Hotline</h4>
                        <p>01970271398 for orders & inquiry</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    `;
}

module.exports = { renderHomeView };
