// Admin Store Settings, Payment Methods, and Delivery Settings Views
const { escapeHtml, formatPrice } = require('../utils/formatters');
const config = require('../config/config');

function renderAdminPaymentsView({ paymentMethods = [] }) {
    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Payment Methods & Numbers Configuration
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">
            Configure your official bKash, Nagad, Rocket Send Money numbers (01970271398) and payment instructions.
        </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:20px;max-width:860px;">
        ${paymentMethods.map(pm => `
            <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;box-shadow:var(--shadow-sm);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid #EDF5EC;padding-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <div style="background:#fff;border:1px solid #E2EAE1;border-radius:6px;padding:3px 6px;height:38px;width:95px;display:flex;align-items:center;justify-content:center;">
                            <img src="${pm.logo_url || `/images/payments/${pm.code}.svg`}" alt="${escapeHtml(pm.name)}" style="max-height:30px;max-width:85px;object-fit:contain;">
                        </div>
                        <div>
                            <strong style="font-size:1.15rem;color:var(--forest-green);display:block;">${escapeHtml(pm.name)}</strong>
                            <span style="font-size:0.8rem;background:#EDF5EC;padding:2px 8px;border-radius:4px;"><code>${escapeHtml(pm.code)}</code></span>
                        </div>
                    </div>
                    <span style="font-size:0.85rem;font-weight:700;color:${pm.is_enabled ? '#2E7D32' : '#C62828'};">
                        ${pm.is_enabled ? '● Enabled on Storefront' : '○ Disabled'}
                    </span>
                </div>

                <form action="/admin/payments/${pm.id}" method="POST">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                        <div class="form-group">
                            <label class="form-label">Display Name</label>
                            <input type="text" name="name" value="${escapeHtml(pm.name)}" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Payment / Send Money Number</label>
                            <input type="text" name="account_number" value="${escapeHtml(pm.account_number)}" class="form-control" placeholder="01970271398" required>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
                        <div class="form-group">
                            <label class="form-label">Account Type</label>
                            <select name="account_type" class="form-control">
                                <option value="Personal" ${pm.account_type === 'Personal' ? 'selected' : ''}>Personal</option>
                                <option value="Merchant" ${pm.account_type === 'Merchant' ? 'selected' : ''}>Merchant</option>
                                <option value="Agent" ${pm.account_type === 'Agent' ? 'selected' : ''}>Agent</option>
                                <option value="Direct" ${pm.account_type === 'Direct' ? 'selected' : ''}>Direct / COD</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Storefront Status</label>
                            <select name="is_enabled" class="form-control">
                                <option value="1" ${pm.is_enabled ? 'selected' : ''}>Enabled (Visible at Checkout)</option>
                                <option value="0" ${!pm.is_enabled ? 'selected' : ''}>Disabled (Hidden)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Logo Asset Path</label>
                            <input type="text" name="logo_url" value="${escapeHtml(pm.logo_url || `/images/payments/${pm.code}.svg`)}" class="form-control">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Customer Payment Instructions</label>
                        <textarea name="instructions" rows="2" class="form-control">${escapeHtml(pm.instructions)}</textarea>
                    </div>

                    <button type="submit" class="cart-btn-primary" style="width:auto;padding:8px 24px;margin-bottom:0;">
                        Update ${escapeHtml(pm.name)} Settings
                    </button>
                </form>
            </div>
        `).join('')}
    </div>
    `;
}

function renderAdminDeliveryView({ delivery }) {
    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Delivery Charges & Policies
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">Configure city shipping fees and free delivery rules</p>
    </div>

    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:28px;max-width:680px;box-shadow:var(--shadow-sm);">
        <form action="/admin/delivery" method="POST">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
                <div class="form-group">
                    <label class="form-label">Standard Delivery Charge (৳) *</label>
                    <input type="number" step="0.01" name="default_charge" value="${delivery.default_charge}" class="form-control" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Free Delivery Minimum Order (৳) *</label>
                    <input type="number" step="0.01" name="free_delivery_threshold" value="${delivery.free_delivery_threshold}" class="form-control" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Delivery Instructions & Timing</label>
                <textarea name="instructions" rows="3" class="form-control">${escapeHtml(delivery.instructions)}</textarea>
            </div>

            <button type="submit" class="cart-btn-primary" style="margin-top:10px;width:auto;padding:10px 24px;">
                Save Delivery Settings
            </button>
        </form>
    </div>
    `;
}

