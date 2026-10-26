// Security Utility: Scrypt Password Hashing and Crypto Helpers
const crypto = require('node:crypto');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

function generateToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

function generateOrderNumber() {
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomInt(1000, 9999);
    return `KAF-${ymd}-${rand}`;
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    generateOrderNumber
};
