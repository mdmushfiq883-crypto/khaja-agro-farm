// Product and Variation Management Service
const { queryAll, queryOne, run, transaction } = require('../db/database');

class ProductService {
    /**
     * Get products with flexible filtering and sorting
     */
    getAllProducts({
        categoryId = null,
        categorySlug = null,
        search = null,
        isFeatured = null,
        isActive = 1,
        limit = 50,
        offset = 0,
        sortBy = 'display_order'
    } = {}) {
        let whereClauses = [];
        let params = [];

        if (isActive !== null) {
            whereClauses.push('p.is_active = ?');
            params.push(isActive ? 1 : 0);
        }

        if (categoryId) {
            whereClauses.push('p.category_id = ?');
            params.push(categoryId);
        }

        if (categorySlug) {
            whereClauses.push('c.slug = ?');
            params.push(categorySlug);
        }

        if (isFeatured !== null) {
            whereClauses.push('p.is_featured = ?');
            params.push(isFeatured ? 1 : 0);
        }

        if (search && search.trim()) {
            const query = `%${search.trim()}%`;
            whereClauses.push('(p.name LIKE ? OR p.short_description LIKE ? OR c.name LIKE ?)');
            params.push(query, query, query);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        let orderSql = 'p.display_order ASC, p.id DESC';
        if (sortBy === 'price_asc') orderSql = 'COALESCE(p.base_sale_price, p.base_price) ASC';
        if (sortBy === 'price_desc') orderSql = 'COALESCE(p.base_sale_price, p.base_price) DESC';
        if (sortBy === 'newest') orderSql = 'p.created_at DESC';

        const sql = `
            SELECT
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                (SELECT COUNT(*) FROM product_variations pv WHERE pv.product_id = p.id AND pv.is_active = 1) as variation_count,
                (SELECT MIN(COALESCE(pv.sale_price, pv.regular_price)) FROM product_variations pv WHERE pv.product_id = p.id AND pv.is_active = 1) as min_variation_price,
                (SELECT MAX(COALESCE(pv.sale_price, pv.regular_price)) FROM product_variations pv WHERE pv.product_id = p.id AND pv.is_active = 1) as max_variation_price,
                (SELECT SUM(pv.stock_quantity) FROM product_variations pv WHERE pv.product_id = p.id AND pv.is_active = 1) as total_variation_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereSql}
            ORDER BY ${orderSql}
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);
        const products = queryAll(sql, params);

        // Attach variations to each product
        return products.map(prod => {
            const variations = this.getProductVariations(prod.id, { activeOnly: isActive === 1 });
            return {
                ...prod,
                variations
            };
        });
    }

    /**
     * Get single product by Slug with all variations, images, and category
     */
    getProductBySlug(slug) {
        const product = queryOne(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ?
        `, [slug]);

        if (!product) return null;

        product.variations = this.getProductVariations(product.id, { activeOnly: false });
        product.images = queryAll('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC', [product.id]);
        return product;
    }

