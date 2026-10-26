// Admin Products and Variations Management Views
const { escapeHtml, formatPrice } = require('../utils/formatters');

function renderAdminProductsView({ products = [], categories = [] }) {
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Farm Products Catalog (${products.length})
        </h1>
        <a href="/admin/products/new" class="cart-btn-primary" style="width:auto;padding:10px 20px;margin-bottom:0;">
            + Add New Product
        </a>
    </div>

    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Type & Variations</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${products.length === 0 ? `
                    <tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted-text);">No products in catalog.</td></tr>
                ` : products.map(p => {
                    const hasVars = p.has_variations && p.variations && p.variations.length > 0;
                    return `
                    <tr>
                        <td style="width:50px;">
                            <img src="${p.featured_image || '/images/khaja_agro_logo.png'}" style="width:44px;height:44px;object-fit:contain;background:#FAFCF9;border-radius:4px;border:1px solid var(--border-color);">
                        </td>
                        <td>
                            <strong>${escapeHtml(p.name)}</strong>
                            <div style="font-size:0.75rem;color:var(--muted-text);">/${escapeHtml(p.slug)}</div>
                            ${p.badge_text ? `<span style="font-size:0.7rem;background:#E8F5E9;color:#2E7D32;padding:2px 6px;border-radius:4px;font-weight:700;">${escapeHtml(p.badge_text)}</span>` : ''}
                        </td>
                        <td>${escapeHtml(p.category_name || 'Uncategorized')}</td>
                        <td>
                            ${hasVars ? `
                                <span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:4px;font-weight:700;font-size:0.78rem;">
                                    Variable (${p.variations.length} options)
                                </span>
                            ` : `
                                <span style="background:#EDF5EC;color:var(--dark-text);padding:2px 8px;border-radius:4px;font-weight:600;font-size:0.78rem;">
                                    Simple
                                </span>
                            `}
                        </td>
                        <td>
                            ${hasVars ? `
                                <strong>${formatPrice(p.min_variation_price)} - ${formatPrice(p.max_variation_price)}</strong>
                            ` : `
                                <strong>${formatPrice(p.base_sale_price || p.base_price)}</strong>
                                ${p.base_sale_price ? `<span style="font-size:0.75rem;color:#9E9E9E;text-decoration:line-through;">${formatPrice(p.base_price)}</span>` : ''}
                            `}
                        </td>
                        <td>
                            <strong>${hasVars ? p.total_variation_stock : p.base_stock}</strong> units
                        </td>
                        <td>
                            <span style="font-size:0.78rem;font-weight:700;color:${p.is_active ? '#2E7D32' : '#C62828'};">
                                ${p.is_active ? '● Active' : '○ Draft'}
                            </span>
                        </td>
                        <td>
                            <div style="display:flex;gap:8px;">
                                <a href="/admin/products/${p.id}/edit" class="cart-btn-secondary" style="padding:4px 8px;font-size:0.78rem;width:auto;">Edit</a>
                                <form action="/admin/products/${p.id}/delete" method="POST" onsubmit="return confirm('Are you sure you want to delete this product?');" style="display:inline;">
                                    <button type="submit" style="background:none;border:none;color:#C62828;cursor:pointer;font-size:0.8rem;padding:4px 6px;">Delete</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>
    `;
}

function renderAdminProductEditView({ product = null, categories = [], attributes = [] }) {
    const isEdit = !!product;
    const hasVars = product ? Boolean(product.has_variations) : false;

    return `
    <div style="margin-bottom:24px;">
        <a href="/admin/products" style="color:var(--forest-green);font-weight:700;font-size:0.9rem;">
            ← Back to Products List
        </a>
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);margin-top:8px;">
            ${isEdit ? `Edit Product: ${escapeHtml(product.name)}` : 'Add New Farm Product'}
        </h1>
    </div>

    <form action="${isEdit ? `/admin/products/${product.id}` : '/admin/products'}" method="POST" style="background:#fff;padding:28px;border-radius:var(--radius-lg);border:1px solid var(--border-color);box-shadow:var(--shadow-sm);">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:28px;">
            <!-- Left: Basic info & Variations -->
            <div>
                <div class="form-group">
                    <label class="form-label" for="name">Product Name *</label>
                    <input type="text" id="name" name="name" class="form-control" value="${isEdit ? escapeHtml(product.name) : ''}" required placeholder="e.g. Fresh Cow Milk">
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div class="form-group">
                        <label class="form-label" for="slug">URL Slug</label>
                        <input type="text" id="slug" name="slug" class="form-control" value="${isEdit ? escapeHtml(product.slug) : ''}" placeholder="fresh-cow-milk (auto-generated if empty)">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="category_id">Category *</label>
                        <select id="category_id" name="category_id" class="form-control" required>
                            <option value="">Select Category...</option>
                            ${categories.map(c => `
                                <option value="${c.id}" ${product?.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="short_description">Short Summary</label>
                    <textarea id="short_description" name="short_description" rows="2" class="form-control" placeholder="1-2 sentences highlighting farm freshness">${isEdit ? escapeHtml(product.short_description || '') : ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label" for="description">Detailed Description & Farm Process</label>
                    <textarea id="description" name="description" rows="4" class="form-control" placeholder="Complete details regarding source, harvesting, nutritional facts, preparation">${isEdit ? escapeHtml(product.description || '') : ''}</textarea>
                </div>

                <!-- Product Type Selector (Simple vs Variable) -->
                <div style="background:#FAFCF9;padding:18px;border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:20px;">
                    <label class="form-label" style="font-size:0.95rem;margin-bottom:8px;">Product Variation Type</label>
                    <div style="display:flex;gap:24px;">
                        <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer;">
                            <input type="radio" name="has_variations" value="0" ${!hasVars ? 'checked' : ''} id="type-simple">
                            Simple Product (Single price & stock)
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer;">
                            <input type="radio" name="has_variations" value="1" ${hasVars ? 'checked' : ''} id="type-variable">
                            Variable Product (Multiple sizes, weights, or packaging)
                        </label>
                    </div>
                </div>

                <!-- Simple Product Pricing & Stock Box -->
                <div id="simple-box" style="display:${!hasVars ? 'block' : 'none'};background:#EDF5EC;padding:18px;border-radius:var(--radius-md);margin-bottom:20px;">
                    <h4 style="font-size:0.95rem;font-weight:800;color:var(--forest-green);margin-bottom:12px;">Simple Product Pricing & Stock</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">
                        <div class="form-group">
                            <label class="form-label">Regular Price (৳) *</label>
                            <input type="number" step="0.01" name="base_price" class="form-control" value="${isEdit ? product.base_price : 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Sale Price (৳)</label>
                            <input type="number" step="0.01" name="base_sale_price" class="form-control" value="${isEdit && product.base_sale_price ? product.base_sale_price : ''}" placeholder="Optional discount">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Initial Stock Quantity *</label>
                            <input type="number" name="base_stock" class="form-control" value="${isEdit ? product.base_stock : 10}">
                        </div>
                    </div>
                </div>

                <!-- Variable Product Variations Box -->
                <div id="variable-box" style="display:${hasVars ? 'block' : 'none'};background:#FAFAF5;padding:20px;border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                        <h4 style="font-size:1rem;font-weight:800;color:var(--forest-green);">Product Variations</h4>
                        <button type="button" id="btn-add-var-row" class="cart-btn-secondary" style="width:auto;padding:6px 14px;font-size:0.85rem;">
                            + Add Variation
                        </button>
                    </div>

                    <div id="variations-container" style="display:flex;flex-direction:column;gap:12px;">
                        ${isEdit && product.variations ? product.variations.map((v, i) => `
                            <div class="var-row" style="background:#fff;border:1px solid var(--border-color);border-radius:6px;padding:12px;display:grid;grid-template-columns:1.5fr 1.2fr 1fr 1fr 1fr auto;gap:10px;align-items:center;">
                                <input type="hidden" name="variation_id[]" value="${v.id}">
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Name (e.g. 500 ml)</label>
                                    <input type="text" name="variation_name[]" value="${escapeHtml(v.variation_name)}" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">SKU *</label>
                                    <input type="text" name="variation_sku[]" value="${escapeHtml(v.sku)}" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Regular ৳</label>
                                    <input type="number" step="0.01" name="variation_regular_price[]" value="${v.regular_price}" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Sale ৳</label>
                                    <input type="number" step="0.01" name="variation_sale_price[]" value="${v.sale_price !== null ? v.sale_price : ''}" class="form-control" style="padding:6px 8px;font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Stock</label>
                                    <input type="number" name="variation_stock[]" value="${v.stock_quantity}" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                                </div>
                                <div style="padding-top:16px;">
                                    <button type="button" class="btn-remove-var" style="background:none;border:none;color:#C62828;font-size:1.1rem;cursor:pointer;">✕</button>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="var-row" style="background:#fff;border:1px solid var(--border-color);border-radius:6px;padding:12px;display:grid;grid-template-columns:1.5fr 1.2fr 1fr 1fr 1fr auto;gap:10px;align-items:center;">
                                <input type="hidden" name="variation_id[]" value="">
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Name (e.g. 500 ml)</label>
                                    <input type="text" name="variation_name[]" value="500 ml" class="form-control" style="padding:6px 8px;font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">SKU *</label>
                                    <input type="text" name="variation_sku[]" value="" placeholder="e.g. PRD-500ML" class="form-control" style="padding:6px 8px;font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Regular ৳</label>
                                    <input type="number" step="0.01" name="variation_regular_price[]" value="180" class="form-control" style="padding:6px 8px;font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Sale ৳</label>
                                    <input type="number" step="0.01" name="variation_sale_price[]" value="150" class="form-control" style="padding:6px 8px;font-size:0.85rem;">
                                </div>
                                <div>
                                    <label style="font-size:0.75rem;font-weight:700;">Stock</label>
                                    <input type="number" name="variation_stock[]" value="30" class="form-control" style="padding:6px 8px;font-size:0.85rem;">
                                </div>
                                <div style="padding-top:16px;">
                                    <button type="button" class="btn-remove-var" style="background:none;border:none;color:#C62828;font-size:1.1rem;cursor:pointer;">✕</button>
                                </div>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Right: Settings, Image & Status -->
            <div>
                <div style="background:#FAFCF9;padding:20px;border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:20px;">
                    <h4 style="font-size:0.95rem;font-weight:800;color:var(--forest-green);margin-bottom:14px;">Publish Settings</h4>

                    <div class="form-group">
                        <label class="form-label">Visibility Status</label>
                        <select name="is_active" class="form-control">
                            <option value="1" ${product?.is_active ? 'selected' : ''}>Published (Active on Storefront)</option>
                            <option value="0" ${product && !product.is_active ? 'selected' : ''}>Draft (Hidden)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Promotional Badge</label>
                        <select name="badge_text" class="form-control">
                            <option value="" ${!product?.badge_text ? 'selected' : ''}>None</option>
                            <option value="Fresh" ${product?.badge_text === 'Fresh' ? 'selected' : ''}>Fresh</option>
                            <option value="Best Seller" ${product?.badge_text === 'Best Seller' ? 'selected' : ''}>Best Seller</option>
                            <option value="Popular" ${product?.badge_text === 'Popular' ? 'selected' : ''}>Popular</option>
                            <option value="New" ${product?.badge_text === 'New' ? 'selected' : ''}>New</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Display Order</label>
                        <input type="number" name="display_order" class="form-control" value="${product?.display_order || 0}">
                    </div>

                    <div class="form-group">
                        <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer;font-size:0.88rem;">
                            <input type="checkbox" name="is_featured" value="1" ${product?.is_featured ? 'checked' : ''}>
                            Featured Product on Homepage
                        </label>
                    </div>
                </div>

                <div style="background:#FAFCF9;padding:20px;border-radius:var(--radius-md);border:1px solid var(--border-color);">
                    <h4 style="font-size:0.95rem;font-weight:800;color:var(--forest-green);margin-bottom:14px;">Featured Image</h4>
                    <div class="form-group">
                        <label class="form-label">Image Path / URL</label>
                        <input type="text" id="featured_image" name="featured_image" class="form-control"
                               value="${product?.featured_image || '/images/products/fresh-milk-1ltr.png'}">
                    </div>

                    <div style="text-align:center;background:#fff;border:1px solid var(--border-color);border-radius:6px;padding:12px;margin-top:10px;">
                        <img id="preview-img" src="${product?.featured_image || '/images/products/fresh-milk-1ltr.png'}" style="max-height:120px;margin:0 auto;object-fit:contain;">
                    </div>
                </div>

                <button type="submit" class="cart-btn-primary" style="margin-top:24px;padding:14px;font-size:1rem;">
                    ${isEdit ? 'Save Changes' : 'Create Product'}
                </button>
            </div>
        </div>
    </form>

    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const typeSimple = document.getElementById('type-simple');
        const typeVariable = document.getElementById('type-variable');
        const simpleBox = document.getElementById('simple-box');
        const variableBox = document.getElementById('variable-box');
        const container = document.getElementById('variations-container');
        const addBtn = document.getElementById('btn-add-var-row');
        const imgInput = document.getElementById('featured_image');
        const previewImg = document.getElementById('preview-img');

        imgInput.addEventListener('input', () => {
            previewImg.src = imgInput.value || '/images/khaja_agro_logo.png';
        });

        typeSimple.addEventListener('change', () => {
            simpleBox.style.display = 'block';
            variableBox.style.display = 'none';
        });

        typeVariable.addEventListener('change', () => {
            simpleBox.style.display = 'none';
            variableBox.style.display = 'block';
        });

        addBtn.addEventListener('click', () => {
            const div = document.createElement('div');
            div.className = 'var-row';
            div.style.cssText = 'background:#fff;border:1px solid var(--border-color);border-radius:6px;padding:12px;display:grid;grid-template-columns:1.5fr 1.2fr 1fr 1fr 1fr auto;gap:10px;align-items:center;';
            div.innerHTML = \`
                <input type="hidden" name="variation_id[]" value="">
                <div>
                    <label style="font-size:0.75rem;font-weight:700;">Name (e.g. 1 Ltr)</label>
                    <input type="text" name="variation_name[]" value="" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;">SKU *</label>
                    <input type="text" name="variation_sku[]" value="" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;">Regular ৳</label>
                    <input type="number" step="0.01" name="variation_regular_price[]" value="300" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;">Sale ৳</label>
                    <input type="number" step="0.01" name="variation_sale_price[]" value="250" class="form-control" style="padding:6px 8px;font-size:0.85rem;">
                </div>
                <div>
                    <label style="font-size:0.75rem;font-weight:700;">Stock</label>
                    <input type="number" name="variation_stock[]" value="20" class="form-control" style="padding:6px 8px;font-size:0.85rem;" required>
                </div>
                <div style="padding-top:16px;">
                    <button type="button" class="btn-remove-var" style="background:none;border:none;color:#C62828;font-size:1.1rem;cursor:pointer;">✕</button>
                </div>
            \`;
            container.appendChild(div);
        });

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-var')) {
                e.target.closest('.var-row').remove();
            }
        });
    });
    </script>
    `;
}

module.exports = {
    renderAdminProductsView,
    renderAdminProductEditView
};