function renderAdminStoreSettingsView({ settings }) {
    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Store Information & Announcement
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">Manage business identity, contact information, and top announcements</p>
    </div>

    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:28px;max-width:760px;box-shadow:var(--shadow-sm);">
        <form action="/admin/settings" method="POST">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
                <div class="form-group">
                    <label class="form-label">Business Name (English) *</label>
                    <input type="text" name="business_name" value="${escapeHtml(settings.business_name || config.BUSINESS.NAME)}" class="form-control" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Business Name (Bengali)</label>
                    <input type="text" name="business_name_bn" value="${escapeHtml(settings.business_name_bn || config.BUSINESS.NAME_BN)}" class="form-control">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Main Farm & Outlet Address *</label>
                <textarea name="business_address" rows="2" class="form-control" required>${escapeHtml(settings.business_address || config.BUSINESS.ADDRESS)}</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
                <div class="form-group">
                    <label class="form-label">Hotline & WhatsApp Number *</label>
                    <input type="text" name="business_phone" value="${escapeHtml(settings.business_phone || config.BUSINESS.PHONE)}" class="form-control" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Official Email *</label>
                    <input type="email" name="business_email" value="${escapeHtml(settings.business_email || config.BUSINESS.EMAIL)}" class="form-control" required>
                </div>
            </div>

            <h3 style="font-size:1.1rem;font-weight:800;color:var(--forest-green);margin-top:20px;margin-bottom:14px;border-top:1px solid #EDF5EC;padding-top:16px;">
                Announcement Bar
            </h3>

            <div class="form-group">
                <label class="form-label">Announcement Text</label>
                <input type="text" name="announcement_text" value="${escapeHtml(settings.announcement_text || '')}" class="form-control">
            </div>

            <div class="form-group">
                <label style="display:flex;align-items:center;gap:8px;font-weight:700;cursor:pointer;">
                    <input type="checkbox" name="announcement_enabled" value="1" ${settings.announcement_enabled === '1' || settings.announcement_enabled === 'true' ? 'checked' : ''}>
                    Show Announcement Bar on Storefront
                </label>
            </div>

            <button type="submit" class="cart-btn-primary" style="margin-top:14px;width:auto;padding:12px 28px;">
                Save Store Settings
            </button>
        </form>
    </div>
    `;
}

function renderAdminBannersView({ slides = [] }) {
    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Homepage Hero Carousel Slides
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">Manage hero promotional slides and banners</p>
    </div>

    <div style="display:flex;flex-direction:column;gap:20px;max-width:800px;">
        ${slides.map(s => `
            <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-sm);">
                <div style="height:140px;overflow:hidden;position:relative;background:#000;">
                    <img src="${s.image_url}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;">
                    <div style="position:absolute;bottom:12px;left:18px;color:#fff;">
                        <div style="font-size:0.75rem;text-transform:uppercase;font-weight:700;">${escapeHtml(s.subtitle)}</div>
                        <h3 style="font-size:1.3rem;font-weight:900;">${escapeHtml(s.title)}</h3>
                    </div>
                </div>

                <div style="padding:18px;">
                    <form action="/admin/banners/${s.id}" method="POST">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                            <div class="form-group">
                                <label class="form-label">Headline Title</label>
                                <input type="text" name="title" value="${escapeHtml(s.title)}" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Subtitle</label>
                                <input type="text" name="subtitle" value="${escapeHtml(s.subtitle)}" class="form-control" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Promotional Text</label>
                            <input type="text" name="promo_text" value="${escapeHtml(s.promo_text || '')}" class="form-control">
                        </div>

                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                            <div class="form-group">
                                <label class="form-label">Button Text</label>
                                <input type="text" name="button_text" value="${escapeHtml(s.button_text)}" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Target Link URL</label>
                                <input type="text" name="link_url" value="${escapeHtml(s.link_url)}" class="form-control" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Banner Image URL / Path</label>
                            <input type="text" name="image_url" value="${escapeHtml(s.image_url)}" class="form-control" required>
                        </div>

                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
                            <button type="submit" class="cart-btn-primary" style="width:auto;padding:8px 20px;margin-bottom:0;">
                                Save Slide
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `).join('')}
    </div>
    `;
}

