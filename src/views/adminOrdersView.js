// Admin Orders Management View
const { escapeHtml, formatPrice, formatDate } = require('../utils/formatters');

function renderAdminOrdersView({ orders = [], currentStatus = '', searchQuery = '' }) {
    const statuses = ['All', 'Pending', 'Confirmed', 'Processing', 'Ready for Delivery', 'Shipped', 'Delivered', 'Cancelled'];

    return `
    <div style="margin-bottom:24px;">
        <h1 style="font-size:1.6rem;font-weight:900;color:var(--forest-green);margin-bottom:16px;">
            Orders Management
        </h1>

        <!-- Status Filter Pills -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">
            ${statuses.map(st => {
                const isActive = (st === 'All' && !currentStatus) || currentStatus === st;
                return `
                <a href="/admin/orders${st === 'All' ? '' : '?status=' + encodeURIComponent(st)}"
                   style="padding:8px 16px;border-radius:9999px;font-size:0.85rem;font-weight:700;background:${isActive ? 'var(--forest-green)' : '#fff'};color:${isActive ? '#fff' : 'var(--dark-text)'};border:1px solid var(--border-color);text-decoration:none;">
                    ${st}
                </a>
                `;
            }).join('')}
        </div>

        <!-- Search Form -->
        <form action="/admin/orders" method="GET" style="display:flex;gap:10px;max-width:480px;margin-bottom:20px;">
            ${currentStatus ? `<input type="hidden" name="status" value="${escapeHtml(currentStatus)}">` : ''}
            <input type="text" name="search" value="${escapeHtml(searchQuery)}" class="form-control" placeholder="Search by Order #, Customer Name, or Phone...">
            <button type="submit" class="cart-btn-primary" style="width:auto;padding:0 20px;margin-bottom:0;">Search</button>
        </form>
    </div>

    <!-- Orders Table -->
    <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden;">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Order Number</th>
                    <th>Date & Time</th>
                    <th>Customer Details</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Order Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${orders.length === 0 ? `
                    <tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted-text);">No orders found matching the filter.</td></tr>
                ` : orders.map(o => `
                    <tr>
                        <td>
                            <strong style="color:var(--forest-green);font-size:0.95rem;">#${escapeHtml(o.order_number)}</strong>
                        </td>
                        <td>${formatDate(o.created_at)}</td>
                        <td>
                            <div style="font-weight:700;">${escapeHtml(o.customer_name)}</div>
                            <div style="font-size:0.8rem;color:var(--muted-text);">${escapeHtml(o.customer_phone)}</div>
                            <div style="font-size:0.75rem;color:var(--muted-text);">${escapeHtml(o.delivery_city)}</div>
                        </td>
                        <td>
                            <div style="font-weight:700;font-size:0.85rem;">${escapeHtml(o.payment_method_name || o.payment_method_code)}</div>
                            <div style="font-size:0.78rem;">Status: <strong>${escapeHtml(o.payment_status)}</strong></div>
                            ${o.transaction_reference ? `<div style="font-size:0.75rem;color:var(--forest-green);font-weight:700;">TrxID: ${escapeHtml(o.transaction_reference)}</div>` : ''}
                        </td>
                        <td>
                            <strong style="font-size:1rem;color:var(--forest-green);">${formatPrice(o.total_amount)}</strong>
                            <div style="font-size:0.75rem;color:var(--muted-text);">${o.item_count} items</div>
                        </td>
                        <td>
                            <span style="background:#E8F5E9;color:#2E7D32;padding:4px 10px;border-radius:9999px;font-weight:700;font-size:0.8rem;">
                                ${escapeHtml(o.order_status)}
                            </span>
                        </td>
                        <td>
                            <a href="/admin/orders/${o.id}" class="cart-btn-primary" style="padding:6px 12px;font-size:0.8rem;width:auto;display:inline-block;margin-bottom:0;">
                                Manage Order
                            </a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `;
}

function renderAdminOrderDetailView({ order }) {
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Ready for Delivery', 'Shipped', 'Delivered', 'Cancelled'];
    const validPaymentStatuses = ['Unpaid', 'Awaiting Verification', 'Paid', 'Failed', 'Refunded'];

    return `
    <div style="margin-bottom:24px;">
        <div style="margin-bottom:12px;">
            <a href="/admin/orders" style="color:var(--forest-green);font-weight:700;font-size:0.9rem;">
                ← Back to All Orders
            </a>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
            <h1 style="font-size:1.75rem;font-weight:900;color:var(--forest-green);">
                Order #${escapeHtml(order.order_number)}
            </h1>
            <a href="/order/success/${encodeURIComponent(order.order_number)}" target="_blank" class="cart-btn-secondary" style="width:auto;padding:8px 18px;">
                🖨 Printable Invoice View ↗
            </a>
        </div>
    </div>

    <div style="display:grid;grid-template-columns:1.8fr 1.2fr;gap:28px;">
        <!-- Left: Items & Customer Details -->
        <div>
            <!-- Purchased Items Snapshot -->
            <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;margin-bottom:24px;">
                <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;">
                    Order Items Snapshot
                </h3>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Variation</th>
                            <th>SKU</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(i => `
                            <tr>
                                <td><strong>${escapeHtml(i.product_name)}</strong></td>
                                <td>${escapeHtml(i.variation_name || 'Standard')}</td>
                                <td><code>${escapeHtml(i.sku || 'N/A')}</code></td>
                                <td>${formatPrice(i.unit_price)}</td>
                                <td><strong>${i.quantity}</strong></td>
                                <td><strong>${formatPrice(i.subtotal_price)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-left:auto;max-width:280px;margin-top:18px;display:flex;flex-direction:column;gap:6px;font-size:0.9rem;">
                    <div style="display:flex;justify-content:space-between;">
                        <span>Subtotal:</span>
                        <strong>${formatPrice(order.subtotal)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span>Delivery Fee:</span>
                        <strong>${formatPrice(order.delivery_fee)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:900;color:var(--forest-green);border-top:2px solid #EDF5EC;padding-top:8px;">
                        <span>Total:</span>
                        <span>${formatPrice(order.total_amount)}</span>
                    </div>
                </div>
            </div>

            <!-- Customer & Delivery Information -->
            <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;">
                <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);margin-bottom:14px;">
                    Customer & Delivery Address
                </h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:0.9rem;">
                    <div><strong>Customer Name:</strong> ${escapeHtml(order.customer_name)}</div>
                    <div><strong>Mobile Phone:</strong> <a href="tel:${escapeHtml(order.customer_phone)}" style="color:var(--primary-green);font-weight:700;">${escapeHtml(order.customer_phone)}</a></div>
                    <div><strong>Email:</strong> ${escapeHtml(order.customer_email || 'Not provided')}</div>
                    <div><strong>City / Area:</strong> ${escapeHtml(order.delivery_city)}</div>
                    <div style="grid-column:1 / -1;">
                        <strong>Full Address:</strong>
                        <div style="background:#FAFAF5;padding:10px;border-radius:6px;border:1px solid var(--border-color);margin-top:4px;">
                            ${escapeHtml(order.delivery_address)}
                        </div>
                    </div>
                    ${order.customer_notes ? `
                    <div style="grid-column:1 / -1;">
                        <strong>Customer Notes:</strong>
                        <div style="background:#FFF9C4;padding:8px 12px;border-radius:6px;font-style:italic;margin-top:4px;">
                            ${escapeHtml(order.customer_notes)}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <!-- Right: Status Control & Audit Log -->
        <div>
            <!-- Order Status Controls -->
            <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;margin-bottom:24px;">
                <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;">
                    Update Order Status
                </h3>

                <form action="/admin/orders/${order.id}/status" method="POST" style="margin-bottom:20px;">
                    <div class="form-group">
                        <label class="form-label">Current Status</label>
                        <select name="orderStatus" class="form-control" style="font-weight:700;">
                            ${validStatuses.map(st => `
                                <option value="${st}" ${order.order_status === st ? 'selected' : ''}>${st}</option>
                            `).join('')}
                        </select>
                        <small style="color:var(--muted-text);margin-top:4px;display:block;">
                            Note: Setting status to <strong>Cancelled</strong> automatically restores inventory stock!
                        </small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status Note / Reason</label>
                        <input type="text" name="comment" class="form-control" placeholder="e.g. Dispatched with Karnaphuli van">
                    </div>

                    <button type="submit" class="cart-btn-primary" style="margin-bottom:0;">
                        Save Order Status
                    </button>
                </form>

                <h3 style="font-size:1.15rem;font-weight:800;color:var(--forest-green);margin-bottom:16px;border-top:1px solid #EDF5EC;padding-top:16px;">
                    Update Payment Status
                </h3>

                <form action="/admin/orders/${order.id}/payment" method="POST">
                    <div class="form-group">
                        <label class="form-label">Payment Method</label>
                        <div style="font-weight:700;color:var(--forest-green);margin-bottom:6px;">
                            ${escapeHtml(order.payment_method_name || order.payment_method_code)}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Payment Status</label>
                        <select name="paymentStatus" class="form-control" style="font-weight:700;">
                            ${validPaymentStatuses.map(ps => `
                                <option value="${ps}" ${order.payment_status === ps ? 'selected' : ''}>${ps}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Customer Transaction ID (TrxID)</label>
                        <input type="text" name="transactionReference" value="${escapeHtml(order.transaction_reference || '')}" class="form-control" placeholder="bKash / Nagad TrxID">
                    </div>

                    <button type="submit" class="cart-btn-primary" style="margin-bottom:0;">
                        Update Payment Verification
                    </button>
                </form>
            </div>

            <!-- Internal Staff Notes -->
            <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;margin-bottom:24px;">
                <h3 style="font-size:1.1rem;font-weight:800;color:var(--forest-green);margin-bottom:12px;">
                    Internal Farm Staff Notes
                </h3>
                <form action="/admin/orders/${order.id}/notes" method="POST">
                    <div class="form-group">
                        <textarea name="internalNotes" rows="3" class="form-control" placeholder="Internal notes visible only to admins and farm staff">${escapeHtml(order.internal_notes || '')}</textarea>
                    </div>
                    <button type="submit" class="cart-btn-secondary" style="margin-bottom:0;">
                        Save Internal Notes
                    </button>
                </form>
            </div>

            <!-- Status Transition History -->
            <div style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-md);padding:24px;">
                <h3 style="font-size:1.1rem;font-weight:800;color:var(--forest-green);margin-bottom:14px;">
                    Status History & Audit Trail
                </h3>
                <div style="display:flex;flex-direction:column;gap:12px;font-size:0.85rem;">
                    ${order.status_history.map(sh => `
                        <div style="border-left:3px solid var(--primary-green);padding-left:12px;">
                            <div><strong>${escapeHtml(sh.new_status)}</strong> ${sh.previous_status ? `<span style="color:var(--muted-text);">(was ${sh.previous_status})</span>` : ''}</div>
                            <div style="color:var(--muted-text);font-size:0.75rem;">${formatDate(sh.created_at)} by ${escapeHtml(sh.changed_by)}</div>
                            ${sh.comment ? `<div style="color:#3C5247;margin-top:2px;">"${escapeHtml(sh.comment)}"</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
    `;
}

module.exports = {
    renderAdminOrdersView,
    renderAdminOrderDetailView
};
