// Data Formatting Utilities for Bangladeshi E-Commerce
const config = require('../config/config');

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function formatPrice(amount, options = {}) {
    if (amount === null || amount === undefined || isNaN(amount)) return '৳ 0';
    const num = Math.round(Number(amount));
    const formatted = num.toLocaleString('en-US');
    return `${config.BUSINESS.CURRENCY_SYMBOL} ${formatted}`;
}

function toBengaliNumerals(number) {
    if (number === null || number === undefined) return '';
    return String(number).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 11) {
        return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    return phone;
}

function formatDate(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString('en-GB', {
        timeZone: config.BUSINESS.TIMEZONE,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = {
    formatPrice,
    toBengaliNumerals,
    formatPhone,
    formatDate,
    escapeHtml
};
