// Category Management Service
const { queryAll, queryOne, run, transaction } = require('../db/database');

class CategoryService {
    getAllCategories({ includeInactive = false } = {}) {
        const whereClause = includeInactive ? '' : 'WHERE c.is_active = 1';
        return queryAll(`
            SELECT c.*, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.name ASC
        `);
    }

    getCategoryBySlug(slug) {
        return queryOne('SELECT * FROM categories WHERE slug = ?', [slug]);
    }

    getCategoryById(id) {
        return queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    }

    createCategory({ name, slug, description, image_url, display_order = 0, is_active = 1 }) {
        if (!name || !name.trim()) {
            throw new Error('Category name is required.');
        }

        const cleanSlug = (slug || name)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const existing = queryOne('SELECT id FROM categories WHERE slug = ?', [cleanSlug]);
        if (existing) {
            throw new Error(`A category with slug "${cleanSlug}" already exists.`);
        }

        const res = run(
            `INSERT INTO categories (name, slug, description, image_url, display_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name.trim(), cleanSlug, description?.trim() || null, image_url || null, parseInt(display_order, 10) || 0, is_active ? 1 : 0]
        );

        return this.getCategoryById(res.lastInsertRowid);
    }

    updateCategory(id, { name, slug, description, image_url, display_order, is_active }) {
        const category = this.getCategoryById(id);
        if (!category) throw new Error('Category not found.');

        let newSlug = category.slug;
        if (slug && slug !== category.slug) {
            newSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const existing = queryOne('SELECT id FROM categories WHERE slug = ? AND id != ?', [newSlug, id]);
            if (existing) {
                throw new Error(`Category slug "${newSlug}" is already in use.`);
            }
        }

        run(
            `UPDATE categories
             SET name = ?, slug = ?, description = ?, image_url = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                name !== undefined ? name.trim() : category.name,
                newSlug,
                description !== undefined ? description?.trim() : category.description,
                image_url !== undefined ? image_url : category.image_url,
                display_order !== undefined ? parseInt(display_order, 10) : category.display_order,
                is_active !== undefined ? (is_active ? 1 : 0) : category.is_active,
                id
            ]
        );

        return this.getCategoryById(id);
    }

    /**
     * Safe category deletion with validation and optional product reassignment
     */
    deleteCategory(id, { reassignToCategoryId = null } = {}) {
        const category = this.getCategoryById(id);
        if (!category) throw new Error('Category not found.');

        const productCount = queryOne('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id])?.count || 0;

        return transaction((db) => {
            if (productCount > 0) {
                if (reassignToCategoryId) {
                    if (Number(reassignToCategoryId) === Number(id)) {
                        throw new Error('Cannot reassign products to the category being deleted.');
                    }
                    const targetCategory = this.getCategoryById(reassignToCategoryId);
                    if (!targetCategory) throw new Error('Target category for product reassignment does not exist.');

                    run('UPDATE products SET category_id = ? WHERE category_id = ?', [reassignToCategoryId, id]);
                } else {
                    // Safe set to NULL rather than deleting products
                    run('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
                }
            }

            run('DELETE FROM categories WHERE id = ?', [id]);
            return { deleted: true, reassignedProducts: productCount };
        });
    }
}

module.exports = new CategoryService();
