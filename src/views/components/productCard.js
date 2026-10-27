// Shared Product Card Component for Home, Shop, Category & Search Views
const { formatPrice, escapeHtml } = require('../../utils/formatters');

function renderProductCard(prod) {
    const hasVars = Boolean(prod.has_variations && prod.variations && prod.variations.length > 0);
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
                <button type="button" class="btn-card-action btn-card-cart js-add-to-cart"
                    data-product-id="${prod.id}"
                    data-has-variations="${prod.has_variations ? '1' : '0'}"
                    data-name="${escapeHtml(prod.name)}"
                    data-price="${displayPrice}"
                    data-regular-price="${regularPrice}"
                    data-image="${escapeHtml(initialImage)}"
                    title="Add to Cart"
                    aria-label="Add ${escapeHtml(prod.name)} to cart">
                    <span class="btn-icon">🛒</span>
                    <span class="btn-text-full">Add to Cart</span>
                    <span class="btn-text-short">Cart</span>
                </button>
                <button type="button" class="btn-card-action btn-card-order js-order-now"
                    data-product-id="${prod.id}"
                    data-has-variations="${prod.has_variations ? '1' : '0'}"
                    data-name="${escapeHtml(prod.name)}"
                    data-price="${displayPrice}"
                    data-regular-price="${regularPrice}"
                    data-image="${escapeHtml(initialImage)}"
                    title="Order Now"
                    aria-label="Order ${escapeHtml(prod.name)} now">
                    <span class="btn-icon">⚡</span>
                    <span class="btn-text-full">Order Now</span>
                    <span class="btn-text-short">Order</span>
                </button>
            </div>
        </div>
    </div>
    `;
}

module.exports = { renderProductCard };
