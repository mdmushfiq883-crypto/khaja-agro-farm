// Dynamic Product Attributes & Attribute Values Service
const { queryAll, queryOne, run, transaction } = require('../db/database');

class AttributeService {
    getAllAttributesWithValues() {
        const attributes = queryAll('SELECT * FROM attributes ORDER BY name ASC');
        const values = queryAll('SELECT * FROM attribute_values ORDER BY display_order ASC, value ASC');

        const valuesMap = {};
        for (const val of values) {
            if (!valuesMap[val.attribute_id]) {
                valuesMap[val.attribute_id] = [];
            }
            valuesMap[val.attribute_id].push(val);
        }

        return attributes.map(attr => ({
            ...attr,
            values: valuesMap[attr.id] || []
        }));
    }

    getAttributeById(id) {
        const attribute = queryOne('SELECT * FROM attributes WHERE id = ?', [id]);
        if (!attribute) return null;
        attribute.values = queryAll('SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY display_order ASC', [id]);
        return attribute;
    }

    createAttribute(name, slug) {
        if (!name || !name.trim()) throw new Error('Attribute name is required.');
        const cleanSlug = (slug || name)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        const existing = queryOne('SELECT id FROM attributes WHERE slug = ?', [cleanSlug]);
        if (existing) throw new Error(`Attribute with slug "${cleanSlug}" already exists.`);

        const res = run('INSERT INTO attributes (name, slug) VALUES (?, ?)', [name.trim(), cleanSlug]);
        return this.getAttributeById(res.lastInsertRowid);
    }

    updateAttribute(id, name, slug) {
        const attr = queryOne('SELECT * FROM attributes WHERE id = ?', [id]);
        if (!attr) throw new Error('Attribute not found.');

        let newSlug = attr.slug;
        if (slug && slug !== attr.slug) {
            newSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const existing = queryOne('SELECT id FROM attributes WHERE slug = ? AND id != ?', [newSlug, id]);
            if (existing) throw new Error(`Attribute slug "${newSlug}" is already in use.`);
        }

        run('UPDATE attributes SET name = ?, slug = ? WHERE id = ?', [name.trim(), newSlug, id]);
        return this.getAttributeById(id);
    }

    deleteAttribute(id) {
        return transaction((db) => {
            run('DELETE FROM attribute_values WHERE attribute_id = ?', [id]);
            run('DELETE FROM attributes WHERE id = ?', [id]);
            return true;
        });
    }

    addAttributeValue(attributeId, value, displayOrder = 0) {
        if (!value || !value.trim()) throw new Error('Attribute value cannot be empty.');
        const cleanVal = value.trim();

        const existing = queryOne(
            'SELECT id FROM attribute_values WHERE attribute_id = ? AND LOWER(value) = LOWER(?)',
            [attributeId, cleanVal]
        );
        if (existing) throw new Error(`Value "${cleanVal}" already exists for this attribute.`);

        const res = run(
            'INSERT INTO attribute_values (attribute_id, value, display_order) VALUES (?, ?, ?)',
            [attributeId, cleanVal, parseInt(displayOrder, 10) || 0]
        );
        return queryOne('SELECT * FROM attribute_values WHERE id = ?', [res.lastInsertRowid]);
    }

    updateAttributeValue(valueId, value, displayOrder) {
        const item = queryOne('SELECT * FROM attribute_values WHERE id = ?', [valueId]);
        if (!item) throw new Error('Attribute value not found.');

        run(
            'UPDATE attribute_values SET value = ?, display_order = ? WHERE id = ?',
            [
                value !== undefined ? value.trim() : item.value,
                displayOrder !== undefined ? parseInt(displayOrder, 10) : item.display_order,
                valueId
            ]
        );
        return queryOne('SELECT * FROM attribute_values WHERE id = ?', [valueId]);
    }

    deleteAttributeValue(valueId) {
        run('DELETE FROM attribute_values WHERE id = ?', [valueId]);
        return true;
    }
}

module.exports = new AttributeService();