    /**
     * Get single product by ID
     */
    getProductById(id) {
        const product = queryOne(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (!product) return null;

        product.variations = this.getProductVariations(product.id, { activeOnly: false });
        product.images = queryAll('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC', [product.id]);
        return product;
    }

    /**
     * Get product variations
     */
    getProductVariations(productId, { activeOnly = false } = {}) {
        const activeSql = activeOnly ? 'AND pv.is_active = 1' : '';
        const variations = queryAll(`
            SELECT pv.*
            FROM product_variations pv
            WHERE pv.product_id = ? ${activeSql}
            ORDER BY pv.display_order ASC, pv.regular_price ASC
        `, [productId]);

        return variations.map(v => {
            const attributes = queryAll(`
                SELECT a.id as attribute_id, a.name as attribute_name, a.slug as attribute_slug,
                       av.id as value_id, av.value as attribute_value
                FROM product_variation_values pvv
                JOIN attributes a ON pvv.attribute_id = a.id
                JOIN attribute_values av ON pvv.attribute_value_id = av.id
                WHERE pvv.variation_id = ?
            `, [v.id]);

            return {
                ...v,
                attributes
            };
        });
    }

    /**
     * Create product with optional variations
     */
    createProduct({
        category_id,
        name,
        slug,
        short_description,
        description,
        featured_image,
        badge_text,
        has_variations = 0,
        base_price = 0,
        base_sale_price = null,
        base_stock = 0,
        low_stock_threshold = 5,
        is_featured = 0,
        is_active = 1,
        display_order = 0,
        variations = [],
        extra_images = []
    }) {
        if (!name || !name.trim()) throw new Error('Product name is required.');

        const cleanSlug = (slug || name)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const existing = queryOne('SELECT id FROM products WHERE slug = ?', [cleanSlug]);
        if (existing) throw new Error(`Product slug "${cleanSlug}" already exists.`);

        return transaction((db) => {
            const res = run(`
                INSERT INTO products (
                    category_id, name, slug, short_description, description,
                    featured_image, badge_text, has_variations, base_price, base_sale_price,
                    base_stock, low_stock_threshold, is_featured, is_active, display_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                category_id || null,
                name.trim(),
                cleanSlug,
                short_description?.trim() || null,
                description?.trim() || null,
                featured_image || null,
                badge_text || null,
                has_variations ? 1 : 0,
                parseFloat(base_price) || 0,
                base_sale_price ? parseFloat(base_sale_price) : null,
                parseInt(base_stock, 10) || 0,
                parseInt(low_stock_threshold, 10) || 5,
                is_featured ? 1 : 0,
                is_active ? 1 : 0,
                parseInt(display_order, 10) || 0
            ]);

            const productId = res.lastInsertRowid;

            // Handle variations if variable product
            if (has_variations && Array.isArray(variations)) {
                let vOrder = 1;
                for (const v of variations) {
                    if (!v.sku || !v.sku.trim()) continue;
                    const vRes = run(`
                        INSERT INTO product_variations (
                            product_id, variation_name, sku, regular_price, sale_price,
                            stock_quantity, low_stock_threshold, image_url, is_active, display_order
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        productId,
                        v.variation_name || v.name || 'Standard',
                        v.sku.trim().toUpperCase(),
                        parseFloat(v.regular_price) || 0,
                        v.sale_price ? parseFloat(v.sale_price) : null,
                        parseInt(v.stock_quantity ?? v.stock, 10) || 0,
                        parseInt(v.low_stock_threshold, 10) || 5,
                        v.image_url || featured_image || null,
                        v.is_active !== undefined ? (v.is_active ? 1 : 0) : 1,
                        vOrder++
                    ]);

                    // Initial movement
                    run(`
                        INSERT INTO inventory_movements (product_id, variation_id, change_quantity, new_stock, reason, created_by)
                        VALUES (?, ?, ?, ?, 'Initial variation stock creation', 'admin')
                    `, [productId, vRes.lastInsertRowid, parseInt(v.stock_quantity ?? v.stock, 10) || 0, parseInt(v.stock_quantity ?? v.stock, 10) || 0]);
                }
            } else {
                // Initial movement for simple product
                run(`
                    INSERT INTO inventory_movements (product_id, change_quantity, new_stock, reason, created_by)
                    VALUES (?, ?, ?, 'Initial product stock creation', 'admin')
                `, [productId, parseInt(base_stock, 10) || 0, parseInt(base_stock, 10) || 0]);
            }

            // Handle extra images
            if (Array.isArray(extra_images)) {
                let imgOrder = 1;
                for (const imgUrl of extra_images) {
                    if (!imgUrl || !imgUrl.trim()) continue;
                    run(`INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)`,
                        [productId, imgUrl.trim(), imgOrder++]);
                }
            }

            return this.getProductById(productId);
        });
    }

    /**
     * Update product
     */
    updateProduct(id, updateData) {
        const prod = this.getProductById(id);
        if (!prod) throw new Error('Product not found.');

        let newSlug = prod.slug;
        if (updateData.slug && updateData.slug !== prod.slug) {
            newSlug = updateData.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const existing = queryOne('SELECT id FROM products WHERE slug = ? AND id != ?', [newSlug, id]);
            if (existing) throw new Error(`Slug "${newSlug}" is already in use by another product.`);
        }

        return transaction((db) => {
            run(`
                UPDATE products SET
                    category_id = ?,
                    name = ?,
                    slug = ?,
                    short_description = ?,
                    description = ?,
                    featured_image = ?,
                    badge_text = ?,
                    has_variations = ?,
                    base_price = ?,
                    base_sale_price = ?,
                    base_stock = ?,
                    low_stock_threshold = ?,
                    is_featured = ?,
                    is_active = ?,
                    display_order = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                updateData.category_id !== undefined ? updateData.category_id : prod.category_id,
                updateData.name !== undefined ? updateData.name.trim() : prod.name,
                newSlug,
                updateData.short_description !== undefined ? updateData.short_description : prod.short_description,
                updateData.description !== undefined ? updateData.description : prod.description,
                updateData.featured_image !== undefined ? updateData.featured_image : prod.featured_image,
                updateData.badge_text !== undefined ? updateData.badge_text : prod.badge_text,
                updateData.has_variations !== undefined ? (updateData.has_variations ? 1 : 0) : prod.has_variations,
                updateData.base_price !== undefined ? parseFloat(updateData.base_price) : prod.base_price,
                updateData.base_sale_price !== undefined ? (updateData.base_sale_price ? parseFloat(updateData.base_sale_price) : null) : prod.base_sale_price,
                updateData.base_stock !== undefined ? parseInt(updateData.base_stock, 10) : prod.base_stock,
                updateData.low_stock_threshold !== undefined ? parseInt(updateData.low_stock_threshold, 10) : prod.low_stock_threshold,
                updateData.is_featured !== undefined ? (updateData.is_featured ? 1 : 0) : prod.is_featured,
                updateData.is_active !== undefined ? (updateData.is_active ? 1 : 0) : prod.is_active,
                updateData.display_order !== undefined ? parseInt(updateData.display_order, 10) : prod.display_order,
                id
            ]);

            return this.getProductById(id);
        });
    }

    /**
     * Add or update variation
     */
    saveVariation(productId, {
        id = null,
        variation_name,
        sku,
        regular_price,
        sale_price = null,
        stock_quantity = 0,
        low_stock_threshold = 5,
        image_url = null,
        is_active = 1,
        display_order = 0
    }) {
        if (!sku || !sku.trim()) throw new Error('Variation SKU is required.');
        const cleanSku = sku.trim().toUpperCase();

        if (id) {
            const existingSku = queryOne('SELECT id FROM product_variations WHERE sku = ? AND id != ?', [cleanSku, id]);
            if (existingSku) throw new Error(`SKU "${cleanSku}" is already in use by another variation.`);

            run(`
                UPDATE product_variations SET
                    variation_name = ?,
                    sku = ?,
                    regular_price = ?,
                    sale_price = ?,
                    stock_quantity = ?,
                    low_stock_threshold = ?,
                    image_url = ?,
                    is_active = ?,
                    display_order = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND product_id = ?
            `, [
                variation_name.trim(),
                cleanSku,
                parseFloat(regular_price),
                sale_price ? parseFloat(sale_price) : null,
                parseInt(stock_quantity, 10),
                parseInt(low_stock_threshold, 10),
                image_url || null,
                is_active ? 1 : 0,
                parseInt(display_order, 10) || 0,
                id,
                productId
            ]);

            return queryOne('SELECT * FROM product_variations WHERE id = ?', [id]);
        } else {
            const existingSku = queryOne('SELECT id FROM product_variations WHERE sku = ?', [cleanSku]);
            if (existingSku) throw new Error(`SKU "${cleanSku}" already exists.`);

            const res = run(`
                INSERT INTO product_variations (
                    product_id, variation_name, sku, regular_price, sale_price,
                    stock_quantity, low_stock_threshold, image_url, is_active, display_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                productId,
                variation_name.trim(),
                cleanSku,
                parseFloat(regular_price),
                sale_price ? parseFloat(sale_price) : null,
                parseInt(stock_quantity, 10),
                parseInt(low_stock_threshold, 10),
                image_url || null,
                is_active ? 1 : 0,
                parseInt(display_order, 10) || 0
            ]);

            const newVarId = res.lastInsertRowid;
            run(`
                INSERT INTO inventory_movements (product_id, variation_id, change_quantity, new_stock, reason, created_by)
                VALUES (?, ?, ?, ?, 'Initial variation stock creation', 'admin')
            `, [productId, newVarId, parseInt(stock_quantity, 10), parseInt(stock_quantity, 10)]);

            return queryOne('SELECT * FROM product_variations WHERE id = ?', [newVarId]);
        }
    }

    /**
     * Delete variation safely
     */
    deleteVariation(variationId) {
        return transaction((db) => {
            run('DELETE FROM product_variation_values WHERE variation_id = ?', [variationId]);
            run('DELETE FROM product_variations WHERE id = ?', [variationId]);
            return true;
        });
    }

    /**
     * Delete product safely
     */
    deleteProduct(id) {
        return transaction((db) => {
            run('DELETE FROM product_images WHERE product_id = ?', [id]);
            run('DELETE FROM product_variations WHERE product_id = ?', [id]);
            run('DELETE FROM products WHERE id = ?', [id]);
            return true;
        });
    }
}

module.exports = new ProductService();
