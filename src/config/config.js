// Application Configuration
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DB_PATH = process.env.DB_PATH || path.join(ROOT_DIR, 'data', 'khaja_agro.db');

const isProduction = process.env.NODE_ENV === 'production';
let sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    if (isProduction) {
        console.warn('⚠️ [SECURITY WARNING] SESSION_SECRET is not set in production! Configure SESSION_SECRET in your Railway dashboard variables.');
    }
    sessionSecret = 'khaja_agro_secure_session_dev_fallback_2026';
}

module.exports = {
    ROOT_DIR,
    DB_PATH,
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    SESSION_SECRET: sessionSecret,
    SESSION_MAX_AGE_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
    ADMIN_SETUP_SECRET: process.env.ADMIN_SETUP_SECRET || 'khaja_agro_initial_admin_secret_9988',

    BUSINESS: {
        NAME: 'Khaja Agro Farm',
        NAME_BN: 'খাজা এগ্রো ফার্ম',
        TAGLINE: 'Freshness You Can Trust',
        TAGLINE_BN: 'বিশুদ্ধ খাদ্য, সুস্থ জীবন',
        HERO_TITLE: 'Pure Food for a Better Life',
        HERO_TITLE_BN: 'উন্নত জীবনের জন্য খাঁটি খাবার',
        HERO_SUBTITLE: 'Fresh • Healthy • Natural',
        HERO_SUBTITLE_BN: 'তাজা • স্বাস্থ্যকর • প্রাকৃতিক',
        HERO_DESC: 'We bring you fresh and natural products from our farm to your home. Quality, purity and health is our promise.',
        HERO_DESC_BN: 'আমাদের খামার থেকে সরাসরি আপনার ঘরে পৌঁছে দিচ্ছি তাজা ও প্রাকৃতিক খাদ্যপণ্য। গুণমান, বিশুদ্ধতা এবং সুস্বাস্থ্যই আমাদের অঙ্গীকার।',
        ADDRESS: 'ভেল্লাপাড়া ব্রিজ সংলগ্ন, শিকলবাহা, কর্ণফুলী, চট্টগ্রাম।',
        ADDRESS_EN: 'Vellapara Bridge, Shikalbaha, Karnaphuli, Chattogram',
        PHONE: '01970271398',
        WHATSAPP: '01970271398',
        EMAIL: 'mdmudhfiq883@gmail.com',
        SECONDARY_EMAIL: 'khajaagrofarm@gmail.com',
        CURRENCY_SYMBOL: '৳',
        CURRENCY_CODE: 'BDT',
        TIMEZONE: 'Asia/Dhaka'
    },

    BRAND_COLORS: {
        DEEP_FOREST_GREEN: '#075B35',
        PRIMARY_FARM_GREEN: '#087A3E',
        FRESH_LEAF_GREEN: '#42A85A',
        SOFT_IVORY: '#FAFAF5',
        WHITE: '#FFFFFF',
        LIGHT_SAGE: '#EDF5EC',
        DARK_TEXT: '#173528'
    }
};
