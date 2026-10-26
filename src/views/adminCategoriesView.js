// Admin Categories Management View
const { escapeHtml } = require('../utils/formatters');

function renderAdminCategoriesView({ categories = [], editCategory = null }) {
    const isEdit = !!editCategory;

    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Product Categories Management
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">Organize farm goods into dynamic storefront categories</p>
    </div>

    <div style="display:grid;grid-template-columns:1.8fr 1.2fr;gap:28px;">
        <!-- Categories Table -->
        <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Products</th>
                        <th>Order</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(c => `
                        <tr>
                            <td style="width:40px;">
                                <img src="${c.image_url || '/images/categories/milk-dairy.png'}" style="width:36px;height:36px;object-fit:contain;background:#FAFAF5;border-radius:4px;border:1px solid #E2EAE1;">
                            </td>
                            <td><strong>${escapeHtml(c.name)}</strong></td>
                            <td><code>${escapeHtml(c.slug)}</code></td>
                            <td>${c.product_count || 0}</td>
                            <td>${c.display_order}</td>
                            <td>
                                <span style="font-size:0.75rem;font-weight:700;color:${c.is_active ? '#2E7D32' : '#C62828'};">
                                    ${c.is_active ? 'Active' : 'Disabled'}
                                </span>
                            </td>
                            <td>
                                <div style="display:flex;gap:6px;">
                                    <a href="/admin/categories?edit=${c.id}" class="cart-btn-secondary" style="padding:4px 8px;font-size:0.75rem;width:auto;">Edit</a>
                                    <button type="button" class="btn-delete-cat" data-id="${c.id}" data-name="${escapeHtml(c.name)}" data-count="${c.product_count || 0}"
                                            style="background:none;border:none;color:#C62828;cursor:pointer;font-size:0.75rem;padding:4px;">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Add / Edit Category Form -->
        <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;height:fit-content;">
            <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;">
                ${isEdit ? `Edit Category: ${escapeHtml(editCategory.name)}` : 'Create New Category'}
            </h3>

            <form action="${isEdit ? `/admin/categories/${editCategory.id}` : '/admin/categories'}" method="POST">
                <div class="form-group">
                    <label class="form-label">Category Name *</label>
                    <input type="text" name="name" value="${isEdit ? escapeHtml(editCategory.name) : ''}" class="form-control" placeholder="e.g. Milk & Dairy" required>
                </div>

                <div class="form-group">
                    <label class="form-label">URL Slug</label>
                    <input type="text" name="slug" value="${isEdit ? escapeHtml(editCategory.slug) : ''}" class="form-control" placeholder="milk-dairy (auto if blank)">
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" rows="2" class="form-control" placeholder="Short description for category banner">${isEdit ? escapeHtml(editCategory.description || '') : ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Category Image Path / URL</label>
                    <input type="text" name="image_url" value="${isEdit ? escapeHtml(editCategory.image_url || '') : '/images/categories/milk-dairy.png'}" class="form-control">
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                        <label class="form-label">Display Order</label>
                        <input type="number" name="display_order" value="${isEdit ? editCategory.display_order : 0}" class="form-control">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select name="is_active" class="form-control">
                            <option value="1" ${isEdit && editCategory.is_active ? 'selected' : ''}>Active</option>
                            <option value="0" ${isEdit && !editCategory.is_active ? 'selected' : ''}>Disabled</option>
                        </select>
                    </div>
                </div>

                <button type="submit" class="cart-btn-primary" style="margin-top:10px;">
                    ${isEdit ? 'Save Changes' : 'Create Category'}
                </button>
                ${isEdit ? `<a href="/admin/categories" class="cart-btn-secondary" style="margin-top:8px;">Cancel Edit</a>` : ''}
            </form>
        </div>
    </div>

    <!-- Safe Category Deletion Modal with Reassignment -->
    <div id="delete-cat-modal" class="modal-overlay">
        <div class="modal-card" style="max-width:440px;">
            <div class="modal-header">
                <h3 style="font-size:1.1rem;font-weight:800;color:#C62828;">Safe Category Deletion</h3>
                <button type="button" class="cart-drawer-close" id="del-cat-close">✕</button>
            </div>
            <form id="del-cat-form" method="POST">
                <div class="modal-body">
                    <p style="margin-bottom:12px;">Are you sure you want to delete <strong id="del-cat-name"></strong>?</p>
                    <div id="del-cat-warning" style="background:#FFF3E0;color:#E65100;padding:10px;border-radius:6px;font-size:0.85rem;margin-bottom:16px;"></div>

                    <div class="form-group" id="reassign-wrap">
                        <label class="form-label">Reassign existing products to:</label>
                        <select name="reassignToCategoryId" class="form-control" id="reassign-select">
                            <option value="">Do not reassign (Uncategorized)</option>
                            ${categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" id="del-cat-cancel" class="cart-btn-secondary" style="width:auto;padding:8px 16px;">Cancel</button>
                    <button type="submit" class="cart-btn-primary" style="width:auto;padding:8px 20px;background:#C62828;margin-bottom:0;">Confirm Delete</button>
                </div>
            </form>
        </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('delete-cat-modal');
        const form = document.getElementById('del-cat-form');
        const nameEl = document.getElementById('del-cat-name');
        const warningEl = document.getElementById('del-cat-warning');
        const select = document.getElementById('reassign-select');

        document.querySelectorAll('.btn-delete-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                const count = Number(btn.getAttribute('data-count'));

                form.action = '/admin/categories/' + id + '/delete';
                nameEl.textContent = name;

                if (count > 0) {
                    warningEl.innerHTML = '⚠ This category currently has <strong>' + count + ' active product(s)</strong>. Select another category below to safely reassign them.';
                    warningEl.style.display = 'block';
                } else {
                    warningEl.style.display = 'none';
                }

                // Hide the option for deleting category itself in reassign select
                Array.from(select.options).forEach(opt => {
                    opt.disabled = (opt.value === id);
                });

                modal.classList.add('open');
            });
        });

        const hide = () => modal.classList.remove('open');
        document.getElementById('del-cat-close').onclick = hide;
        document.getElementById('del-cat-cancel').onclick = hide;
    });
    </script>
    `;
}

module.exports = { renderAdminCategoriesView };
