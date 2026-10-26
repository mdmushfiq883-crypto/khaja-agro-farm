// Customer Account, Login, and Registration Views
const { escapeHtml, formatPrice, formatDate } = require('../utils/formatters');

function renderLoginView({ error = null, returnUrl = '' }) {
    return `
    <div class="container" style="padding-top: 50px; padding-bottom: 80px; max-width: 460px;">
        <div style="background:#fff;padding:36px;border-radius:var(--radius-lg);border:1px solid var(--border-color);box-shadow:var(--shadow-sm);">
            <div style="text-align:center;margin-bottom:24px;">
                <img src="/images/khaja_agro_logo.png" alt="Khaja Agro Farm" style="width:64px;height:64px;margin:0 auto 10px;object-fit:contain;">
                <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">Customer Login</h1>
                <p style="font-size:0.85rem;color:var(--muted-text);">Access your Khaja Agro Farm orders and delivery address</p>
            </div>

            ${error ? `<div style="background:#FFEBEE;color:#C62828;padding:10px 14px;border-radius:6px;font-size:0.88rem;margin-bottom:18px;">⚠ ${escapeHtml(error)}</div>` : ''}

            <form action="/login" method="POST">
                <input type="hidden" name="returnUrl" value="${escapeHtml(returnUrl)}">

                <div class="form-group">
                    <label class="form-label" for="identifier">Mobile Number or Email</label>
                    <input type="text" id="identifier" name="identifier" class="form-control" placeholder="01970271398" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">Password</label>
                    <input type="password" id="password" name="password" class="form-control" placeholder="••••••••" required>
                </div>

                <button type="submit" class="cart-btn-primary" style="margin-top:10px;padding:12px;font-size:0.95rem;">
                    Sign In
                </button>
            </form>

            <div style="text-align:center;margin-top:20px;font-size:0.88rem;color:var(--muted-text);">
                Do not have an account? <a href="/register" style="color:var(--primary-green);font-weight:700;">Create one here</a>
            </div>
        </div>
    </div>
    `;
}

function renderRegisterView({ error = null }) {
    return `
    <div class="container" style="padding-top: 50px; padding-bottom: 80px; max-width: 500px;">
        <div style="background:#fff;padding:36px;border-radius:var(--radius-lg);border:1px solid var(--border-color);box-shadow:var(--shadow-sm);">
            <div style="text-align:center;margin-bottom:24px;">
                <img src="/images/khaja_agro_logo.png" alt="Khaja Agro Farm" style="width:64px;height:64px;margin:0 auto 10px;object-fit:contain;">
                <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);">Create Customer Account</h1>
                <p style="font-size:0.85rem;color:var(--muted-text);">Join Khaja Agro Farm for fast ordering and farm updates</p>
            </div>

            ${error ? `<div style="background:#FFEBEE;color:#C62828;padding:10px 14px;border-radius:6px;font-size:0.88rem;margin-bottom:18px;">⚠ ${escapeHtml(error)}</div>` : ''}

            <form action="/register" method="POST">
                <div class="form-group">
                    <label class="form-label" for="fullName">Full Name *</label>
                    <input type="text" id="fullName" name="fullName" class="form-control" placeholder="e.g. Karim Ullah" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="phone">Mobile Number (11 digits) *</label>
                    <input type="tel" id="phone" name="phone" class="form-control" placeholder="01700000000" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="email">Email Address (Optional)</label>
                    <input type="email" id="email" name="email" class="form-control" placeholder="customer@example.com">
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">Password (min 6 characters) *</label>
                    <input type="password" id="password" name="password" class="form-control" placeholder="••••••••" required minlength="6">
                </div>

                <div class="form-group">
                    <label class="form-label" for="address">Default Delivery Address</label>
                    <input type="text" id="address" name="address" class="form-control" placeholder="House, Road, Area, Chattogram">
                </div>

                <button type="submit" class="cart-btn-primary" style="margin-top:10px;padding:12px;font-size:0.95rem;">
                    Register Account
                </button>
            </form>

            <div style="text-align:center;margin-top:20px;font-size:0.88rem;color:var(--muted-text);">
                Already have an account? <a href="/login" style="color:var(--primary-green);font-weight:700;">Login here</a>
            </div>
        </div>
    </div>
    `;
}

