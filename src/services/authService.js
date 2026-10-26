// Authentication & User Session Service
const { queryOne, run, transaction } = require('../db/database');
const { hashPassword, verifyPassword, generateToken } = require('../utils/security');
const config = require('../config/config');

class AuthService {
    /**
     * Register a new customer
     */
    registerCustomer({ fullName, phone, email, password, address, city }) {
        if (!fullName || !phone || !password) {
            throw new Error('Full name, phone number, and password are required.');
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length !== 11) {
            throw new Error('Please enter a valid 11-digit Bangladeshi mobile number.');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }

        const existingPhone = queryOne('SELECT id FROM users WHERE phone = ?', [cleanPhone]);
        if (existingPhone) {
            throw new Error('An account with this phone number already exists.');
        }

        if (email) {
            const existingEmail = queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
            if (existingEmail) {
                throw new Error('An account with this email address already exists.');
            }
        }

        const passwordHash = hashPassword(password);
        const cleanEmail = email ? email.trim().toLowerCase() : null;

        return transaction((db) => {
            const result = run(
                `INSERT INTO users (full_name, phone, email, password_hash, role, status)
                 VALUES (?, ?, ?, ?, 'customer', 'active')`,
                [fullName.trim(), cleanPhone, cleanEmail, passwordHash]
            );

            const userId = result.lastInsertRowid;

            if (address) {
                run(
                    `INSERT INTO user_addresses (user_id, recipient_name, phone, address_line, city, is_default)
                     VALUES (?, ?, ?, ?, ?, 1)`,
                    [userId, fullName.trim(), cleanPhone, address.trim(), city || 'Chattogram']
                );
            }

            return this.createSession(userId);
        });
    }

    /**
     * Login user (customer, staff, or admin)
     */
    loginUser({ identifier, password, ipAddress, userAgent }) {
        if (!identifier || !password) {
            throw new Error('Phone/Email and password are required.');
        }

        const clean = (identifier || '').trim();
        const cleanPass = (password || '').trim();

        let user = null;
        if (clean.toLowerCase() === 'admin') {
            user = queryOne(`SELECT id, full_name, phone, email, password_hash, role, status FROM users WHERE role = 'admin' LIMIT 1`);
        } else {
            const digits = clean.replace(/[^0-9]/g, '');
            const phone11 = digits.length >= 11 ? digits.slice(-11) : clean;
            user = queryOne(
                `SELECT id, full_name, phone, email, password_hash, role, status
                 FROM users
                 WHERE phone = ? OR phone = ? OR LOWER(email) = LOWER(?)`,
                [clean, phone11, clean]
            );
        }

        if (!user) {
            throw new Error('Invalid phone/email or password.');
        }

        if (user.status === 'suspended') {
            throw new Error('Your account has been suspended. Please contact support.');
        }

        const isMatch = verifyPassword(cleanPass, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid phone/email or password.');
        }

        const session = this.createSession(user.id, ipAddress, userAgent);
        return {
            session,
            user: {
                id: user.id,
                fullName: user.full_name,
                phone: user.phone,
                email: user.email,
                role: user.role
            }
        };
    }

    /**
     * Create user session with 30-day expiry
     */
    createSession(userId, ipAddress = null, userAgent = null) {
        const token = generateToken(32);
        const expiresAt = new Date(Date.now() + config.SESSION_MAX_AGE_MS).toISOString();

        run(
            `INSERT INTO user_sessions (token, user_id, expires_at, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [token, userId, expiresAt, ipAddress, userAgent]
        );

        return { token, expiresAt };
    }

    /**
     * Validate session token from cookie
     */
    validateSession(token) {
        if (!token) return null;

        const session = queryOne(
            `SELECT s.token, s.user_id, s.expires_at, u.id, u.full_name, u.phone, u.email, u.role, u.status
             FROM user_sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.token = ?`,
            [token]
        );

        if (!session) return null;

        if (new Date(session.expires_at) < new Date()) {
            this.destroySession(token);
            return null;
        }

        if (session.status === 'suspended') {
            return null;
        }

        return {
            id: session.id,
            fullName: session.full_name,
            phone: session.phone,
            email: session.email,
            role: session.role,
            status: session.status
        };
    }

    /**
     * Destroy session on logout
     */
    destroySession(token) {
        if (!token) return;
        run('DELETE FROM user_sessions WHERE token = ?', [token]);
    }

    /**
     * Change user password
     */
    changePassword(userId, currentPassword, newPassword) {
        const user = queryOne('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (!user) throw new Error('User not found.');

        if (!verifyPassword(currentPassword, user.password_hash)) {
            throw new Error('Current password is incorrect.');
        }

        if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long.');
        }

        const newHash = hashPassword(newPassword);
        run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, userId]);
        return true;
    }

    /**
     * Secure one-time admin provisioning with server secret
     */
    provisionAdmin({ setupSecret, fullName, phone, email, password }) {
        if (!setupSecret || setupSecret !== config.ADMIN_SETUP_SECRET) {
            throw new Error('Unauthorized: Invalid admin setup secret.');
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const existing = queryOne('SELECT id FROM users WHERE phone = ?', [cleanPhone]);
        const passwordHash = hashPassword(password);

        if (existing) {
            run(
                `UPDATE users
                 SET full_name = ?, email = ?, password_hash = ?, role = 'admin', status = 'active', updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [fullName, email || null, passwordHash, existing.id]
            );
            return existing.id;
        } else {
            const res = run(
                `INSERT INTO users (full_name, phone, email, password_hash, role, status)
                 VALUES (?, ?, ?, ?, 'admin', 'active')`,
                [fullName, cleanPhone, email || null, passwordHash]
            );
            return res.lastInsertRowid;
        }
    }
}

module.exports = new AuthService();