function renderAdminSocialView({ socialLinks = [] }) {
    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Social Media Channels
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">Manage official Facebook, Instagram, and WhatsApp social channels</p>
    </div>

    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:28px;max-width:680px;box-shadow:var(--shadow-sm);">
        <div style="display:flex;flex-direction:column;gap:18px;">
            ${socialLinks.map(soc => `
                <form action="/admin/social/${soc.id}" method="POST" style="display:flex;gap:14px;align-items:flex-end;">
                    <div style="flex:1;">
                        <label class="form-label"><strong>${escapeHtml(soc.platform)}</strong> Profile URL</label>
                        <input type="url" name="url" value="${escapeHtml(soc.url)}" class="form-control" required>
                    </div>

                    <div style="width:130px;">
                        <label class="form-label">Status</label>
                        <select name="is_enabled" class="form-control">
                            <option value="1" ${soc.is_enabled ? 'selected' : ''}>Active</option>
                            <option value="0" ${!soc.is_enabled ? 'selected' : ''}>Hidden</option>
                        </select>
                    </div>

                    <button type="submit" class="cart-btn-secondary" style="width:auto;padding:10px 18px;margin-bottom:0;">
                        Save
                    </button>
                </form>
            `).join('')}
        </div>
    </div>
    `;
}

function renderAdminCustomersView({ customers = [] }) {
    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">
            Registered Customers (${customers.length})
        </h1>
        <p style="font-size:0.88rem;color:var(--muted-text);">Customer directory, order counts, and anti-abuse status controls</p>
    </div>

    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th>Mobile Phone</th>
                    <th>Email</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(c => `
                    <tr>
                        <td><strong>${escapeHtml(c.full_name)}</strong></td>
                        <td>${escapeHtml(c.phone)}</td>
                        <td>${escapeHtml(c.email || 'N/A')}</td>
                        <td><strong>${c.total_orders}</strong></td>
                        <td><strong>${formatPrice(c.total_spent)}</strong></td>
                        <td>
                            <span style="font-size:0.8rem;font-weight:700;padding:2px 8px;border-radius:4px;background:${c.status === 'active' ? '#E8F5E9' : '#FFEBEE'};color:${c.status === 'active' ? '#2E7D32' : '#C62828'};">
                                ${escapeHtml(c.status)}
                            </span>
                        </td>
                        <td>
                            <form action="/admin/customers/${c.id}/status" method="POST" style="display:inline;">
                                <input type="hidden" name="status" value="${c.status === 'active' ? 'suspended' : 'active'}">
                                <button type="submit" style="background:none;border:none;color:${c.status === 'active' ? '#C62828' : '#2E7D32'};cursor:pointer;font-weight:700;font-size:0.8rem;">
                                    ${c.status === 'active' ? 'Suspend' : 'Activate'}
                                </button>
                            </form>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;
}

module.exports = {
    renderAdminPaymentsView,
    renderAdminDeliveryView,
    renderAdminStoreSettingsView,
    renderAdminBannersView,
    renderAdminSocialView,
    renderAdminCustomersView
};
