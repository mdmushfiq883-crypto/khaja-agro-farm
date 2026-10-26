// Shop Catalogue View Template
const { formatPrice, escapeHtml } = require('../utils/formatters');

function renderShopView({ categories = [], products = [], currentCategory = null, searchQuery = '', sortBy = 'display_order' }) {
    return `
    <div class="container" style="padding-top: 24px; padding-bottom: 60px;">
        <!-- Breadcrumb & Title -->
        <div style="margin-bottom: 24px;">
            <div style="font-size:0.85rem;color:var(--muted-text);margin-bottom:6px;">
                <a href="/">Home</a> / <span style="color:var(--forest-green);font-weight:600;">Shop</span>
                ${currentCategory ? ` / <span>${escapeHtml(currentCategory.name)}</span>` : ''}
            </div>
            <h1 style="font-size: 2rem; font-weight: 800; color: var(--forest-green);">
                ${currentCategory ? escapeHtml(currentCategory.name) : (searchQuery ? `Search: "${escapeHtml(searchQuery)}"` : 'All Farm Products')}
            </h1>
            ${currentCategory?.description ? `<p style="color:var(--muted-text);margin-top:4px;">${escapeHtml(currentCategory.description)}</p>` : ''}
        </div>

        <!-- Category Filter Pills & Sort Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;background:#fff;padding:14px 18px;border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:28px;">
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <a href="/shop" style="padding:6px 14px;border-radius:9999px;font-size:0.85rem;font-weight:700;background:${!currentCategory ? 'var(--forest-green)' : '#EDF5EC'};color:${!currentCategory ? '#fff' : 'var(--dark-text)'};">
                    All (${products.length})
                </a>
                ${categories.map(c => `
                    <a href="/shop?category=${encodeURIComponent(c.slug)}"
                       style="padding:6px 14px;border-radius:9999px;font-size:0.85rem;font-weight:700;background:${currentCategory?.slug === c.slug ? 'var(--forest-green)' : '#EDF5EC'};color:${currentCategory?.slug === c.slug ? '#fff' : 'var(--dark-text)'};">
                        ${escapeHtml(c.name)}
                    </a>
                `).join('')}
            </div>

            <!-- Sort By -->
            <form action="/shop" method="GET" style="display:flex;align-items:center;gap:8px;">
                ${currentCategory ? `<input type="hidden" name="category" value="${escapeHtml(currentCategory.slug)}">` : ''}
                ${searchQuery ? `<input type="hidden" name="q" value="${escapeHtml(searchQuery)}">` : ''}
                <label style="font-size:0.85rem;font-weight:700;color:var(--muted-text);">Sort By:</label>
                <select name="sort" onchange="this.form.submit()" class="form-control" style="width:auto;padding:6px 12px;font-size:0.85rem;">
                    <option value="display_order" ${sortBy === 'display_order' ? 'selected' : ''}>Featured</option>
                    <option value="price_asc" ${sortBy === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                    <option value="price_desc" ${sortBy === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                    <option value="newest" ${sortBy === 'newest' ? 'selected' : ''}>Newest Arrivals</option>
                </select>
            </form>
        </div>

        <!-- Products Grid -->
        ${products.length === 0 ? `
            <div style="text-align:center;padding:80px 20px;background:#fff;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                <div style="font-size:3rem;margin-bottom:12px;">🌾</div>
                <h3 style="font-size:1.3rem;font-weight:800;color:var(--forest-green);margin-bottom:8px;">No products found</h3>
                <p style="color:var(--muted-text);margin-bottom:18px;">Try adjusting your search or category filter to find what you are looking for.</p>
                <a href="/shop" class="cart-btn-primary" style="display:inline-block;width:auto;padding:10px 24px;">View All Products</a>
            </div>
        ` : `
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

                    return `
                    <div class="product-card">
                        ${prod.badge_text ? `<span class="product-badge badge-fresh">${escapeHtml(prod.badge_text)}</span>` : ''}

                        <a href="/product/${encodeURIComponent(prod.slug)}" class="product-card-img-wrap">
                            <img src="${escapeHtml(initialImage)}" alt="${escapeHtml(prod.name)}" loading="lazy">
                        </a>

                        <div class="product-card-body">
                            <div class="product-card-cat">${escapeHtml(prod.category_name || 'Farm Fresh')}</div>
                            <h3 class="product-card-title">
                                <a href="/product/${encodeURIComponent(prod.slug)}">${escapeHtml(prod.name)}</a>
                            </h3>

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
        `}
    </div>
    `;
}

module.exports = { renderShopView };
