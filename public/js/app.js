// Khaja Agro Farm - Storefront Interactive Client Script
(function () {
    'use strict';

    // State
    const AppState = {
        cart: [],
        currentProductModal: null,
        selectedVariationId: null,
        settings: {
            currency: '৳',
            freeDeliveryThreshold: 1500,
            defaultDeliveryCharge: 60
        }
    };

    // Load Cart from localStorage
    function loadCart() {
        try {
            const raw = localStorage.getItem('kaf_cart');
            AppState.cart = raw ? JSON.parse(raw) : [];
        } catch (e) {
            AppState.cart = [];
        }
        updateCartUI();
    }

    function saveCart() {
        try {
            localStorage.setItem('kaf_cart', JSON.stringify(AppState.cart));
        } catch (e) {
            console.error('Error saving cart:', e);
        }
        updateCartUI();
    }

    // Immediately load cart state from localStorage so AppState.cart is populated before any DOM listeners fire
    loadCart();

    function formatMoney(amount) {
        const val = Math.round(Number(amount) || 0);
        return `${AppState.settings.currency} ${val.toLocaleString('en-US')}`;
    }

    // UI Toast Notification
    function showToast(message, type = 'success') {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            background-color: ${type === 'success' ? '#075B35' : '#D32F2F'};
            color: #FFFFFF;
            padding: 12px 24px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            font-size: 0.92rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: fadeIn 0.2s ease-out;
        `;
        toast.innerHTML = `<span>${type === 'success' ? '✔' : '⚠'}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2800);
    }

    // Update Cart UI in Header and Side Drawer
    function updateCartUI() {
        const totalCount = AppState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const subtotal = AppState.cart.reduce((sum, item) => sum + (item.unitPrice * (item.quantity || 1)), 0);

        // Update nav badge and total
        const badgeEls = document.querySelectorAll('.cart-badge-count');
        badgeEls.forEach(el => el.textContent = totalCount);

        const totalEls = document.querySelectorAll('.cart-nav-total');
        totalEls.forEach(el => el.textContent = formatMoney(subtotal));

        const drawerSubtotal = document.getElementById('drawer-subtotal');
        if (drawerSubtotal) drawerSubtotal.textContent = formatMoney(subtotal);

        // Render Drawer Items
        const itemsContainer = document.getElementById('cart-drawer-items-list');
        const emptyState = document.getElementById('cart-drawer-empty');
        const footerEl = document.getElementById('cart-drawer-footer');

        if (itemsContainer) {
            if (AppState.cart.length === 0) {
                itemsContainer.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                if (footerEl) footerEl.style.display = 'none';
            } else {
                itemsContainer.style.display = 'block';
                if (emptyState) emptyState.style.display = 'none';
                if (footerEl) footerEl.style.display = 'block';

                itemsContainer.innerHTML = AppState.cart.map((item, idx) => `
                    <div class="cart-item" data-index="${idx}">
                        <img src="${item.image || '/images/khaja_agro_logo.png'}" alt="${item.productName}" class="cart-item-img">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${item.productName}</div>
                            ${item.variationName ? `<div class="cart-item-var">${item.variationName}</div>` : ''}
                            <div class="cart-item-price">${formatMoney(item.unitPrice)}</div>
                        </div>
                        <div class="cart-item-stepper">
                            <button type="button" class="btn-step-minus" data-index="${idx}">-</button>
                            <span class="step-qty" style="font-weight:700;font-size:0.85rem;padding:0 4px;">${item.quantity}</span>
                            <button type="button" class="btn-step-plus" data-index="${idx}">+</button>
                        </div>
                        <button type="button" class="cart-item-remove" data-index="${idx}" title="Remove item">✕</button>
                    </div>
                `).join('');
            }
        }
    }

    // Open/Close Side Cart Drawer
    function openCartDrawer() {
        const overlay = document.getElementById('cart-drawer-overlay');
        const drawer = document.getElementById('cart-drawer');
        if (overlay && drawer) {
            overlay.classList.add('open');
            drawer.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCartDrawer() {
        const overlay = document.getElementById('cart-drawer-overlay');
        const drawer = document.getElementById('cart-drawer');
        if (overlay && drawer) {
            overlay.classList.remove('open');
            drawer.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Mobile Navigation Drawer Handlers
    function openMobileNav() {
        const overlay = document.getElementById('mobile-nav-overlay');
        const drawer = document.getElementById('mobile-nav-drawer');
        const toggleBtn = document.querySelector('.js-mobile-nav-toggle');
        if (overlay && drawer) {
            overlay.style.display = 'block';
            drawer.style.display = 'flex';
            void drawer.offsetWidth;
            overlay.classList.add('open');
            drawer.classList.add('open');
            drawer.setAttribute('aria-hidden', 'false');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileNav() {
        const overlay = document.getElementById('mobile-nav-overlay');
        const drawer = document.getElementById('mobile-nav-drawer');
        const toggleBtn = document.querySelector('.js-mobile-nav-toggle');
        if (overlay && drawer) {
            overlay.classList.remove('open');
            drawer.classList.remove('open');
            drawer.setAttribute('aria-hidden', 'true');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            setTimeout(() => {
                if (!drawer.classList.contains('open')) {
                    drawer.style.display = 'none';
                    overlay.style.display = 'none';
                }
            }, 300);
        }
    }

    // Add Item to Cart
    function addToCart({ productId, variationId = null, productName, variationName = null, unitPrice, regularPrice = null, image, quantity = 1 }) {
        const existingIdx = AppState.cart.findIndex(i =>
            Number(i.productId) === Number(productId) &&
            ((!i.variationId && !variationId) || Number(i.variationId) === Number(variationId))
        );

        if (existingIdx > -1) {
            AppState.cart[existingIdx].quantity += quantity;
        } else {
            AppState.cart.push({
                productId: Number(productId),
                variationId: variationId ? Number(variationId) : null,
                productName,
                variationName,
                unitPrice: Number(unitPrice),
                regularPrice: regularPrice ? Number(regularPrice) : Number(unitPrice),
                image,
                quantity: Number(quantity)
            });
        }

        saveCart();
        showToast(`Added ${productName} ${variationName ? '(' + variationName + ')' : ''} to cart!`);
        openCartDrawer();
    }

    // Direct Checkout (Order Now) - navigates directly to checkout bypassing cart page without overwriting cart
    function directCheckout({ productId, variationId = null, productName, variationName = null, unitPrice, regularPrice = null, image, quantity = 1 }) {
        if (!productId) return;
        const directItem = {
            productId: Number(productId),
            variationId: variationId ? Number(variationId) : null,
            productName,
            variationName: variationName || null,
            unitPrice: Number(unitPrice),
            regularPrice: regularPrice ? Number(regularPrice) : Number(unitPrice),
            image: image || '/images/khaja_agro_logo.png',
            quantity: Math.max(1, Number(quantity) || 1)
        };
        try {
            sessionStorage.setItem('kaf_direct_checkout', JSON.stringify([directItem]));
        } catch (e) {
            console.error('Failed to save direct checkout session:', e);
        }
        window.location.href = '/checkout?direct=1';
    }

    // Open Variation Picker Modal for variable products
    async function openVariationModal(productId) {
        try {
            const res = await fetch(`/api/products/${productId}`);
            if (!res.ok) throw new Error('Failed to load product details.');
            const product = await res.json();

            AppState.currentProductModal = product;
            const modalEl = document.getElementById('variation-modal');
            const modalBody = document.getElementById('variation-modal-body');

            if (!modalEl || !modalBody) return;

            // Default to first active variation
            const activeVariations = product.variations.filter(v => v.is_active);
            if (activeVariations.length === 0) {
                showToast('This product is currently out of stock.', 'error');
                return;
            }

            const initialVar = activeVariations[0];
            AppState.selectedVariationId = initialVar.id;

            renderVariationModalContent(product, initialVar);
            modalEl.classList.add('open');
            document.body.style.overflow = 'hidden';
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function renderVariationModalContent(product, currentVar) {
        const modalBody = document.getElementById('variation-modal-body');
        if (!modalBody) return;

        const effectivePrice = currentVar.sale_price !== null ? currentVar.sale_price : currentVar.regular_price;
        const hasDiscount = currentVar.sale_price !== null && currentVar.sale_price < currentVar.regular_price;
        const inStock = currentVar.stock_quantity > 0;

        modalBody.innerHTML = `
            <div style="display:flex;gap:18px;margin-bottom:18px;">
                <img id="modal-var-img" src="${currentVar.image_url || product.featured_image}" alt="${product.name}"
                     style="width:110px;height:110px;object-fit:contain;background:#FAFAF5;border-radius:8px;border:1px solid #E2EAE1;">
                <div>
                    <h3 style="font-size:1.15rem;font-weight:800;color:#075B35;margin-bottom:4px;">${product.name}</h3>
                    <div style="font-size:0.8rem;color:#5C7166;margin-bottom:8px;">SKU: <span id="modal-var-sku" style="font-weight:600;">${currentVar.sku}</span></div>
                    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px;">
                        <span id="modal-var-price" style="font-size:1.35rem;font-weight:800;color:#075B35;">${formatMoney(effectivePrice)}</span>
                        ${hasDiscount ? `<span id="modal-var-reg-price" style="font-size:0.95rem;color:#9E9E9E;text-decoration:line-through;">${formatMoney(currentVar.regular_price)}</span>` : ''}
                    </div>
                    <div>
                        <span id="modal-var-stock" style="font-size:0.8rem;font-weight:700;padding:2px 8px;border-radius:4px;background:${inStock ? '#E8F5E9' : '#FFEBEE'};color:${inStock ? '#2E7D32' : '#C62828'};">
                            ${inStock ? `In Stock (${currentVar.stock_quantity} available)` : 'Out of Stock'}
                        </span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:18px;">
                <label style="display:block;font-size:0.88rem;font-weight:700;margin-bottom:8px;">Select Option / Variation:</label>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${product.variations.map(v => `
                        <button type="button" class="btn-var-choice ${v.id === currentVar.id ? 'active' : ''}"
                                data-var-id="${v.id}"
                                style="padding:8px 14px;border-radius:6px;border:2px solid ${v.id === currentVar.id ? '#087A3E' : '#E2EAE1'};background:${v.id === currentVar.id ? '#EDF5EC' : '#FFFFFF'};color:#173528;font-weight:700;font-size:0.88rem;cursor:pointer;">
                            ${v.variation_name} — ${formatMoney(v.sale_price !== null ? v.sale_price : v.regular_price)}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div style="display:flex;align-items:center;gap:12px;">
                <label style="font-size:0.88rem;font-weight:700;">Quantity:</label>
                <div style="display:flex;align-items:center;border:1px solid #E2EAE1;border-radius:6px;padding:3px 8px;">
                    <button type="button" id="modal-qty-minus" style="border:none;background:none;font-weight:700;cursor:pointer;padding:2px 8px;">-</button>
                    <span id="modal-qty-val" style="font-weight:700;padding:0 8px;">1</span>
                    <button type="button" id="modal-qty-plus" style="border:none;background:none;font-weight:700;cursor:pointer;padding:2px 8px;">+</button>
                </div>
            </div>
        `;

        // Wire modal variation choice buttons
        const choiceBtns = modalBody.querySelectorAll('.btn-var-choice');
        choiceBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const varId = Number(btn.getAttribute('data-var-id'));
                const selVar = product.variations.find(v => v.id === varId);
                if (selVar) {
                    AppState.selectedVariationId = selVar.id;
                    renderVariationModalContent(product, selVar);
                }
            });
        });

        // Wire modal qty stepper
        let qty = 1;
        const qVal = document.getElementById('modal-qty-val');
        const qMinus = document.getElementById('modal-qty-minus');
        const qPlus = document.getElementById('modal-qty-plus');

        if (qMinus) qMinus.onclick = () => { if (qty > 1) { qty--; qVal.textContent = qty; } };
        if (qPlus) qPlus.onclick = () => { if (qty < currentVar.stock_quantity) { qty++; qVal.textContent = qty; } };

        // Wire Add button in modal footer
        const modalAddBtn = document.getElementById('btn-modal-add-to-cart');
        if (modalAddBtn) {
            modalAddBtn.disabled = !inStock;
            modalAddBtn.onclick = () => {
                addToCart({
                    productId: product.id,
                    variationId: currentVar.id,
                    productName: product.name,
                    variationName: currentVar.variation_name,
                    unitPrice: currentVar.sale_price !== null ? currentVar.sale_price : currentVar.regular_price,
                    regularPrice: currentVar.regular_price,
                    image: currentVar.image_url || product.featured_image,
                    quantity: qty
                });
                closeVariationModal();
            };
        }
    }

    function closeVariationModal() {
        const modalEl = document.getElementById('variation-modal');
        if (modalEl) {
            modalEl.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Setup Event Listeners
    document.addEventListener('DOMContentLoaded', () => {
        loadCart();

        // Cart Drawer Toggles
        const cartToggles = document.querySelectorAll('.js-cart-toggle');
        cartToggles.forEach(el => el.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        }));

        const cartCloses = document.querySelectorAll('.js-cart-close');
        cartCloses.forEach(el => el.addEventListener('click', closeCartDrawer));

        const cartOverlay = document.getElementById('cart-drawer-overlay');
        if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

        // Mobile Nav Drawer Toggles
        const navToggles = document.querySelectorAll('.js-mobile-nav-toggle');
        navToggles.forEach(el => el.addEventListener('click', (e) => {
            e.preventDefault();
            openMobileNav();
        }));

        const navCloses = document.querySelectorAll('.js-mobile-nav-close');
        navCloses.forEach(el => el.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileNav();
        }));

        // Global Escape Key Listener for Modals and Drawers
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMobileNav();
                closeCartDrawer();
                closeVariationModal();
            }
        });

        // Close mobile drawer on desktop resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeMobileNav();
            }
        });

        // Delegation for Cart Item Quantity +/- and Remove
        const drawerItems = document.getElementById('cart-drawer-items-list');
        if (drawerItems) {
            drawerItems.addEventListener('click', (e) => {
                const plusBtn = e.target.closest('.btn-step-plus');
                const minusBtn = e.target.closest('.btn-step-minus');
                const removeBtn = e.target.closest('.cart-item-remove');

                if (plusBtn) {
                    const idx = Number(plusBtn.getAttribute('data-index'));
                    if (AppState.cart[idx]) {
                        AppState.cart[idx].quantity += 1;
                        saveCart();
                    }
                } else if (minusBtn) {
                    const idx = Number(minusBtn.getAttribute('data-index'));
                    if (AppState.cart[idx]) {
                        if (AppState.cart[idx].quantity > 1) {
                            AppState.cart[idx].quantity -= 1;
                        } else {
                            AppState.cart.splice(idx, 1);
                        }
                        saveCart();
                    }
                } else if (removeBtn) {
                    const idx = Number(removeBtn.getAttribute('data-index'));
                    AppState.cart.splice(idx, 1);
                    saveCart();
                    showToast('Item removed from cart.');
                }
            });
        }

        // Add to Cart buttons on Product Cards
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-add-to-cart');
            if (!btn) return;
            e.preventDefault();

            const productId = btn.getAttribute('data-product-id');
            const hasVariations = btn.getAttribute('data-has-variations') === '1';

            if (hasVariations) {
                openVariationModal(productId);
            } else {
                addToCart({
                    productId: productId,
                    variationId: null,
                    productName: btn.getAttribute('data-name'),
                    variationName: null,
                    unitPrice: Number(btn.getAttribute('data-price')),
                    regularPrice: Number(btn.getAttribute('data-regular-price') || btn.getAttribute('data-price')),
                    image: btn.getAttribute('data-image'),
                    quantity: 1
                });
            }
        });

        // Close Modal
        const modalClose = document.querySelectorAll('.js-modal-close');
        modalClose.forEach(b => b.addEventListener('click', closeVariationModal));
        const modalOverlay = document.getElementById('variation-modal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeVariationModal();
            });
        }

        // Global Copy Button Handler for Payment Numbers
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.js-copy-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                const number = btn.getAttribute('data-number');
                if (number) {
                    const doFeedback = () => {
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '✓ Copied!';
                        btn.classList.add('copied');
                        showToast(`Copied ${number} to clipboard!`);
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                            btn.classList.remove('copied');
                        }, 2200);
                    };

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(number).then(doFeedback).catch(() => {
                            fallbackCopy(number, doFeedback);
                        });
                    } else {
                        fallbackCopy(number, doFeedback);
                    }
                }
            }
        });

        function fallbackCopy(text, cb) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                document.execCommand('copy');
                if (cb) cb();
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(ta);
        }
    });

    // Expose Global API for Checkout & Pages
    window.KAF = {
        AppState,
        loadCart,
        saveCart,
        updateCartUI,
        addToCart,
        directCheckout,
        openCartDrawer,
        closeCartDrawer,
        openMobileNav,
        closeMobileNav,
        showToast,
        formatMoney
    };
})();
