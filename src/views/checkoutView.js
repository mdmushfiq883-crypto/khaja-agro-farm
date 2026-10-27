// Checkout View Template
const { escapeHtml, formatPrice } = require('../utils/formatters');
const settingService = require('../services/settingService');

function renderCheckoutView({ user = null }) {
    const paymentMethods = settingService.getPaymentMethods({ activeOnly: true }).filter(pm => pm.code !== 'manual');
    const delivery = settingService.getDeliverySettings();

    return `
    <div class="container" style="padding-top: 28px; padding-bottom: 70px;">
        <h1 style="font-size:2rem;font-weight:800;color:var(--forest-green);margin-bottom:24px;">
            Secure Checkout
        </h1>

        <div class="checkout-layout-grid">
            <!-- Checkout Form -->
            <form id="checkout-form" style="background:#fff;padding:28px;border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                <h3 style="font-size:1.2rem;font-weight:800;color:var(--forest-green);margin-bottom:18px;border-bottom:1px solid #EDF5EC;padding-bottom:10px;">
                    1. Delivery Information
                </h3>

                <div class="form-row-2col">
                    <div class="form-group">
                        <label class="form-label" for="customerName">Full Name *</label>
                        <input type="text" id="customerName" name="customerName" class="form-control"
                               value="${user ? escapeHtml(user.fullName) : ''}" required placeholder="e.g. Karim Ullah">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="customerPhone">Mobile Number (11 digits) *</label>
                        <input type="tel" id="customerPhone" name="customerPhone" class="form-control"
                               value="${user ? escapeHtml(user.phone) : ''}" required placeholder="e.g. 01700000000">
                    </div>
                </div>

                <div class="form-row-2col">
                    <div class="form-group">
                        <label class="form-label" for="customerEmail">Email Address (Optional)</label>
                        <input type="email" id="customerEmail" name="customerEmail" class="form-control"
                               value="${user?.email ? escapeHtml(user.email) : ''}" placeholder="e.g. yourname@gmail.com">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="deliveryCity">District / City *</label>
                        <select id="deliveryCity" name="deliveryCity" class="form-control" required>
                            <option value="Chattogram" selected>Chattogram (চট্টগ্রাম)</option>
                            <option value="Karnaphuli">Karnaphuli (কর্ণফুলী)</option>
                            <option value="Dhaka">Dhaka (ঢাকা)</option>
                            <option value="Other">Other Districts</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="deliveryAddress">Detailed Delivery Address *</label>
                    <textarea id="deliveryAddress" name="deliveryAddress" rows="3" class="form-control" required
                              placeholder="House/Apartment, Road, Area, Landmark (e.g. ভেল্লাপাড়া, শিকলবাহা, কর্ণফুলী)"></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label" for="customerNotes">Order Notes (Optional)</label>
                    <textarea id="customerNotes" name="customerNotes" rows="2" class="form-control"
                              placeholder="Special delivery instructions or preferred time"></textarea>
                </div>

                <h3 style="font-size:1.2rem;font-weight:800;color:var(--forest-green);margin-top:28px;margin-bottom:18px;border-bottom:1px solid #EDF5EC;padding-bottom:10px;">
                    2. Payment Method
                </h3>

                <div class="checkout-payments-grid">
                    ${paymentMethods.map((pm, idx) => `
                        <label class="checkout-pm-card ${idx === 0 ? 'selected' : ''}" data-code="${pm.code}" data-name="${escapeHtml(pm.name)}" data-number="${escapeHtml(pm.account_number)}" data-instructions="${escapeHtml(pm.instructions)}" data-logo="${pm.logo_url || `/images/payments/${pm.code}.svg`}">
                            <div class="checkout-pm-header">
                                <input type="radio" name="paymentMethod" value="${pm.code}" ${idx === 0 ? 'checked' : ''} class="checkout-pm-radio">
                                <div class="checkout-pm-logo-box">
                                    <img src="${pm.logo_url || `/images/payments/${pm.code}.svg`}" alt="${escapeHtml(pm.name)}" class="checkout-pm-logo">
                                </div>
                                <span class="checkout-pm-type-badge">${escapeHtml(pm.account_type || (pm.code === 'cod' ? 'Direct' : 'Personal'))}</span>
                            </div>

                            <div class="checkout-pm-info">
                                <strong class="checkout-pm-title">${escapeHtml(pm.name)}</strong>
                                
                                <div class="checkout-pm-number-row">
                                    <span class="checkout-pm-number">📞 ${escapeHtml(pm.account_number)}</span>
                                    <button type="button" class="btn-copy-pm js-copy-btn" data-number="${escapeHtml(pm.account_number)}" title="Copy number" aria-label="Copy ${escapeHtml(pm.name)} number">
                                        📋 Copy
                                    </button>
                                </div>

                                <p class="checkout-pm-instructions">${escapeHtml(pm.instructions)}</p>
                            </div>
                        </label>
                    `).join('')}
                </div>

                <!-- Transaction Reference Box for Mobile Banking payments -->
                <div id="tx-ref-wrap" style="background:#F9FCF8;padding:18px 20px;border-radius:var(--radius-md);border:1.5px dashed var(--primary-green);margin-bottom:24px;display:none;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;border-bottom:1px solid #EDF5EC;padding-bottom:10px;">
                        <img id="tx-banner-logo" src="/images/payments/bkash.svg" alt="Payment Method" style="height:28px;max-width:85px;object-fit:contain;background:#fff;border-radius:4px;padding:2px 4px;border:1px solid #E2EAE1;">
                        <div style="flex:1;">
                            <strong id="tx-banner-title" style="font-size:1.05rem;color:var(--forest-green);">bKash Send Money</strong>
                            <div style="font-size:0.85rem;color:var(--muted-text);display:flex;align-items:center;gap:8px;margin-top:2px;">
                                <span>Send Money To: <strong id="tx-banner-number" style="color:var(--dark-text);">01970271398</strong></span>
                                <button type="button" id="tx-copy-btn" class="btn-copy-pm js-copy-btn" data-number="01970271398" title="Copy Number">📋 Copy</button>
                            </div>
                        </div>
                    </div>

                    <div style="background:#EDF5EC;padding:10px 14px;border-radius:6px;margin-bottom:14px;">
                        <div style="font-size:0.85rem;color:var(--forest-green);font-weight:600;" id="tx-instructions-text">
                            Please Send Money to our official number and enter your Transaction ID below.
                        </div>
                    </div>

                    <div class="form-group" style="margin-bottom:4px;">
                        <label class="form-label" for="transactionReference" style="font-weight:700;">
                            Transaction ID (TrxID) / Sender Mobile Number *
                        </label>
                        <input type="text" id="transactionReference" name="transactionReference" class="form-control"
                               placeholder="e.g. 9B7X2K4L or 017xxxxxxxx" style="font-size:1rem;letter-spacing:0.5px;">
                        <small style="color:var(--muted-text);font-size:0.8rem;margin-top:5px;display:block;">
                            পেমেন্ট সম্পন্ন হওয়ার পর প্রাপ্ত TrxID অথবা প্রেরক মোবাইল নম্বরটি এখানে লিখুন।
                        </small>
                    </div>
                </div>

                <!-- COD Active Banner -->
                <div id="cod-banner-wrap" style="background:#F2F8F3;padding:14px 18px;border-radius:var(--radius-md);border:1px solid #C8E0C5;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
                    <img src="/images/payments/cod.svg" alt="COD" style="height:32px;width:auto;max-width:90px;object-fit:contain;background:#fff;border-radius:4px;padding:2px 6px;">
                    <div>
                        <strong style="color:var(--forest-green);font-size:0.95rem;display:block;">ক্যাশ অন ডেলিভারি (Pay on Delivery)</strong>
                        <span style="font-size:0.84rem;color:var(--muted-text);">পণ্য হাতে পেয়ে এবং দেখে ডেলিভারি প্রতিনিধির নিকট ক্যাশ টাকা পরিশোধ করবেন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।</span>
                    </div>
                </div>

                <button type="submit" id="btn-place-order" class="cart-btn-primary" style="padding:16px;font-size:1.05rem;letter-spacing:0.5px;">
                    <span>Confirm Order Now ➔</span>
                </button>
            </form>

            <!-- Order Summary Column -->
            <div style="background:#fff;padding:28px;border-radius:var(--radius-lg);border:1px solid var(--border-color);height:fit-content;">
                <h3 style="font-size:1.2rem;font-weight:800;color:var(--forest-green);margin-bottom:18px;border-bottom:1px solid #EDF5EC;padding-bottom:10px;">
                    Order Summary
                </h3>

                <div id="checkout-items-list" style="margin-bottom:20px;max-height:280px;overflow-y:auto;">
                    <!-- Rendered by client script -->
                </div>

                <div style="border-top:1px solid #F0F4EF;padding-top:14px;display:flex;flex-direction:column;gap:10px;font-size:0.92rem;">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:var(--muted-text);">Items Subtotal:</span>
                        <strong id="summary-subtotal" style="color:var(--dark-text);">৳ 0</strong>
                    </div>

                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:var(--muted-text);">Delivery Fee:</span>
                        <strong id="summary-delivery" style="color:var(--dark-text);">৳ ${delivery.default_charge}</strong>
                    </div>

                    <div style="display:flex;justify-content:space-between;border-top:2px solid #EDF5EC;padding-top:12px;font-size:1.2rem;font-weight:900;">
                        <span style="color:var(--forest-green);">Total Payable:</span>
                        <span id="summary-total" style="color:var(--forest-green);">৳ 0</span>
                    </div>
                </div>

                <div style="margin-top:20px;padding:12px;background:var(--light-sage);border-radius:var(--radius-sm);font-size:0.8rem;color:#2F4F3F;line-height:1.4;">
                    🌿 <strong>100% Quality Guarantee:</strong> All orders are carefully packed in temperature-controlled hygiene boxes.
                </div>
            </div>
        </div>
    </div>

    <!-- Client Script for Checkout -->
    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('checkout-form');
        const itemsList = document.getElementById('checkout-items-list');
        const subtotalEl = document.getElementById('summary-subtotal');
        const deliveryEl = document.getElementById('summary-delivery');
        const totalEl = document.getElementById('summary-total');
        const txWrap = document.getElementById('tx-ref-wrap');
        const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
        const submitBtn = document.getElementById('btn-place-order');

        function renderCheckoutItems() {
            const cart = window.KAF.AppState.cart;
            if (cart.length === 0) {
                itemsList.innerHTML = '<p style="color:var(--muted-text);text-align:center;padding:20px;">Your cart is empty. Please add items to checkout.</p>';
                submitBtn.disabled = true;
                return;
            }

            itemsList.innerHTML = cart.map(item => {
                const varTxt = item.variationName ? ('<div style="font-size:0.75rem;color:var(--muted-text);">' + item.variationName + '</div>') : '';
                return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F4F8F3;">' +
                    '<img src="' + (item.image || '/images/khaja_agro_logo.png') + '" style="width:40px;height:40px;object-fit:contain;background:#F8FAF7;border-radius:4px;border:1px solid #E2EAE1;">' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:0.88rem;font-weight:700;">' + item.productName + '</div>' +
                        varTxt +
                        '<div style="font-size:0.8rem;color:var(--muted-text);">Qty: ' + item.quantity + ' × ' + window.KAF.formatMoney(item.unitPrice) + '</div>' +
                    '</div>' +
                    '<strong style="color:var(--forest-green);font-size:0.9rem;">' + window.KAF.formatMoney(item.unitPrice * item.quantity) + '</strong>' +
                '</div>';
            }).join('');

            const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            const deliveryFee = (subtotal >= 1500) ? 0 : 60;
            const total = subtotal + deliveryFee;

            subtotalEl.textContent = window.KAF.formatMoney(subtotal);
            deliveryEl.textContent = deliveryFee === 0 ? 'FREE (Over ৳1,500)' : window.KAF.formatMoney(deliveryFee);
            totalEl.textContent = window.KAF.formatMoney(total);
        }

        renderCheckoutItems();

        // Payment radio change & dynamic card UI
        function updatePaymentUI() {
            const checkedRadio = document.querySelector('input[name="paymentMethod"]:checked');
            if (!checkedRadio) return;

            const selectedCode = checkedRadio.value;
            const card = checkedRadio.closest('.checkout-pm-card');

            document.querySelectorAll('.checkout-pm-card').forEach(c => c.classList.remove('selected'));
            if (card) card.classList.add('selected');

            const name = card ? card.getAttribute('data-name') : '';
            const number = card ? card.getAttribute('data-number') : '';
            const instructions = card ? card.getAttribute('data-instructions') : '';
            const logo = card ? card.getAttribute('data-logo') : '';

            const codBanner = document.getElementById('cod-banner-wrap');
            const txWrap = document.getElementById('tx-ref-wrap');
            const txInput = document.getElementById('transactionReference');

            if (selectedCode === 'cod') {
                if (txWrap) txWrap.style.display = 'none';
                if (codBanner) codBanner.style.display = 'flex';
                if (txInput) txInput.required = false;
            } else {
                if (codBanner) codBanner.style.display = 'none';
                if (txWrap) txWrap.style.display = 'block';
                if (txInput) txInput.required = true;

                const logoEl = document.getElementById('tx-banner-logo');
                const titleEl = document.getElementById('tx-banner-title');
                const numEl = document.getElementById('tx-banner-number');
                const copyBtn = document.getElementById('tx-copy-btn');
                const instEl = document.getElementById('tx-instructions-text');

                if (logoEl && logo) logoEl.src = logo;
                if (titleEl && name) titleEl.textContent = name;
                if (numEl && number) numEl.textContent = number;
                if (copyBtn && number) copyBtn.setAttribute('data-number', number);
                if (instEl && instructions) instEl.textContent = instructions;
            }
        }

        paymentRadios.forEach(radio => {
            radio.addEventListener('change', updatePaymentUI);
        });

        // Initialize UI state immediately
        updatePaymentUI();

        // Form Submit
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cart = window.KAF.AppState.cart;
            if (cart.length === 0) {
                alert('Your shopping cart is empty.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Processing Order... Please wait</span>';

            const payload = {
                customerName: document.getElementById('customerName').value,
                customerPhone: document.getElementById('customerPhone').value,
                customerEmail: document.getElementById('customerEmail').value || null,
                deliveryAddress: document.getElementById('deliveryAddress').value,
                deliveryCity: document.getElementById('deliveryCity').value,
                customerNotes: document.getElementById('customerNotes').value || null,
                paymentMethodCode: document.querySelector('input[name="paymentMethod"]:checked').value,
                transactionReference: document.getElementById('transactionReference')?.value || null,
                items: cart.map(i => ({
                    productId: i.productId,
                    variationId: i.variationId,
                    quantity: i.quantity
                }))
            };

            try {
                const res = await fetch('/api/orders/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Failed to place order.');
                }

                // Clear cart on success
                localStorage.removeItem('kaf_cart');
                window.location.href = '/order/success/' + encodeURIComponent(data.order.order_number);
            } catch (err) {
                alert(err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Confirm Order Now ➔</span>';
            }
        });
    });
    </script>
    `;
}

module.exports = { renderCheckoutView };
