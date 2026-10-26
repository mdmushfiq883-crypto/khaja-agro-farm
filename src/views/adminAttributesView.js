// Admin Dynamic Attributes and Attribute Values Management View
const { escapeHtml } = require('../utils/formatters');

function renderAdminAttributesView({ attributes = [] }) {
    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Dynamic Product Attributes & Values
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">
            Define reusable attributes (e.g. Size, Weight, Volume, Packaging) and their options (500 ml, 1 Ltr, 1 Kg)
        </p>
    </div>

    <div style="display:grid;grid-template-columns:1.8fr 1.2fr;gap:28px;">
        <!-- Attributes List -->
        <div style="display:flex;flex-direction:column;gap:20px;">
            ${attributes.map(attr => `
                <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:20px;box-shadow:var(--shadow-sm);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #EDF5EC;padding-bottom:8px;">
                        <div>
                            <strong style="font-size:1.1rem;color:var(--forest-green);">${escapeHtml(attr.name)}</strong>
                            <span style="font-size:0.8rem;color:var(--muted-text);margin-left:8px;">(slug: <code>${escapeHtml(attr.slug)}</code>)</span>
                        </div>
                        <form action="/admin/attributes/${attr.id}/delete" method="POST" onsubmit="return confirm('Delete attribute and all its values?');">
                            <button type="submit" style="background:none;border:none;color:#C62828;cursor:pointer;font-size:0.8rem;">Delete Attribute</button>
                        </form>
                    </div>

                    <!-- Values Pills -->
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;">
                        ${attr.values.length === 0 ? `
                            <span style="color:var(--muted-text);font-size:0.85rem;">No values configured yet.</span>
                        ` : attr.values.map(v => `
                            <div style="background:#EDF5EC;border:1px solid var(--border-color);border-radius:6px;padding:4px 10px;display:flex;align-items:center;gap:8px;font-size:0.85rem;font-weight:700;">
                                <span>${escapeHtml(v.value)}</span>
                                <form action="/admin/attributes/values/${v.id}/delete" method="POST" style="display:inline;">
                                    <button type="submit" style="background:none;border:none;color:#C62828;cursor:pointer;font-size:0.75rem;padding:0;" title="Delete option">✕</button>
                                </form>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Add Value Inline Form -->
                    <form action="/admin/attributes/${attr.id}/values" method="POST" style="display:flex;gap:10px;align-items:center;">
                        <input type="text" name="value" class="form-control" placeholder="Add option (e.g. 2 Ltr, 2 Kg)" style="padding:6px 10px;font-size:0.85rem;" required>
                        <button type="submit" class="cart-btn-primary" style="width:auto;padding:6px 14px;font-size:0.85rem;margin-bottom:0;white-space:nowrap;">
                            + Add Option
                        </button>
                    </form>
                </div>
            `).join('')}
        </div>

        <!-- Add New Attribute Form -->
        <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;height:fit-content;">
            <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;">
                Create New Attribute
            </h3>
            <form action="/admin/attributes" method="POST">
                <div class="form-group">
                    <label class="form-label">Attribute Name *</label>
                    <input type="text" name="name" class="form-control" placeholder="e.g. Packaging, Size, Volume, Cut Type" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Slug</label>
                    <input type="text" name="slug" class="form-control" placeholder="e.g. packaging (auto if empty)">
                </div>

                <button type="submit" class="cart-btn-primary" style="margin-top:10px;">
                    Create Attribute
                </button>
            </form>
        </div>
    </div>
    `;
}

module.exports = { renderAdminAttributesView };
