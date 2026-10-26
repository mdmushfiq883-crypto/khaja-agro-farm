// Admin Dashboard Views
const { escapeHtml, formatPrice, formatDate } = require('../utils/formatters');
const config = require('../config/config');

function renderAdminLayout({ title = 'Khaja Agro Farm Admin', content = '', activeTab = 'dashboard', user }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link rel="icon" type="image/png" href="/images/khaja_agro_logo.png">
    <link rel="stylesheet" href="/css/style.css">
    <style>
        body { background-color: #F4F7F4; }
        .admin-wrapper { display: flex; min-height: 100vh; }
        .admin-sidebar {
            width: 260px;
            background-color: #054C2B;
            color: #E2EFE9;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }
        .admin-sidebar-header {
            padding: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .admin-sidebar-nav {
            list-style: none;
            padding: 16px 0;
            flex: 1;
            overflow-y: auto;
        }
        .admin-sidebar-nav li a {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 11px 20px;
            color: #C1DACD;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.15s;
        }
        .admin-sidebar-nav li a:hover,
        .admin-sidebar-nav li a.active {
            background-color: var(--primary-green);
            color: #FFFFFF;
            border-left: 4px solid var(--leaf-green);
        }
        .admin-main { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }
        .admin-topbar {
            background-color: #FFFFFF;
            border-bottom: 1px solid var(--border-color);
            padding: 14px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .admin-content { padding: 28px; flex: 1; }
        .stat-card {
            background: #FFFFFF;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
            padding: 20px;
            box-shadow: var(--shadow-sm);
        }
        .stat-card-title { font-size: 0.8rem; font-weight: 700; color: var(--muted-text); text-transform: uppercase; margin-bottom: 6px; }
        .stat-card-val { font-size: 1.8rem; font-weight: 900; color: var(--forest-green); }
        .admin-table {
            width: 100%;
            border-collapse: collapse;
            background: #FFFFFF;
            border-radius: var(--radius-md);
            overflow: hidden;
            border: 1px solid var(--border-color);
        }
        .admin-table th {
            background-color: #EDF5EC;
            color: var(--forest-green);
            font-weight: 700;
            font-size: 0.85rem;
            padding: 12px 16px;
            text-align: left;
        }
        .admin-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #F0F4EF;
            font-size: 0.88rem;
            color: var(--dark-text);
        }
        .admin-table tr:hover { background-color: #FAFCF9; }
    </style>
</head>
<body>
    <div class="admin-wrapper">
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar">
            <div class="admin-sidebar-header">
                <img src="/images/khaja_agro_logo.png" style="width:40px;height:40px;object-fit:contain;background:#fff;border-radius:50%;padding:2px;">
                <div>
                    <strong style="color:#fff;font-size:1.05rem;display:block;line-height:1.2;">Khaja Agro Admin</strong>
                    <span style="font-size:0.75rem;color:#A3C5B5;">Farm Control Center</span>
                </div>
            </div>

            <ul class="admin-sidebar-nav">
                <li><a href="/admin" class="${activeTab === 'dashboard' ? 'active' : ''}">📊 Dashboard</a></li>
                <li><a href="/admin/orders" class="${activeTab === 'orders' ? 'active' : ''}">📦 Orders</a></li>
                <li><a href="/admin/products" class="${activeTab === 'products' ? 'active' : ''}">🥩 Products</a></li>
                <li><a href="/admin/categories" class="${activeTab === 'categories' ? 'active' : ''}">📁 Categories</a></li>
                <li><a href="/admin/attributes" class="${activeTab === 'attributes' ? 'active' : ''}">🏷 Attributes & Variations</a></li>
                <li><a href="/admin/inventory" class="${activeTab === 'inventory' ? 'active' : ''}">📋 Inventory</a></li>
                <li><a href="/admin/customers" class="${activeTab === 'customers' ? 'active' : ''}">👥 Customers</a></li>
                <li><a href="/admin/payments" class="${activeTab === 'payments' ? 'active' : ''}">💳 Payment Settings</a></li>
                <li><a href="/admin/delivery" class="${activeTab === 'delivery' ? 'active' : ''}">🚚 Delivery Settings</a></li>
                <li><a href="/admin/banners" class="${activeTab === 'banners' ? 'active' : ''}">🖼 Homepage Slides</a></li>
                <li><a href="/admin/social" class="${activeTab === 'social' ? 'active' : ''}">🌐 Social Links</a></li>
                <li><a href="/admin/settings" class="${activeTab === 'settings' ? 'active' : ''}">⚙ Store Settings</a></li>
            </ul>

            <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.1);font-size:0.8rem;color:#A3C5B5;">
                <div>Logged in as: <strong>${escapeHtml(user?.fullName || 'Admin')}</strong></div>
                <div style="margin-top:6px;"><a href="/logout" style="color:#FFCDD2;font-weight:700;">🚪 Sign Out</a></div>
            </div>
        </aside>

        <!-- Main Panel Content -->
        <div class="admin-main">
            <header class="admin-topbar">
                <div style="font-weight:700;color:var(--forest-green);font-size:1.15rem;">
                    ${escapeHtml(title)}
                </div>
                <div style="display:flex;align-items:center;gap:16px;">
                    <a href="/" target="_blank" class="cart-btn-secondary" style="width:auto;padding:6px 14px;font-size:0.85rem;">
                        View Storefront ↗
                    </a>
                </div>
            </header>

            <main class="admin-content">
                ${content}
            </main>
        </div>
    </div>
</body>
</html>`;
}

function renderAdminDashboardView({ stats }) {
    return `
    <!-- Top KPI Cards -->
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:20px;margin-bottom:28px;">
        <div class="stat-card">
            <div class="stat-card-title">Total Active Sales</div>
            <div class="stat-card-val">${formatPrice(stats.totalSales)}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Total Orders</div>
            <div class="stat-card-val">${stats.orders.total}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Pending Orders</div>
            <div class="stat-card-val" style="color:#E65100;">${stats.orders.pending}</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-title">Low / Out of Stock</div>
            <div class="stat-card-val" style="color:#C62828;">${stats.products.lowStock + stats.products.outOfStock}</div>
        </div>
    </div>

    <!-- Order Status Breakdown Bar -->
    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:20px;margin-bottom:28px;">
        <h3 style="font-size:1.05rem;font-weight:800;color:var(--forest-green);margin-bottom:14px;">
            Orders Status Pipeline
        </h3>
        <div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:12px;text-align:center;">
            <div style="background:#FFF3E0;padding:12px;border-radius:6px;">
                <div style="font-size:0.75rem;font-weight:700;color:#E65100;">PENDING</div>
                <div style="font-size:1.4rem;font-weight:900;color:#E65100;">${stats.orders.pending}</div>
            </div>
            <div style="background:#E3F2FD;padding:12px;border-radius:6px;">
                <div style="font-size:0.75rem;font-weight:700;color:#1565C0;">CONFIRMED</div>
                <div style="font-size:1.4rem;font-weight:900;color:#1565C0;">${stats.orders.confirmed}</div>
            </div>
            <div style="background:#EDE7F6;padding:12px;border-radius:6px;">
                <div style="font-size:0.75rem;font-weight:700;color:#512DA8;">PROCESSING</div>
                <div style="font-size:1.4rem;font-weight:900;color:#512DA8;">${stats.orders.processing}</div>
            </div>
            <div style="background:#E0F2F1;padding:12px;border-radius:6px;">
                <div style="font-size:0.75rem;font-weight:700;color:#00796B;">READY</div>
                <div style="font-size:1.4rem;font-weight:900;color:#00796B;">${stats.orders.readyForDelivery}</div>
            </div>
            <div style="background:#E8F5E9;padding:12px;border-radius:6px;">
                <div style="font-size:0.75rem;font-weight:700;color:#2E7D32;">SHIPPED</div>
                <div style="font-size:1.4rem;font-weight:900;color:#2E7D32;">${stats.orders.shipped}</div>
            </div>
            <div style="background:#C8E6C9;padding:12px;border-radius:6px;">
                <div style="font-size:0.75rem;font-weight:700;color:#1B5E20;">DELIVERED</div>
                <div style="font-size:1.4rem;font-weight:900;color:#1B5E20;">${stats.orders.delivered}</div>
            </div>
            <div style="background:#FFEBEE;padding:12px;border-radius:6px;">
                <div style="font-size:0.75rem;font-weight:700;color:#C62828;">CANCELLED</div>
                <div style="font-size:1.4rem;font-weight:900;color:#C62828;">${stats.orders.cancelled}</div>
            </div>
        </div>
    </div>

    <!-- Recent Orders Table -->
    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);">
                Recent Farm Orders
            </h3>
            <a href="/admin/orders" style="color:var(--primary-green);font-weight:700;font-size:0.88rem;">
                View All Orders ➔
            </a>
        </div>

        <table class="admin-table">
            <thead>
                <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${stats.recentOrders.length === 0 ? `
                    <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--muted-text);">No orders found.</td></tr>
                ` : stats.recentOrders.map(o => `
                    <tr>
                        <td><strong>#${escapeHtml(o.order_number)}</strong></td>
                        <td>${formatDate(o.created_at)}</td>
                        <td>
                            <div><strong>${escapeHtml(o.customer_name)}</strong></div>
                            <div style="font-size:0.78rem;color:var(--muted-text);">${escapeHtml(o.customer_phone)}</div>
                        </td>
                        <td>${o.item_count} items</td>
                        <td><strong>${formatPrice(o.total_amount)}</strong></td>
                        <td>
                            <span style="font-weight:600;font-size:0.82rem;">${escapeHtml(o.payment_method_name || o.payment_method_code)}</span>
                            <div style="font-size:0.75rem;color:var(--muted-text);">${escapeHtml(o.payment_status)}</div>
                        </td>
                        <td>
                            <span style="background:#E8F5E9;color:#2E7D32;padding:3px 8px;border-radius:4px;font-weight:700;font-size:0.8rem;">
                                ${escapeHtml(o.order_status)}
                            </span>
                        </td>
                        <td>
                            <a href="/admin/orders/${o.id}" class="cart-btn-secondary" style="padding:4px 10px;font-size:0.8rem;width:auto;display:inline-block;">
                                Manage
                            </a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;
}

function renderAdminLoginView({ error = null }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Khaja Agro Farm - Admin Portal</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body style="background:#075B35;display:flex;align-items:center;justify-content:center;min-height:100vh;">
    <div style="background:#fff;padding:40px;border-radius:16px;width:100%;max-width:440px;box-shadow:0 12px 32px rgba(0,0,0,0.3);">
        <div style="text-align:center;margin-bottom:24px;">
            <img src="/images/khaja_agro_logo.png" style="width:72px;height:72px;margin:0 auto 12px;object-fit:contain;">
            <h1 style="font-size:1.6rem;font-weight:900;color:#075B35;">Khaja Agro Farm</h1>
            <p style="font-size:0.85rem;color:#5C7166;">Authorized Administrator Portal</p>
        </div>

        ${error ? `<div style="background:#FFEBEE;color:#C62828;padding:10px 14px;border-radius:6px;font-size:0.88rem;margin-bottom:18px;">⚠ ${escapeHtml(error)}</div>` : ''}

        <form action="/admin/login" method="POST">
            <div class="form-group">
                <label class="form-label">Phone or Email</label>
                <input type="text" name="identifier" class="form-control" placeholder="01970271398" required>
            </div>

            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-control" placeholder="••••••••" required>
            </div>

            <button type="submit" class="cart-btn-primary" style="margin-top:10px;padding:12px;font-size:1rem;">
                Secure Admin Login
            </button>
        </form>

        <div style="text-align:center;margin-top:20px;font-size:0.8rem;color:#78909C;">
            Authorized Access Only. All administrative actions are audit logged.
        </div>
    </div>
</body>
</html>`;
}

module.exports = {
    renderAdminLayout,
    renderAdminDashboardView,
    renderAdminLoginView
};
