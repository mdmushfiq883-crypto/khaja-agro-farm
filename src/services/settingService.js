// Store Settings, Payment Methods, Delivery, Slides, and Social Links Service
const { queryAll, queryOne, run } = require('../db/database');

class SettingService {
    // Store Settings
    getAllSettings() {
        const rows = queryAll('SELECT key, value, description FROM store_settings');
        const settings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        return settings;
    }

    getSetting(key, defaultValue = null) {
        const row = queryOne('SELECT value FROM store_settings WHERE key = ?', [key]);
        return row ? row.value : defaultValue;
    }

    setSetting(key, value, description = null) {
        run(`
            INSERT INTO store_settings (key, value, description, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                description = COALESCE(excluded.description, store_settings.description),
                updated_at = CURRENT_TIMESTAMP
        `, [key, String(value), description]);
        return value;
    }

    updateStoreSettings(settingsObj) {
        for (const [key, value] of Object.entries(settingsObj)) {
            this.setSetting(key, value);
        }
        return this.getAllSettings();
    }

    // Payment Methods
    getPaymentMethods({ activeOnly = false } = {}) {
        const whereClause = activeOnly ? 'WHERE is_enabled = 1' : '';
        return queryAll(`SELECT * FROM payment_methods ${whereClause} ORDER BY display_order ASC, id ASC`);
    }

    getPaymentMethodByCode(code) {
        return queryOne('SELECT * FROM payment_methods WHERE code = ?', [code]);
    }

    updatePaymentMethod(id, { name, account_number, account_type, instructions, logo_url, is_enabled, display_order }) {
        run(`
            UPDATE payment_methods SET
                name = COALESCE(?, name),
                account_number = COALESCE(?, account_number),
                account_type = COALESCE(?, account_type),
                instructions = COALESCE(?, instructions),
                logo_url = COALESCE(?, logo_url),
                is_enabled = COALESCE(?, is_enabled),
                display_order = COALESCE(?, display_order),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            name !== undefined ? name.trim() : null,
            account_number !== undefined ? account_number.trim() : null,
            account_type !== undefined ? account_type.trim() : null,
            instructions !== undefined ? instructions.trim() : null,
            logo_url !== undefined ? logo_url.trim() : null,
            is_enabled !== undefined ? (is_enabled ? 1 : 0) : null,
            display_order !== undefined ? parseInt(display_order, 10) : null,
            id
        ]);
        return queryOne('SELECT * FROM payment_methods WHERE id = ?', [id]);
    }

    // Delivery Settings
    getDeliverySettings() {
        let settings = queryOne('SELECT * FROM delivery_settings WHERE id = 1');
        if (!settings) {
            run(`INSERT INTO delivery_settings (id, default_charge, free_delivery_threshold, area_rules_json, instructions)
                 VALUES (1, 60.0, 1500.0, '[]', 'Express delivery across Chattogram.')`);
            settings = queryOne('SELECT * FROM delivery_settings WHERE id = 1');
        }
        return settings;
    }

    updateDeliverySettings({ default_charge, free_delivery_threshold, area_rules_json, instructions, is_enabled }) {
        run(`
            UPDATE delivery_settings SET
                default_charge = COALESCE(?, default_charge),
                free_delivery_threshold = COALESCE(?, free_delivery_threshold),
                area_rules_json = COALESCE(?, area_rules_json),
                instructions = COALESCE(?, instructions),
                is_enabled = COALESCE(?, is_enabled),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
        `, [
            default_charge !== undefined ? parseFloat(default_charge) : null,
            free_delivery_threshold !== undefined ? parseFloat(free_delivery_threshold) : null,
            area_rules_json !== undefined ? area_rules_json : null,
            instructions !== undefined ? instructions.trim() : null,
            is_enabled !== undefined ? (is_enabled ? 1 : 0) : null
        ]);
        return this.getDeliverySettings();
    }

    // Homepage Slides
    getSlides({ activeOnly = false } = {}) {
        const whereClause = activeOnly ? 'WHERE is_active = 1' : '';
        return queryAll(`SELECT * FROM homepage_slides ${whereClause} ORDER BY display_order ASC, id ASC`);
    }

    saveSlide({ id = null, title, subtitle, promo_text, button_text, link_url, image_url, display_order = 0, is_active = 1 }) {
        if (id) {
            run(`
                UPDATE homepage_slides SET
                    title = ?,
                    subtitle = ?,
                    promo_text = ?,
                    button_text = ?,
                    link_url = ?,
                    image_url = ?,
                    display_order = ?,
                    is_active = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [title.trim(), subtitle.trim(), promo_text?.trim() || null, button_text.trim(), link_url.trim(), image_url.trim(), parseInt(display_order, 10) || 0, is_active ? 1 : 0, id]);
            return queryOne('SELECT * FROM homepage_slides WHERE id = ?', [id]);
        } else {
            const res = run(`
                INSERT INTO homepage_slides (title, subtitle, promo_text, button_text, link_url, image_url, display_order, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [title.trim(), subtitle.trim(), promo_text?.trim() || null, button_text.trim(), link_url.trim(), image_url.trim(), parseInt(display_order, 10) || 0, is_active ? 1 : 0]);
            return queryOne('SELECT * FROM homepage_slides WHERE id = ?', [res.lastInsertRowid]);
        }
    }

    deleteSlide(id) {
        run('DELETE FROM homepage_slides WHERE id = ?', [id]);
        return true;
    }

    // Social Links
    getSocialLinks({ activeOnly = false } = {}) {
        const whereClause = activeOnly ? 'WHERE is_enabled = 1' : '';
        return queryAll(`SELECT * FROM social_links ${whereClause} ORDER BY display_order ASC, id ASC`);
    }

    updateSocialLink(id, { url, is_enabled, display_order }) {
        run(`
            UPDATE social_links SET
                url = COALESCE(?, url),
                is_enabled = COALESCE(?, is_enabled),
                display_order = COALESCE(?, display_order),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            url !== undefined ? url.trim() : null,
            is_enabled !== undefined ? (is_enabled ? 1 : 0) : null,
            display_order !== undefined ? parseInt(display_order, 10) : null,
            id
        ]);
        return queryOne('SELECT * FROM social_links WHERE id = ?', [id]);
    }
}

module.exports = new SettingService();