function renderAccountView({ user, orders = [] }) {
    return `
    <div class="container" style="padding-top: 32px; padding-bottom: 70px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
            <div>
                <h1 style="font-size:1.85rem;font-weight:900;color:var(--forest-green);">
                    Customer Dashboard
                </h1>
                <p style="font-size:0.92rem;color:var(--muted-text);">
                    Welcome back, <strong>${escapeHtml(user.fullName)}</strong> (${escapeHtml(user.phone)})
                </p>
            </div>
            <a href="/logout" class="cart-btn-secondary" style="width:auto;padding:8px 18px;color:var(--danger-red);border-color:var(--danger-red);">
                Sign Out
            </a>
        </div>

        <div style="display:grid;grid-template-columns:1fr 2.2fr;gap:28px;">
            <!-- Profile Sidebar -->
            <div style="background:#fff;padding:24px;border-radius:var(--radius-lg);border:1px solid var(--border-color);height:fit-content;">
                <h3 style="font-size:1.1rem;font-weight:800;color:var(--forest-green);margin-bottom:14px;border-bottom:1px solid #EDF5EC;padding-bottom:8px;">
                    Account Information
                </h3>
                <div style="font-size:0.88rem;margin-bottom:8px;"><strong>Name:</strong> ${escapeHtml(user.fullName)}</div>
                <div style="font-size:0.88rem;margin-bottom:8px;"><strong>Phone:</strong> ${escapeHtml(user.phone)}</div>
                <div style="font-size:0.88rem;margin-bottom:18px;"><strong>Email:</strong> ${escapeHtml(user.email || 'Not provided')}</div>

                <h3 style="font-size:1.1rem;font-weight:800;color:var(--forest-green);margin-bottom:14px;border-bottom:1px solid #EDF5EC;padding-bottom:8px;">
                    Change Password
                </h3>
                <form action="/account/change-password" method="POST">
                    <div class="form-group">
                        <label class="form-label" style="font-size:0.8rem;">Current Password</label>
                        <input type="password" name="currentPassword" class="form-control" style="padding:6px 10px;font-size:0.85rem;" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-size:0.8rem;">New Password</label>
                        <input type="password" name="newPassword" class="form-control" style="padding:6px 10px;font-size:0.85rem;" required minlength="6">
                    </div>
                    <button type="submit" class="cart-btn-primary" style="padding:8px 14px;font-size:0.85rem;margin-bottom:0;">
                        Update Password
                    </button>
                </form>
            </div>

            <!-- Orders History -->
            <div style="background:#fff;padding:28px;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                <h3 style="font-size:1.25rem;font-weight:800;color:var(--forest-green);margin-bottom:18px;border-bottom:1px solid #EDF5EC;padding-bottom:10px;">
                    My Orders (${orders.length})
                </h3>

                ${orders.length === 0 ? `
                    <div style="text-align:center;padding:40px 20px;">
                        <p style="color:var(--muted-text);margin-bottom:14px;">You have not placed any orders yet.</p>
                        <a href="/shop" class="cart-btn-primary" style="display:inline-block;width:auto;padding:10px 22px;">Explore Shop</a>
                    </div>
                ` : `
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        ${orders.map(o => `
                            <div style="border:1px solid var(--border-color);border-radius:var(--radius-md);padding:18px;background:#FAFCF9;">
                                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                                    <div>
                                        <div style="font-size:1.05rem;font-weight:800;color:var(--forest-green);">
                                            #${escapeHtml(o.order_number)}
                                        </div>
                                        <div style="font-size:0.8rem;color:var(--muted-text);">${formatDate(o.created_at)}</div>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <span style="background:#E8F5E9;color:#2E7D32;padding:3px 10px;border-radius:9999px;font-weight:700;font-size:0.8rem;">
                                            ${escapeHtml(o.order_status)}
                                        </span>
                                        <span style="background:#EDF5EC;color:var(--dark-text);padding:3px 10px;border-radius:9999px;font-weight:600;font-size:0.8rem;">
                                            Payment: ${escapeHtml(o.payment_status)}
                                        </span>
                                    </div>
                                </div>

                                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #EDF5EC;padding-top:10px;font-size:0.88rem;">
                                    <div>
                                        <span>Total: <strong style="color:var(--forest-green);font-size:1rem;">${formatPrice(o.total_amount)}</strong></span>
                                        <span style="color:var(--muted-text);margin-left:12px;">Method: ${escapeHtml(o.payment_method_name || o.payment_method_code)}</span>
                                    </div>
                                    <a href="/order/success/${encodeURIComponent(o.order_number)}" style="color:var(--primary-green);font-weight:700;">
                                        View Details / Receipt ➔
                                    </a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    </div>
    `;
}

module.exports = {
    renderLoginView,
    renderRegisterView,
    renderAccountView
};
