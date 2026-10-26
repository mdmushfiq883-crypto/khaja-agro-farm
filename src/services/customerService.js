// Customer Management and Profile Service
const { queryAll, queryOne, run } = require('../db/database');

class CustomerService {
    listCustomers({ search = null, status = null, limit = 50, offset = 0 } = {}) {
        let whereClauses = ["u.role = 'customer'"];
        let params = [];

        if (status) {
            whereClauses.push('u.status = ?');
            params.push(status);
        }

        if (search && search.trim()) {
            const q = `%${search.trim()}%`;
            whereClauses.push('(u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)');
            params.push(q, q, q);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        return queryAll(`
            SELECT
                u.id, u.full_name, u.phone, u.email, u.role, u.status, u.created_at,
                (SELECT COUNT(*) FROM orders o WHERE o.customer_id = u.id) as total_orders,
                (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.customer_id = u.id AND o.order_status != 'Cancelled') as total_spent,
                (SELECT o.created_at FROM orders o WHERE o.customer_id = u.id ORDER BY o.id DESC LIMIT 1) as last_order_date
            FROM users u
            ${whereSql}
            ORDER BY u.id DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit, 10) || 50, parseInt(offset, 10) || 0]);
    }

    getCustomerDetails(id) {
        const user = queryOne(`
            SELECT id, full_name, phone, email, role, status, created_at, updated_at
            FROM users
            WHERE id = ? AND role = 'customer'
        `, [id]);

        if (!user) return null;

        user.addresses = queryAll('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC', [id]);
        user.orders = queryAll(`
            SELECT o.*, pm.name as payment_method_name
            FROM orders o
            LEFT JOIN payment_methods pm ON o.payment_method_code = pm.code
            WHERE o.customer_id = ?
            ORDER BY o.id DESC
        `, [id]);

        return user;
    }

    setCustomerStatus(id, newStatus, adminId) {
        if (!['active', 'suspended'].includes(newStatus)) {
            throw new Error('Invalid customer status.');
        }

        run("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = 'customer'", [newStatus, id]);

        if (newStatus === 'suspended') {
            // Invalidate all active sessions for suspended customer
            run('DELETE FROM user_sessions WHERE user_id = ?', [id]);
        }

        run(`
            INSERT INTO audit_logs (user_id, action, entity, entity_id, details_json)
            VALUES (?, 'UPDATE_CUSTOMER_STATUS', 'user', ?, ?)
        `, [adminId, String(id), JSON.stringify({ status: newStatus })]);

        return true;
    }

    // Customer profile address management
    saveAddress(userId, { id = null, recipient_name, phone, address_line, city = 'Chattogram', area = null, is_default = 0 }) {
        if (!address_line || !address_line.trim()) throw new Error('Address is required.');

        if (is_default) {
            run('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        if (id) {
            run(`
                UPDATE user_addresses SET
                    recipient_name = ?,
                    phone = ?,
                    address_line = ?,
                    city = ?,
                    area = ?,
                    is_default = ?
                WHERE id = ? AND user_id = ?
            `, [recipient_name.trim(), phone.trim(), address_line.trim(), city.trim(), area?.trim() || null, is_default ? 1 : 0, id, userId]);
            return queryOne('SELECT * FROM user_addresses WHERE id = ?', [id]);
        } else {
            const res = run(`
                INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, city, area, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, recipient_name.trim(), phone.trim(), address_line.trim(), city.trim(), area?.trim() || null, is_default ? 1 : 0]);
            return queryOne('SELECT * FROM user_addresses WHERE id = ?', [res.lastInsertRowid]);
        }
    }
}

module.exports = new CustomerService();
