// Admin Actions & Page Dispatcher
const { renderAdminLayout, renderAdminDashboardView } = require('../views/adminViews');
const { renderAdminOrdersView, renderAdminOrderDetailView } = require('../views/adminOrdersView');
const { renderAdminProductsView, renderAdminProductEditView } = require('../views/adminProductsView');
const { renderAdminInventoryView } = require('../views/adminInventoryView');
const { renderAdminCategoriesView } = require('../views/adminCategoriesView');
const { renderAdminAttributesView } = require('../views/adminAttributesView');
const {
    renderAdminPaymentsView,
    renderAdminDeliveryView,
    renderAdminStoreSettingsView,
    renderAdminBannersView,
    renderAdminSocialView,
    renderAdminCustomersView
} = require('../views/adminSettingsView');

const orderService = require('../services/orderService');
const productService = require('../services/productService');
const categoryService = require('../services/categoryService');
const attributeService = require('../services/attributeService');
const inventoryService = require('../services/inventoryService');
const settingService = require('../services/settingService');
const customerService = require('../services/customerService');

function redirect(res, url) {
    res.writeHead(302, { Location: url });
    res.end();
}

class AdminRoutes {
    dashboard(req, res) {
        const stats = orderService.getDashboardStatistics();
        const content = renderAdminDashboardView({ stats });
        const html = renderAdminLayout({
            title: 'Overview Dashboard - Khaja Agro Farm Admin',
            content,
            activeTab: 'dashboard',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    orders(req, res, query) {
        const status = query.status || null;
        const search = query.search || null;
        const orders = orderService.listOrders({ status, search, limit: 100 });
        const content = renderAdminOrdersView({ orders, currentStatus: status, searchQuery: search });
        const html = renderAdminLayout({
            title: 'Orders Management - Khaja Agro Farm Admin',
            content,
            activeTab: 'orders',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    orderDetail(req, res, id) {
        const order = orderService.getOrderById(id);
        if (!order) {
            redirect(res, '/admin/orders');
            return;
        }
        const content = renderAdminOrderDetailView({ order });
        const html = renderAdminLayout({
            title: `Manage Order #${order.order_number} - Khaja Agro Farm Admin`,
            content,
            activeTab: 'orders',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    updateOrderStatus(req, res, id, body) {
        try {
            orderService.updateOrderStatus(id, body.orderStatus, body.comment || '', req.user.fullName);
            redirect(res, `/admin/orders/${id}?success=status`);
        } catch (err) {
            redirect(res, `/admin/orders/${id}?error=${encodeURIComponent(err.message)}`);
        }
    }

    updateOrderPayment(req, res, id, body) {
        try {
            orderService.updatePaymentStatus(id, body.paymentStatus, body.transactionReference || null, req.user.fullName);
            redirect(res, `/admin/orders/${id}?success=payment`);
        } catch (err) {
            redirect(res, `/admin/orders/${id}?error=${encodeURIComponent(err.message)}`);
        }
    }

    updateOrderNotes(req, res, id, body) {
        try {
            orderService.updateInternalNotes(id, body.internalNotes || '');
            redirect(res, `/admin/orders/${id}?success=notes`);
        } catch (err) {
            redirect(res, `/admin/orders/${id}?error=${encodeURIComponent(err.message)}`);
        }
    }

    products(req, res) {
        const products = productService.getAllProducts({ isActive: null, limit: 100 });
        const categories = categoryService.getAllCategories({ includeInactive: true });
        const content = renderAdminProductsView({ products, categories });
        const html = renderAdminLayout({
            title: 'Products Catalog - Khaja Agro Farm Admin',
            content,
            activeTab: 'products',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    productNew(req, res) {
        const categories = categoryService.getAllCategories({ includeInactive: true });
        const attributes = attributeService.getAllAttributesWithValues();
        const content = renderAdminProductEditView({ product: null, categories, attributes });
        const html = renderAdminLayout({
            title: 'Add New Product - Khaja Agro Farm Admin',
            content,
            activeTab: 'products',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    productEdit(req, res, id) {
        const product = productService.getProductById(id);
        if (!product) {
            redirect(res, '/admin/products');
            return;
        }
        const categories = categoryService.getAllCategories({ includeInactive: true });
        const attributes = attributeService.getAllAttributesWithValues();
        const content = renderAdminProductEditView({ product, categories, attributes });
        const html = renderAdminLayout({
            title: `Edit ${product.name} - Khaja Agro Farm Admin`,
            content,
            activeTab: 'products',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    saveProduct(req, res, id, body) {
        try {
            const hasVars = body.has_variations === '1';
            let variations = [];

            if (hasVars && body['variation_name[]']) {
                const names = Array.isArray(body['variation_name[]']) ? body['variation_name[]'] : [body['variation_name[]']];
                const skus = Array.isArray(body['variation_sku[]']) ? body['variation_sku[]'] : [body['variation_sku[]']];
                const regs = Array.isArray(body['variation_regular_price[]']) ? body['variation_regular_price[]'] : [body['variation_regular_price[]']];
                const sales = Array.isArray(body['variation_sale_price[]']) ? body['variation_sale_price[]'] : [body['variation_sale_price[]']];
                const stocks = Array.isArray(body['variation_stock[]']) ? body['variation_stock[]'] : [body['variation_stock[]']];
                const ids = body['variation_id[]'] ? (Array.isArray(body['variation_id[]']) ? body['variation_id[]'] : [body['variation_id[]']]) : [];

                for (let i = 0; i < names.length; i++) {
                    if (!skus[i] || !skus[i].trim()) continue;
                    variations.push({
                        id: ids[i] ? Number(ids[i]) : null,
                        variation_name: names[i],
                        sku: skus[i],
                        regular_price: regs[i],
                        sale_price: sales[i] ? sales[i] : null,
                        stock_quantity: stocks[i]
                    });
                }
            }

            if (id) {
                // Update product
                productService.updateProduct(id, {
                    category_id: body.category_id ? Number(body.category_id) : null,
                    name: body.name,
                    slug: body.slug,
                    short_description: body.short_description,
                    description: body.description,
                    featured_image: body.featured_image,
                    badge_text: body.badge_text || null,
                    has_variations: hasVars ? 1 : 0,
                    base_price: body.base_price,
                    base_sale_price: body.base_sale_price,
                    base_stock: body.base_stock,
                    is_featured: body.is_featured ? 1 : 0,
                    is_active: body.is_active ? 1 : 0,
                    display_order: body.display_order
                });

                // Update or create variations
                if (hasVars && variations.length > 0) {
                    for (const v of variations) {
                        productService.saveVariation(id, v);
                    }
                }

                redirect(res, `/admin/products?success=updated`);
            } else {
                // Create product
                productService.createProduct({
                    category_id: body.category_id ? Number(body.category_id) : null,
                    name: body.name,
                    slug: body.slug,
                    short_description: body.short_description,
                    description: body.description,
                    featured_image: body.featured_image,
                    badge_text: body.badge_text || null,
                    has_variations: hasVars ? 1 : 0,
                    base_price: body.base_price || 0,
                    base_sale_price: body.base_sale_price || null,
                    base_stock: body.base_stock || 0,
                    is_featured: body.is_featured ? 1 : 0,
                    is_active: body.is_active ? 1 : 0,
                    display_order: body.display_order || 0,
                    variations
                });

                redirect(res, `/admin/products?success=created`);
            }
        } catch (err) {
            redirect(res, `/admin/products?error=${encodeURIComponent(err.message)}`);
        }
    }

    deleteProduct(req, res, id) {
        try {
            productService.deleteProduct(id);
            redirect(res, '/admin/products?success=deleted');
        } catch (err) {
            redirect(res, `/admin/products?error=${encodeURIComponent(err.message)}`);
        }
    }

    inventory(req, res, query) {
        const lowStockOnly = query.lowStock === '1';
        const items = inventoryService.getInventoryOverview({ lowStockOnly });
        const movements = inventoryService.getMovements({ limit: 50 });
        const content = renderAdminInventoryView({ items, movements, lowStockOnly });
        const html = renderAdminLayout({
            title: 'Inventory & Stock Tracking - Khaja Agro Farm Admin',
            content,
            activeTab: 'inventory',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    adjustStock(req, res, body) {
        try {
            inventoryService.adjustStock({
                productId: Number(body.productId),
                variationId: body.variationId ? Number(body.variationId) : null,
                newStock: Number(body.newStock),
                reason: body.reason,
                createdBy: req.user.fullName
            });
            redirect(res, '/admin/inventory?success=adjusted');
        } catch (err) {
            redirect(res, `/admin/inventory?error=${encodeURIComponent(err.message)}`);
        }
    }

    categories(req, res, query) {
        const editId = query.edit ? Number(query.edit) : null;
        let editCategory = null;
        if (editId) {
            editCategory = categoryService.getCategoryById(editId);
        }
        const categories = categoryService.getAllCategories({ includeInactive: true });
        const content = renderAdminCategoriesView({ categories, editCategory });
        const html = renderAdminLayout({
            title: 'Categories Management - Khaja Agro Farm Admin',
            content,
            activeTab: 'categories',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    saveCategory(req, res, id, body) {
        try {
            if (id) {
                categoryService.updateCategory(id, {
                    name: body.name,
                    slug: body.slug,
                    description: body.description,
                    image_url: body.image_url,
                    display_order: body.display_order,
                    is_active: body.is_active === '1'
                });
            } else {
                categoryService.createCategory({
                    name: body.name,
                    slug: body.slug,
                    description: body.description,
                    image_url: body.image_url,
                    display_order: body.display_order,
                    is_active: body.is_active === '1'
                });
            }
            redirect(res, '/admin/categories?success=saved');
        } catch (err) {
            redirect(res, `/admin/categories?error=${encodeURIComponent(err.message)}`);
        }
    }

    deleteCategory(req, res, id, body) {
        try {
            categoryService.deleteCategory(id, {
                reassignToCategoryId: body.reassignToCategoryId ? Number(body.reassignToCategoryId) : null
            });
            redirect(res, '/admin/categories?success=deleted');
        } catch (err) {
            redirect(res, `/admin/categories?error=${encodeURIComponent(err.message)}`);
        }
    }

    attributes(req, res) {
        const attributes = attributeService.getAllAttributesWithValues();
        const content = renderAdminAttributesView({ attributes });
        const html = renderAdminLayout({
            title: 'Attributes & Variations - Khaja Agro Farm Admin',
            content,
            activeTab: 'attributes',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    createAttribute(req, res, body) {
        try {
            attributeService.createAttribute(body.name, body.slug);
            redirect(res, '/admin/attributes?success=created');
        } catch (err) {
            redirect(res, `/admin/attributes?error=${encodeURIComponent(err.message)}`);
        }
    }

    deleteAttribute(req, res, id) {
        try {
            attributeService.deleteAttribute(id);
            redirect(res, '/admin/attributes?success=deleted');
        } catch (err) {
            redirect(res, `/admin/attributes?error=${encodeURIComponent(err.message)}`);
        }
    }

    addAttributeValue(req, res, id, body) {
        try {
            attributeService.addAttributeValue(id, body.value);
            redirect(res, '/admin/attributes?success=value_added');
        } catch (err) {
            redirect(res, `/admin/attributes?error=${encodeURIComponent(err.message)}`);
        }
    }

    deleteAttributeValue(req, res, valueId) {
        try {
            attributeService.deleteAttributeValue(valueId);
            redirect(res, '/admin/attributes?success=value_deleted');
        } catch (err) {
            redirect(res, `/admin/attributes?error=${encodeURIComponent(err.message)}`);
        }
    }

    customers(req, res) {
        const customers = customerService.listCustomers({ limit: 100 });
        const content = renderAdminCustomersView({ customers });
        const html = renderAdminLayout({
            title: 'Registered Customers - Khaja Agro Farm Admin',
            content,
            activeTab: 'customers',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    setCustomerStatus(req, res, id, body) {
        try {
            customerService.setCustomerStatus(id, body.status, req.user.id);
            redirect(res, '/admin/customers?success=status');
        } catch (err) {
            redirect(res, `/admin/customers?error=${encodeURIComponent(err.message)}`);
        }
    }

    payments(req, res) {
        const paymentMethods = settingService.getPaymentMethods({ activeOnly: false });
        const content = renderAdminPaymentsView({ paymentMethods });
        const html = renderAdminLayout({
            title: 'Payment Settings - Khaja Agro Farm Admin',
            content,
            activeTab: 'payments',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    updatePayment(req, res, id, body) {
        try {
            settingService.updatePaymentMethod(id, {
                name: body.name,
                account_number: body.account_number,
                account_type: body.account_type,
                instructions: body.instructions,
                logo_url: body.logo_url,
                is_enabled: body.is_enabled === '1'
            });
            redirect(res, '/admin/payments?success=updated');
        } catch (err) {
            redirect(res, `/admin/payments?error=${encodeURIComponent(err.message)}`);
        }
    }

    delivery(req, res) {
        const delivery = settingService.getDeliverySettings();
        const content = renderAdminDeliveryView({ delivery });
        const html = renderAdminLayout({
            title: 'Delivery Settings - Khaja Agro Farm Admin',
            content,
            activeTab: 'delivery',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    updateDelivery(req, res, body) {
        try {
            settingService.updateDeliverySettings({
                default_charge: body.default_charge,
                free_delivery_threshold: body.free_delivery_threshold,
                instructions: body.instructions
            });
            redirect(res, '/admin/delivery?success=updated');
        } catch (err) {
            redirect(res, `/admin/delivery?error=${encodeURIComponent(err.message)}`);
        }
    }

    settings(req, res) {
        const settings = settingService.getAllSettings();
        const content = renderAdminStoreSettingsView({ settings });
        const html = renderAdminLayout({
            title: 'Store Settings - Khaja Agro Farm Admin',
            content,
            activeTab: 'settings',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    updateSettings(req, res, body) {
        try {
            settingService.updateStoreSettings({
                business_name: body.business_name,
                business_name_bn: body.business_name_bn,
                business_address: body.business_address,
                business_phone: body.business_phone,
                business_email: body.business_email,
                announcement_text: body.announcement_text,
                announcement_enabled: body.announcement_enabled ? '1' : '0'
            });
            redirect(res, '/admin/settings?success=updated');
        } catch (err) {
            redirect(res, `/admin/settings?error=${encodeURIComponent(err.message)}`);
        }
    }

    banners(req, res) {
        const slides = settingService.getSlides({ activeOnly: false });
        const content = renderAdminBannersView({ slides });
        const html = renderAdminLayout({
            title: 'Homepage Slides - Khaja Agro Farm Admin',
            content,
            activeTab: 'banners',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    updateBanner(req, res, id, body) {
        try {
            settingService.saveSlide({
                id: Number(id),
                title: body.title,
                subtitle: body.subtitle,
                promo_text: body.promo_text,
                button_text: body.button_text,
                link_url: body.link_url,
                image_url: body.image_url
            });
            redirect(res, '/admin/banners?success=updated');
        } catch (err) {
            redirect(res, `/admin/banners?error=${encodeURIComponent(err.message)}`);
        }
    }

    social(req, res) {
        const socialLinks = settingService.getSocialLinks({ activeOnly: false });
        const content = renderAdminSocialView({ socialLinks });
        const html = renderAdminLayout({
            title: 'Social Channels - Khaja Agro Farm Admin',
            content,
            activeTab: 'social',
            user: req.user
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    updateSocial(req, res, id, body) {
        try {
            settingService.updateSocialLink(id, {
                url: body.url,
                is_enabled: body.is_enabled === '1'
            });
            redirect(res, '/admin/social?success=updated');
        } catch (err) {
            redirect(res, `/admin/social?error=${encodeURIComponent(err.message)}`);
        }
    }
}

module.exports = new AdminRoutes();
