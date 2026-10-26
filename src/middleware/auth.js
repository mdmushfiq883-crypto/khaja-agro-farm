// Authentication and RBAC Middleware
const authService = require('../services/authService');

function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;

    cookieHeader.split(';').forEach(cookie => {
        let [name, ...rest] = cookie.split('=');
        name = name?.trim();
        if (!name) return;
        const value = rest.join('=').trim();
        list[name] = decodeURIComponent(value);
    });

    return list;
}

function loadSession(req) {
    const cookies = parseCookies(req.headers['cookie']);
    const token = cookies['kaf_session'];
    if (!token) return null;
    return authService.validateSession(token);
}

function authenticate(req, res, next) {
    const user = loadSession(req);
    req.user = user;
    if (next) next();
}

function requireAuth(req, res, next) {
    authenticate(req, res);
    if (!req.user) {
        if (req.headers['accept']?.includes('application/json')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Authentication required. Please login.' }));
            return false;
        } else {
            res.writeHead(302, { 'Location': '/login?returnUrl=' + encodeURIComponent(req.url) });
            res.end();
            return false;
        }
    }
    return true;
}

function requireAdmin(req, res, next) {
    authenticate(req, res);
    if (!req.user || req.user.role !== 'admin') {
        if (req.headers['accept']?.includes('application/json')) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Access denied: Administrator privileges required.' }));
            return false;
        } else {
            res.writeHead(302, { 'Location': '/admin/login?error=unauthorized' });
            res.end();
            return false;
        }
    }
    return true;
}

module.exports = {
    parseCookies,
    loadSession,
    authenticate,
    requireAuth,
    requireAdmin
};
