// Product Detail View Template
const { formatPrice, escapeHtml } = require('../utils/formatters');

function renderProductDetailView({ product }) {
    const hasVars = product.has_variations && product.variations && product.variations.length > 0;
    const initialVar = hasVars ? product.variations[0] : null;

    const initialPrice = initialVar
        ? (initialVar.sale_price !== null ? initialVar.sale_price : initialVar.regular_price)
        : (product.base_sale_price !== null ? product.base_sale_price : product.base_price);

    const initialRegPrice = initialVar ? initialVar.regular_price : product.base_price;
    const initialStock = initialVar ? initialVar.stock_quantity : product.base_stock;
    const initialSku = initialVar ? initialVar.sku : `PRD-${product.id}`;
    const initialImage = (initialVar && initialVar.image_url) ? initialVar.image_url : (product.featured_image || '/images/khaja_agro_logo.png');

    return `
    <div class="container" style="padding-top: 28px; padding-bottom: 60px;">
        <!-- Breadcrumb -->
        <div style="font-size:0.88rem;color:var(--muted-text);margin-bottom:20px;">
            <a href="/">Home</a> / <a href="/shop">Shop</a>
            ${product.category_slug ? ` / <a href="/shop?category=${encodeURIComponent(product.category_slug)}">${escapeHtml(product.category_name)}</a>` : ''}
            / <span style="color:var(--forest-green);font-weight:600;">${escapeHtml(product.name)}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;background:#fff;padding:32px;border-radius:var(--radius-lg);border:1px solid var(--border-color);margin-bottom:40px;">
            <!-- Product Gallery Column -->
            <div>
                <div style="background:#FAFAF5;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;display:flex;align-items:center;justify-content:center;height:380px;margin-bottom:16px;">
                    <img id="detail-main-img" src="${escapeHtml(initialImage)}" alt="${escapeHtml(product.name)}" style="max-height:320px;max-width:100%;object-fit:contain;">
                </div>
            </div>

            <!-- Product Details Column -->
            <div style="display:flex;flex-direction:column;">
                <div style="font-size:0.85rem;font-weight:700;color:var(--muted-text);text-transform:uppercase;margin-bottom:6px;">
                    ${escapeHtml(product.category_name || 'Farm Fresh')}
                </div>

                <h1 style="font-size:2rem;font-weight:800;color:var(--forest-green);line-height:1.2;margin-bottom:8px;">
                    ${escapeHtml(product.name)}
                </h1>

                <div style="font-size:0.85rem;color:var(--muted-text);margin-bottom:14px;">
                    SKU: <strong id="detail-sku" style="color:var(--dark-text);">${escapeHtml(initialSku)}</strong>
                </div>

                <!-- Price Box -->
                <div style="background:#EDF5EC;padding:14px 20px;border-radius:var(--radius-md);display:flex;align-items:baseline;gap:12px;margin-bottom:20px;">
                    <span id="detail-price" style="font-size:2rem;font-weight:900;color:var(--forest-green);">
                        ${formatPrice(initialPrice)}
                    </span>
                    <span id="detail-regular-price" style="font-size:1.1rem;color:#9E9E9E;text-decoration:line-through;${initialRegPrice > initialPrice ? '' : 'display:none;'}">
                        ${formatPrice(initialRegPrice)}
                    </span>
                    <span id="detail-stock-badge" style="margin-left:auto;font-size:0.82rem;font-weight:700;padding:4px 10px;border-radius:9999px;background:${initialStock > 0 ? '#E8F5E9' : '#FFEBEE'};color:${initialStock > 0 ? '#2E7D32' : '#C62828'};">
                        ${initialStock > 0 ? `In Stock (${initialStock} available)` : 'Out of Stock'}
                    </span>
                </div>

                <!-- Short description -->
                <p style="font-size:0.95rem;color:#3C5247;margin-bottom:24px;line-height:1.6;">
                    ${escapeHtml(product.short_description || '')}
                </p>

                <!-- Dynamic Variation Selector -->
                ${hasVars ? `
                <div style="margin-bottom:24px;border-top:1px solid #F0F4EF;padding-top:18px;">
                    <label style="display:block;font-size:0.92rem;font-weight:800;color:var(--forest-green);margin-bottom:10px;">
                        Choose Variation / Size:
                    </label>
                    <div style="display:flex;flex-wrap:wrap;gap:10px;" id="detail-var-list">
                        ${product.variations.map((v, idx) => {
                            const vPrice = v.sale_price !== null ? v.sale_price : v.regular_price;
                            const isSelected = idx === 0;
                            return `
                            <button type="button" class="btn-detail-var ${isSelected ? 'active' : ''}"
                                data-var-id="${v.id}"
                                data-var-name="${escapeHtml(v.variation_name)}"
                                data-sku="${escapeHtml(v.sku)}"
                                data-price="${vPrice}"
                                data-regular-price="${v.regular_price}"
                                data-stock="${v.stock_quantity}"
                                data-image="${escapeHtml(v.image_url || product.featured_image || '')}"
                                style="padding:10px 16px;border-radius:var(--radius-sm);border:2px solid ${isSelected ? 'var(--primary-green)' : 'var(--border-color)'};background:${isSelected ? 'var(--light-sage)' : '#fff'};color:var(--dark-text);font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.15s;">
                                ${escapeHtml(v.variation_name)} — ${formatPrice(vPrice)}
                            </button>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Quantity and Add to Cart -->
                <div style="display:flex;align-items:center;gap:16px;margin-top:auto;">
                    <div style="display:flex;align-items:center;border:2px solid var(--border-color);border-radius:var(--radius-sm);background:#fff;padding:4px 8px;">
                        <button type="button" id="detail-qty-minus" style="border:none;background:none;font-size:1.1rem;font-weight:800;color:var(--forest-green);cursor:pointer;padding:4px 10px;">-</button>
                        <span id="detail-qty-val" style="font-weight:800;font-size:1.05rem;padding:0 10px;">1</span>
                        <button type="button" id="detail-qty-plus" style="border:none;background:none;font-size:1.1rem;font-weight:800;color:var(--forest-green);cursor:pointer;padding:4px 10px;">+</button>
                    </div>

                    <button type="button" id="detail-add-btn" class="cart-btn-primary" style="flex:1;padding:14px 28px;margin-bottom:0;font-size:1rem;" ${initialStock <= 0 ? 'disabled' : ''}>
                        <span>🛒</span>
                        <span>${initialStock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Full Detailed Description & Farm Highlights -->
        <div style="background:#fff;padding:32px;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
            <h3 style="font-size:1.35rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;border-bottom:2px solid var(--light-sage);padding-bottom:10px;">
                Product Information & Farm Promise
            </h3>
            <div style="line-height:1.8;color:#2F4F3F;font-size:0.96rem;">
                ${escapeHtml(product.description || product.short_description || '')}
            </div>
        </div>
    </div>

    <!-- Client Script for Interactive Dynamic Variation Switching -->
    <script>
    document.addEventListener('DOMContentLoaded', () => {
        let currentVarId = ${initialVar ? initialVar.id : 'null'};
        let currentPrice = ${initialPrice};
        let currentRegPrice = ${initialRegPrice};
        let currentStock = ${initialStock};
        let currentImage = '${initialImage}';
        let currentName = '${escapeHtml(product.name)}';
        let currentVarName = '${initialVar ? escapeHtml(initialVar.variation_name) : ''}';
        let qty = 1;

        const mainImg = document.getElementById('detail-main-img');
        const skuEl = document.getElementById('detail-sku');
        const priceEl = document.getElementById('detail-price');
        const regPriceEl = document.getElementById('detail-regular-price');
        const stockBadge = document.getElementById('detail-stock-badge');
        const addBtn = document.getElementById('detail-add-btn');
        const qtyVal = document.getElementById('detail-qty-val');
        const qtyMinus = document.getElementById('detail-qty-minus');
        const qtyPlus = document.getElementById('detail-qty-plus');

        // Quantity controls
        qtyMinus.onclick = () => { if (qty > 1) { qty--; qtyVal.textContent = qty; } };
        qtyPlus.onclick = () => { if (qty < currentStock) { qty++; qtyVal.textContent = qty; } };

        // Variation switching
        const varButtons = document.querySelectorAll('.btn-detail-var');
        varButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                varButtons.forEach(b => {
                    b.style.borderColor = 'var(--border-color)';
                    b.style.background = '#fff';
                });
                btn.style.borderColor = 'var(--primary-green)';
                btn.style.background = 'var(--light-sage)';

                currentVarId = Number(btn.getAttribute('data-var-id'));
                currentVarName = btn.getAttribute('data-var-name');
                currentPrice = Number(btn.getAttribute('data-price'));
                currentRegPrice = Number(btn.getAttribute('data-regular-price'));
                currentStock = Number(btn.getAttribute('data-stock'));
                const newImg = btn.getAttribute('data-image');
                if (newImg) {
                    currentImage = newImg;
                    mainImg.src = newImg;
                }

                skuEl.textContent = btn.getAttribute('data-sku');
                priceEl.textContent = window.KAF.formatMoney(currentPrice);

                if (currentRegPrice > currentPrice) {
                    regPriceEl.textContent = window.KAF.formatMoney(currentRegPrice);
                    regPriceEl.style.display = 'inline';
                } else {
                    regPriceEl.style.display = 'none';
                }

                if (currentStock > 0) {
                    stockBadge.textContent = 'In Stock (' + currentStock + ' available)';
                    stockBadge.style.background = '#E8F5E9';
                    stockBadge.style.color = '#2E7D32';
                    addBtn.disabled = false;
                    addBtn.innerHTML = '<span>🛒</span> <span>Add to Cart</span>';
                } else {
                    stockBadge.textContent = 'Out of Stock';
                    stockBadge.style.background = '#FFEBEE';
                    stockBadge.style.color = '#C62828';
                    addBtn.disabled = true;
                    addBtn.innerHTML = '<span>Out of Stock</span>';
                }
            });
        });

        // Add to Cart
        addBtn.onclick = () => {
            window.KAF.addToCart({
                productId: ${product.id},
                variationId: currentVarId,
                productName: currentName,
                variationName: currentVarName || null,
                unitPrice: currentPrice,
                regularPrice: currentRegPrice,
                image: currentImage,
                quantity: qty
            });
        };
    });
    </script>
    `;
}

module.exports = { renderProductDetailView };
