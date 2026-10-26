// Order Confirmation & Printable Invoice View
const { escapeHtml, formatPrice, formatDate } = require('../utils/formatters');

function renderOrderSuccessView({ order }) {
    return `
    <div class="container" style="padding-top: 36px; padding-bottom: 70px; max-width: 820px;">
        <!-- Success Alert Header -->
        <div style="background:#EDF5EC;border:2px solid var(--primary-green);border-radius:var(--radius-lg);padding:28px;text-align:center;margin-bottom:32px;">
            <div style="font-size:3.5rem;color:var(--forest-green);margin-bottom:8px;">✔</div>
            <h1 style="font-size:2rem;font-weight:900;color:var(--forest-green);margin-bottom:6px;">
                Thank You! Your Order Has Been Placed.
            </h1>
            <p style="font-size:1rem;color:var(--dark-text);">
                Order Number: <strong style="color:var(--forest-green);font-size:1.15rem;">#${escapeHtml(order.order_number)}</strong>
            </p>
            <p style="font-size:0.88rem;color:var(--muted-text);margin-top:6px;">
                We have received your order. Our team in Karnaphuli is packing your fresh products.
            </p>
            <button onclick="window.print()" class="cart-btn-secondary" style="display:inline-block;width:auto;padding:8px 20px;margin-top:16px;">
                🖨 Print Invoice / Receipt
            </button>
        </div>

        <!-- Order Printable Receipt Card -->
        <div id="printable-invoice" style="background:#fff;border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:36px;box-shadow:var(--shadow-sm);">
            <!-- Invoice Top Header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--light-sage);padding-bottom:20px;margin-bottom:24px;">
                <div style="display:flex;align-items:center;gap:14px;">
                    <img src="/images/khaja_agro_logo.png" alt="Khaja Agro Farm" style="width:60px;height:60px;object-fit:contain;">
                    <div>
                        <h2 style="font-size:1.4rem;font-weight:900;color:var(--forest-green);line-height:1.1;">Khaja Agro Farm</h2>
                        <div style="font-size:0.8rem;color:var(--muted-text);">ভেল্লাপাড়া ব্রিজ সংলগ্ন, শিকলবাহা, কর্ণফুলী, চট্টগ্রাম।</div>
                        <div style="font-size:0.8rem;color:var(--muted-text);">Hotline: 01970271398 | mdmudhfiq883@gmail.com</div>
                    </div>
                </div>

                <div style="text-align:right;">
                    <div style="font-size:1.1rem;font-weight:800;color:var(--forest-green);">INVOICE</div>
                    <div style="font-size:0.85rem;color:var(--dark-text);font-weight:700;">#${escapeHtml(order.order_number)}</div>
                    <div style="font-size:0.8rem;color:var(--muted-text);">${formatDate(order.created_at)}</div>
                </div>
            </div>

            <!-- Customer & Delivery Information -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;background:#FAFCF9;padding:18px;border-radius:var(--radius-md);">
                <div>
                    <h4 style="font-size:0.85rem;font-weight:800;color:var(--muted-text);text-transform:uppercase;margin-bottom:6px;">Delivery To:</h4>
                    <div style="font-size:1rem;font-weight:800;color:var(--dark-text);">${escapeHtml(order.customer_name)}</div>
                    <div style="font-size:0.9rem;color:var(--dark-text);">${escapeHtml(order.customer_phone)}</div>
                    <div style="font-size:0.88rem;color:#3C5247;margin-top:4px;">${escapeHtml(order.delivery_address)}, ${escapeHtml(order.delivery_city)}</div>
                </div>

                <div>
                    <h4 style="font-size:0.85rem;font-weight:800;color:var(--muted-text);text-transform:uppercase;margin-bottom:6px;">Order Details:</h4>
                    <div style="font-size:0.88rem;"><strong>Order Status:</strong> <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:4px;font-weight:700;">${escapeHtml(order.order_status)}</span></div>
                    <div style="font-size:0.88rem;margin-top:4px;"><strong>Payment Method:</strong> ${escapeHtml(order.payment_method_name || order.payment_method_code)}</div>
                    <div style="font-size:0.88rem;margin-top:4px;"><strong>Payment Status:</strong> <span style="font-weight:700;">${escapeHtml(order.payment_status)}</span></div>
                    ${order.transaction_reference ? `<div style="font-size:0.88rem;margin-top:4px;"><strong>TrxID:</strong> ${escapeHtml(order.transaction_reference)}</div>` : ''}
                </div>
            </div>

            <!-- Items Table -->
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <thead>
                    <tr style="background:#EDF5EC;color:var(--forest-green);text-align:left;font-size:0.88rem;">
                        <th style="padding:10px 14px;border-radius:6px 0 0 6px;">Product Item</th>
                        <th style="padding:10px 14px;">Option / Size</th>
                        <th style="padding:10px 14px;text-align:center;">Qty</th>
                        <th style="padding:10px 14px;text-align:right;">Unit Price</th>
                        <th style="padding:10px 14px;text-align:right;border-radius:0 6px 6px 0;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr style="border-bottom:1px solid #F0F4EF;font-size:0.9rem;">
                            <td style="padding:12px 14px;font-weight:700;color:var(--dark-text);">${escapeHtml(item.product_name)}</td>
                            <td style="padding:12px 14px;color:var(--muted-text);">${escapeHtml(item.variation_name || 'Standard')}</td>
                            <td style="padding:12px 14px;text-align:center;font-weight:700;">${item.quantity}</td>
                            <td style="padding:12px 14px;text-align:right;">${formatPrice(item.unit_price)}</td>
                            <td style="padding:12px 14px;text-align:right;font-weight:800;color:var(--forest-green);">${formatPrice(item.subtotal_price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Totals Calculation -->
            <div style="margin-left:auto;max-width:320px;display:flex;flex-direction:column;gap:8px;font-size:0.92rem;">
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:var(--muted-text);">Items Subtotal:</span>
                    <strong style="color:var(--dark-text);">${formatPrice(order.subtotal)}</strong>
                </div>

                <div style="display:flex;justify-content:space-between;">
                    <span style="color:var(--muted-text);">Delivery Charge:</span>
                    <strong style="color:var(--dark-text);">${formatPrice(order.delivery_fee)}</strong>
                </div>

                <div style="display:flex;justify-content:space-between;border-top:2px solid var(--forest-green);padding-top:10px;font-size:1.25rem;font-weight:900;">
                    <span style="color:var(--forest-green);">Final Amount:</span>
                    <span style="color:var(--forest-green);">${formatPrice(order.total_amount)}</span>
                </div>
            </div>

            <!-- Bottom Notes -->
            <div style="margin-top:36px;border-top:1px dashed var(--border-color);padding-top:16px;font-size:0.8rem;color:var(--muted-text);text-align:center;">
                For any inquiries regarding this order, call or WhatsApp us at <strong>01970271398</strong> mentioning order number <strong>#${escapeHtml(order.order_number)}</strong>.
            </div>
        </div>

        <div style="text-align:center;margin-top:24px;">
            <a href="/shop" class="cart-btn-primary" style="display:inline-block;width:auto;padding:12px 28px;">
                Continue Shopping ➔
            </a>
        </div>
    </div>
    `;
}

module.exports = { renderOrderSuccessView };
