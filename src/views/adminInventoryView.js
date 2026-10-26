// Admin Inventory Management and Stock Adjustment Views
const { escapeHtml, formatDate } = require('../utils/formatters');

function renderAdminInventoryView({ items = [], movements = [], lowStockOnly = false }) {
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div>
            <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
                Inventory & Stock Control
            </h1>
            <p style="font-size:0.88rem;color:var(--muted-text);">Real-time stock tracking for all products and variations</p>
        </div>

        <div style="display:flex;gap:12px;">
            <a href="/admin/inventory" class="cart-btn-secondary" style="width:auto;padding:8px 16px;background:${!lowStockOnly ? 'var(--forest-green)' : '#fff'};color:${!lowStockOnly ? '#fff' : 'var(--dark-text)'};">
                All Items (${items.length})
            </a>
            <a href="/admin/inventory?lowStock=1" class="cart-btn-secondary" style="width:auto;padding:8px 16px;background:${lowStockOnly ? '#C62828' : '#fff'};color:${lowStockOnly ? '#fff' : '#C62828'};border-color:#C62828;">
                ⚠ Low & Out of Stock
            </a>
        </div>
    </div>

    <!-- Inventory Table -->
    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;margin-bottom:36px;">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Product Item</th>
                    <th>Type</th>
                    <th>Option / Variation</th>
                    <th>SKU</th>
                    <th>Available Stock</th>
                    <th>Threshold</th>
                    <th>Stock Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(i => `
                    <tr>
                        <td>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <img src="${i.image_url || '/images/khaja_agro_logo.png'}" style="width:36px;height:36px;object-fit:contain;background:#FAFCF9;border-radius:4px;border:1px solid #E2EAE1;">
                                <strong>${escapeHtml(i.product_name)}</strong>
                            </div>
                        </td>
                        <td>
                            <span style="font-size:0.8rem;background:#EDF5EC;padding:2px 8px;border-radius:4px;">${escapeHtml(i.type)}</span>
                        </td>
                        <td>${escapeHtml(i.variation_name)}</td>
                        <td><code>${escapeHtml(i.sku)}</code></td>
                        <td>
                            <strong style="font-size:1.05rem;color:${i.isOutOfStock ? '#C62828' : (i.isLowStock ? '#E65100' : 'var(--forest-green)')};">
                                ${i.stock_quantity}
                            </strong>
                        </td>
                        <td>${i.low_stock_threshold}</td>
                        <td>
                            <span style="font-size:0.8rem;font-weight:700;padding:3px 8px;border-radius:4px;background:${i.isOutOfStock ? '#FFEBEE' : (i.isLowStock ? '#FFF3E0' : '#E8F5E9')};color:${i.isOutOfStock ? '#C62828' : (i.isLowStock ? '#E65100' : '#2E7D32')};">
                                ${escapeHtml(i.statusText)}
                            </span>
                        </td>
                        <td>
                            <button type="button" class="btn-adjust-stock cart-btn-secondary"
                                    data-prod-id="${i.product_id}"
                                    data-var-id="${i.variation_id || ''}"
                                    data-name="${escapeHtml(i.product_name)} ${escapeHtml(i.variation_name !== 'N/A' ? '(' + i.variation_name + ')' : '')}"
                                    data-stock="${i.stock_quantity}"
                                    style="padding:4px 10px;font-size:0.8rem;width:auto;">
                                Adjust Stock
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Stock Movement History (Audit Ledger) -->
    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;">
        <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;">
            Recent Stock Movement Audit Ledger
        </h3>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Product / Variation</th>
                    <th>Change</th>
                    <th>New Stock Level</th>
                    <th>Reason</th>
                    <th>Logged By</th>
                </tr>
            </thead>
            <tbody>
                ${movements.map(m => `
                    <tr>
                        <td>${formatDate(m.created_at)}</td>
                        <td>
                            <strong>${escapeHtml(m.product_name)}</strong>
                            ${m.variation_name ? `<span style="font-size:0.8rem;color:var(--muted-text);"> (${escapeHtml(m.variation_name)})</span>` : ''}
                        </td>
                        <td>
                            <strong style="color:${m.change_quantity > 0 ? '#2E7D32' : '#C62828'};">
                                ${m.change_quantity > 0 ? '+' + m.change_quantity : m.change_quantity}
                            </strong>
                        </td>
                        <td><strong>${m.new_stock}</strong></td>
                        <td>${escapeHtml(m.reason)}</td>
                        <td><code>${escapeHtml(m.created_by)}</code></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <!-- Stock Adjustment Modal -->
    <div id="stock-modal" class="modal-overlay">
        <div class="modal-card" style="max-width:440px;">
            <div class="modal-header">
                <h3 style="font-size:1.1rem;font-weight:800;color:var(--forest-green);">Manual Stock Adjustment</h3>
                <button type="button" class="cart-drawer-close" id="stock-modal-close">✕</button>
            </div>
            <form action="/admin/inventory/adjust" method="POST">
                <input type="hidden" id="modal-product-id" name="productId" value="">
                <input type="hidden" id="modal-variation-id" name="variationId" value="">

                <div class="modal-body">
                    <div style="font-weight:800;color:var(--dark-text);margin-bottom:12px;" id="modal-item-name"></div>
                    <div style="font-size:0.88rem;color:var(--muted-text);margin-bottom:16px;">
                        Current Stock: <strong id="modal-current-stock" style="color:var(--forest-green);">0</strong> units
                    </div>

                    <div class="form-group">
                        <label class="form-label">New Exact Stock Quantity *</label>
                        <input type="number" id="modal-new-stock" name="newStock" class="form-control" required min="0">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Adjustment Reason *</label>
                        <select name="reason" class="form-control" required>
                            <option value="New farm harvest / stock arrival">New farm harvest / stock arrival</option>
                            <option value="Physical stock inventory audit recount">Physical stock inventory audit recount</option>
                            <option value="Damaged or expired during storage">Damaged or expired during storage</option>
                            <option value="Farm store offline sale">Farm store offline sale</option>
                            <option value="Correction of previous entry">Correction of previous entry</option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" id="stock-modal-cancel" class="cart-btn-secondary" style="width:auto;padding:8px 16px;">Cancel</button>
                    <button type="submit" class="cart-btn-primary" style="width:auto;padding:8px 20px;margin-bottom:0;">Save Stock</button>
                </div>
            </form>
        </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('stock-modal');
        const prodIdInput = document.getElementById('modal-product-id');
        const varIdInput = document.getElementById('modal-variation-id');
        const nameEl = document.getElementById('modal-item-name');
        const stockEl = document.getElementById('modal-current-stock');
        const newStockInput = document.getElementById('modal-new-stock');
        const closeBtn = document.getElementById('stock-modal-close');
        const cancelBtn = document.getElementById('stock-modal-cancel');

        document.querySelectorAll('.btn-adjust-stock').forEach(btn => {
            btn.addEventListener('click', () => {
                prodIdInput.value = btn.getAttribute('data-prod-id');
                varIdInput.value = btn.getAttribute('data-var-id');
                nameEl.textContent = btn.getAttribute('data-name');
                const currStock = btn.getAttribute('data-stock');
                stockEl.textContent = currStock;
                newStockInput.value = currStock;
                modal.classList.add('open');
            });
        });

        const hide = () => modal.classList.remove('open');
        closeBtn.onclick = hide;
        cancelBtn.onclick = hide;
        modal.onclick = (e) => { if (e.target === modal) hide(); };
    });
    </script>
    `;
}

module.exports = { renderAdminInventoryView };
