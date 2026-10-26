// Seed Khaja Agro Farm Database
const { getDb, initSchema, queryOne, run, transaction } = require('./database');
const { hashPassword } = require('../utils/security');
const config = require('../config/config');

function seedDatabase() {
    console.log('Initializing database schema...');
    initSchema();

    transaction((db) => {
        console.log('Seeding store settings...');
        const settings = [
            ['business_name', config.BUSINESS.NAME, 'Official business name'],
            ['business_name_bn', config.BUSINESS.NAME_BN, 'Bengali business name'],
            ['business_tagline', config.BUSINESS.TAGLINE, 'Business tagline'],
            ['business_address', config.BUSINESS.ADDRESS, 'Main farm and outlet address'],
            ['business_phone', config.BUSINESS.PHONE, 'Primary contact & WhatsApp phone'],
            ['business_email', config.BUSINESS.EMAIL, 'Official business email'],
            ['announcement_text', '🌱 Fresh & Healthy Products | From Our Farm To Your Home | 🚚 Free Delivery Over ৳1,500 | 🌿 100% Natural', 'Top announcement bar message'],
            ['announcement_enabled', '1', 'Show announcement bar on storefront'],
            ['default_currency', config.BUSINESS.CURRENCY_SYMBOL, 'Currency symbol'],
            ['default_timezone', config.BUSINESS.TIMEZONE, 'Timezone']
        ];

        for (const [key, val, desc] of settings) {
            run(`INSERT INTO store_settings (key, value, description)
                 VALUES (?, ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [key, val, desc]);
        }

        console.log('Seeding categories...');
        const categories = [
            { name: 'Milk & Dairy', slug: 'milk-dairy', description: 'Fresh, 100% pure cow milk, desi ghee, butter, cheese, and farm yogurt.', image: '/images/categories/milk-dairy.png', order: 1, is_active: 1 },
            { name: 'Beef', slug: 'beef', description: 'Premium grass-fed, grain-finished fresh organic beef.', image: '/images/categories/beef.png', order: 2, is_active: 1 },
            { name: 'Ghee', slug: 'ghee', description: 'Aromatic traditional pure desi cow ghee made from cultured farm butter.', image: '/images/categories/ghee.png', order: 3, is_active: 0 },
            { name: 'Green Vegetables', slug: 'green-vegetables', description: 'Chemical-free fresh farm-harvested seasonal greens and vegetables.', image: '/images/categories/vegetables.png', order: 4, is_active: 1 },
            { name: 'Poultry', slug: 'poultry', description: 'Free-range deshi and broiler chicken and organic farm eggs.', image: '/images/categories/poultry.png', order: 5, is_active: 1 }
        ];

        for (const cat of categories) {
            run(`INSERT INTO categories (name, slug, description, image_url, display_order, is_active)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON CONFLICT(slug) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    image_url = excluded.image_url,
                    display_order = excluded.display_order,
                    is_active = excluded.is_active`,
                [cat.name, cat.slug, cat.description, cat.image, cat.order, cat.is_active]);
        }

        console.log('Seeding product attributes & values...');
        const attrs = [
            { name: 'Size / Volume', slug: 'volume', values: ['500 ml', '1 Ltr', '2 Ltr'] },
            { name: 'Weight', slug: 'weight', values: ['250 gm', '500 gm', '1 Kg', '2 Kg'] },
            { name: 'Pack Quantity', slug: 'pack-qty', values: ['12 pcs (1 Dozen)', '30 pcs (Full Tray)'] }
        ];

        for (const attr of attrs) {
            run(`INSERT INTO attributes (name, slug) VALUES (?, ?) ON CONFLICT(slug) DO NOTHING`, [attr.name, attr.slug]);
            const attrRecord = queryOne(`SELECT id FROM attributes WHERE slug = ?`, [attr.slug]);
            if (attrRecord) {
                let order = 1;
                for (const val of attr.values) {
                    run(`INSERT INTO attribute_values (attribute_id, value, display_order)
                         VALUES (?, ?, ?)
                         ON CONFLICT(attribute_id, value) DO NOTHING`, [attrRecord.id, val, order++]);
                }
            }
        }

        console.log('Seeding products & variations...');
        const milkCat = queryOne(`SELECT id FROM categories WHERE slug = 'milk-dairy'`);
        const beefCat = queryOne(`SELECT id FROM categories WHERE slug = 'beef'`);
        const gheeCat = queryOne(`SELECT id FROM categories WHERE slug = 'ghee'`);
        const vegCat = queryOne(`SELECT id FROM categories WHERE slug = 'green-vegetables'`);
        const poultryCat = queryOne(`SELECT id FROM categories WHERE slug = 'poultry'`);

        // Products definition matching the homepage mockup exactly
        const productsData = [
            {
                name: 'Fresh Cow Milk',
                slug: 'fresh-cow-milk',
                category_id: milkCat?.id,
                badge: 'Fresh',
                featured_image: '/images/products/fresh-milk-1ltr.png',
                short_description: 'Daily fresh, untreated natural whole cow milk directly from our Karnaphuli dairy farm.',
                description: 'Our cow milk is 100% pure, unadulterated, and hygienically bottled within 2 hours of milking. Free from chemical preservatives, antibiotics, or synthetic hormones. Boiled milk forms a rich golden layer of natural malai.',
                has_variations: 1,
                base_price: 180,
                base_sale_price: 150,
                base_stock: 85,
                is_featured: 1,
                order: 1,
                variations: [
                    { name: '500 ml', sku: 'MILK-500ML', regular_price: 180, sale_price: 150, stock: 35, image: '/images/products/fresh-milk-500ml.png' },
                    { name: '1 Ltr', sku: 'MILK-1LTR', regular_price: 300, sale_price: 250, stock: 50, image: '/images/products/fresh-milk-1ltr.png' }
                ]
            },
            {
                name: 'Beef',
                slug: 'fresh-beef',
                category_id: beefCat?.id,
                badge: 'Best Seller',
                featured_image: '/images/products/beef-1kg.png',
                short_description: 'Fresh farm-raised tender beef cuts with optimal fat-to-meat ratio.',
                description: 'Halal slaughtered daily from our healthy, organically fed cattle. Cleaned, bone-in or boneless tender cuts, packed strictly under sanitary conditions.',
                has_variations: 1,
                base_price: 350,
                base_sale_price: 280,
                base_stock: 65,
                is_featured: 1,
                order: 2,
                variations: [
                    { name: '500 gm', sku: 'BEEF-500GM', regular_price: 350, sale_price: 280, stock: 25, image: '/images/products/beef-500gm.png' },
                    { name: '1 Kg', sku: 'BEEF-1KG', regular_price: 650, sale_price: 550, stock: 40, image: '/images/products/beef-1kg.png' }
                ]
            },
            {
                name: 'Pure Ghee',
                slug: 'pure-desi-ghee',
                category_id: milkCat?.id,
                badge: 'Popular',
                featured_image: '/images/products/pure-ghee-500gm.png',
                short_description: 'Traditional bilona-churned desi cow ghee with rich golden aroma.',
                description: 'Prepared using traditional slow-cooking methods from cultured farm butter. Granular (Danedar) texture, golden hue, and unmatched natural aroma that elevates every traditional dish.',
                has_variations: 1,
                base_price: 500,
                base_sale_price: 420,
                base_stock: 50,
                is_featured: 1,
                order: 3,
                variations: [
                    { name: '250 gm', sku: 'GHEE-250GM', regular_price: 500, sale_price: 420, stock: 30, image: '/images/products/ghee-250gm.png' },
                    { name: '500 gm', sku: 'GHEE-500GM', regular_price: 900, sale_price: 750, stock: 20, image: '/images/products/pure-ghee-500gm.png' }
                ]
            },
            {
                name: 'Mixed Green Vegetables',
                slug: 'mixed-green-vegetables',
                category_id: vegCat?.id,
                badge: 'Fresh',
                featured_image: '/images/products/mixed-vegetables-1kg.png',
                short_description: 'Daily garden harvest of crisp leafy greens, tomatoes, and seasonal vegetables.',
                description: 'Grown using natural compost fertilizers without harmful chemical sprays. Harvested early morning to ensure maximum crunch, vitamins, and freshness.',
                has_variations: 0,
                base_price: 150,
                base_sale_price: 120,
                base_stock: 40,
                is_featured: 1,
                order: 4,
                variations: []
            },
            {
                name: 'Organic Spinach',
                slug: 'organic-spinach',
                category_id: vegCat?.id,
                badge: 'Fresh',
                featured_image: '/images/products/organic-spinach-500gm.png',
                short_description: 'Tender, nutrient-rich green spinach (পালং শাক) freshly plucked.',
                description: '100% natural, pesticide-free fresh farm spinach rich in iron, dietary fiber, and essential minerals.',
                has_variations: 0,
                base_price: 80,
                base_sale_price: 60,
                base_stock: 35,
                is_featured: 1,
                order: 5,
                variations: []
            },
            {
                name: 'Broiler Chicken',
                slug: 'broiler-chicken',
                category_id: poultryCat?.id,
                badge: 'New',
                featured_image: '/images/products/broiler-chicken-1kg.png',
                short_description: 'Fresh farm-dressed whole broiler chicken, hygienically cleaned.',
                description: 'Reared in spacious, ventilated sheds with vegetable feed. Processed following strict halal standards, skinless or skin-on according to your cooking preference.',
                has_variations: 0,
                base_price: 420,
                base_sale_price: 350,
                base_stock: 45,
                is_featured: 1,
                order: 6,
                variations: []
            },
            {
                name: 'Deshi Farm Chicken',
                slug: 'deshi-chicken',
                category_id: poultryCat?.id,
                badge: 'Popular',
                featured_image: '/images/categories/poultry.png',
                short_description: 'Free-range native country chicken (দেশি মুরগি) with authentic rich taste.',
                description: 'Naturally foraged country chicken with firm, flavorful meat prized in traditional Bangladeshi feasts.',
                has_variations: 0,
                base_price: 380,
                base_sale_price: 320,
                base_stock: 25,
                is_featured: 1,
                order: 7,
                variations: []
            },
            {
                name: 'Fresh Farm Eggs',
                slug: 'farm-fresh-eggs',
                category_id: poultryCat?.id,
                badge: 'Fresh',
                featured_image: '/images/categories/poultry.png',
                short_description: 'Brown farm eggs from healthy hens, packed with protein.',
                description: 'Collected fresh each morning from our happy layer flock. Bright orange yolks and strong shells, free of antibiotic residues.',
                has_variations: 1,
                base_price: 170,
                base_sale_price: 155,
                base_stock: 90,
                is_featured: 1,
                order: 8,
                variations: [
                    { name: '12 pcs (1 Dozen)', sku: 'EGGS-12PCS', regular_price: 170, sale_price: 155, stock: 60, image: '/images/categories/poultry.png' },
                    { name: '30 pcs (Tray)', sku: 'EGGS-30PCS', regular_price: 420, sale_price: 380, stock: 30, image: '/images/categories/poultry.png' }
                ]
            }
        ];

        for (const p of productsData) {
            run(`INSERT INTO products (
                category_id, name, slug, short_description, description, featured_image,
                badge_text, has_variations, base_price, base_sale_price, base_stock,
                is_featured, display_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
                category_id = excluded.category_id,
                name = excluded.name,
                short_description = excluded.short_description,
                description = excluded.description,
                featured_image = excluded.featured_image,
                badge_text = excluded.badge_text,
                has_variations = excluded.has_variations,
                base_price = excluded.base_price,
                base_sale_price = excluded.base_sale_price,
                base_stock = excluded.base_stock,
                is_featured = excluded.is_featured,
                display_order = excluded.display_order`,
                [
                    p.category_id, p.name, p.slug, p.short_description, p.description,
                    p.featured_image, p.badge, p.has_variations, p.base_price,
                    p.base_sale_price, p.base_stock, p.is_featured, p.order
                ]);

            const prod = queryOne(`SELECT id FROM products WHERE slug = ?`, [p.slug]);
            if (prod && p.variations.length > 0) {
                let vOrder = 1;
                for (const v of p.variations) {
                    run(`INSERT INTO product_variations (
                        product_id, variation_name, sku, regular_price, sale_price,
                        stock_quantity, image_url, display_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(sku) DO UPDATE SET
                        variation_name = excluded.variation_name,
                        regular_price = excluded.regular_price,
                        sale_price = excluded.sale_price,
                        stock_quantity = excluded.stock_quantity,
                        image_url = excluded.image_url,
                        display_order = excluded.display_order`,
                        [prod.id, v.name, v.sku, v.regular_price, v.sale_price, v.stock, v.image, vOrder++]);

                    const variationRecord = queryOne(`SELECT id FROM product_variations WHERE sku = ?`, [v.sku]);
                    // Record initial inventory movement
                    run(`INSERT INTO inventory_movements (product_id, variation_id, change_quantity, new_stock, reason, created_by)
                         VALUES (?, ?, ?, ?, 'Initial inventory stock seed', 'system')`,
                        [prod.id, variationRecord.id, v.stock, v.stock]);
                }
            } else if (prod) {
                // Record initial inventory movement for simple product
                run(`INSERT INTO inventory_movements (product_id, change_quantity, new_stock, reason, created_by)
                     VALUES (?, ?, ?, 'Initial inventory stock seed', 'system')`,
                    [prod.id, p.base_stock, p.base_stock]);
            }
        }

        console.log('Seeding payment methods with official business numbers...');
        const paymentMethods = [
            {
                code: 'cod',
                name: 'Cash on Delivery',
                number: config.BUSINESS.PHONE,
                type: 'Direct',
                instructions: 'Pay in cash directly to our delivery executive upon receiving and inspecting your fresh products.',
                order: 1,
                is_enabled: 1,
                logo_url: '/images/payments/cod.svg'
            },
            {
                code: 'bkash',
                name: 'bKash Send Money',
                number: config.BUSINESS.PHONE,
                type: 'Personal',
                instructions: 'Please Send Money (Personal) to 01970271398. Use your Phone Number as reference. Enter your bKash Transaction ID below after sending.',
                order: 2,
                is_enabled: 1,
                logo_url: '/images/payments/bkash.svg'
            },
            {
                code: 'nagad',
                name: 'Nagad Send Money',
                number: config.BUSINESS.PHONE,
                type: 'Personal',
                instructions: 'Please Send Money to 01970271398. Enter your Nagad Sender Mobile & Transaction ID below after completing the payment.',
                order: 3,
                is_enabled: 1,
                logo_url: '/images/payments/nagad.svg'
            },
            {
                code: 'rocket',
                name: 'Rocket Send Money',
                number: config.BUSINESS.PHONE,
                type: 'Personal',
                instructions: 'Please Send Money to 01970271398 (Personal). Enter your Rocket Transaction ID below.',
                order: 4,
                is_enabled: 1,
                logo_url: '/images/payments/rocket.svg'
            },
            {
                code: 'manual',
                name: 'Bank / Hand Transfer',
                number: config.BUSINESS.PHONE,
                type: 'Bank',
                instructions: 'For large bulk or corporate orders, contact us directly at 01970271398 to arrange direct bank transfer or farm pickup.',
                order: 5,
                is_enabled: 0,
                logo_url: null
            }
        ];

        for (const pm of paymentMethods) {
            run(`INSERT INTO payment_methods (code, name, account_number, account_type, instructions, display_order, is_enabled, logo_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(code) DO UPDATE SET
                    name = excluded.name,
                    account_number = excluded.account_number,
                    account_type = excluded.account_type,
                    instructions = excluded.instructions,
                    display_order = excluded.display_order,
                    is_enabled = excluded.is_enabled,
                    logo_url = COALESCE(excluded.logo_url, payment_methods.logo_url)`,
                [pm.code, pm.name, pm.number, pm.type, pm.instructions, pm.order, pm.is_enabled !== undefined ? pm.is_enabled : 1, pm.logo_url]);
        }

        console.log('Seeding delivery settings...');
        run(`INSERT INTO delivery_settings (id, default_charge, free_delivery_threshold, area_rules_json, instructions)
             VALUES (1, 60.0, 1500.0, '[]', 'Express same-day or next-day delivery in Chattogram city & Karnaphuli. Subsidized delivery available for all areas.')
             ON CONFLICT(id) DO UPDATE SET
                default_charge = excluded.default_charge,
                free_delivery_threshold = excluded.free_delivery_threshold,
                instructions = excluded.instructions`);

        console.log('Seeding homepage carousel slides...');
        const slides = [
            {
                title: 'Khaja Agro Farm',
                subtitle: 'Fresh • Healthy • Natural',
                promo: 'We bring you fresh and natural products from our farm to your home. Quality, purity and health is our promise.',
                button: 'Shop Now',
                link: '/shop',
                image: '/images/hero/hero_banner_clean.png',
                order: 1
            }
        ];

        for (const s of slides) {
            run(`INSERT INTO homepage_slides (title, subtitle, promo_text, button_text, link_url, image_url, display_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [s.title, s.subtitle, s.promo, s.button, s.link, s.image, s.order]);
        }

        console.log('Seeding social links...');
        const socials = [
            { platform: 'Facebook', url: 'https://www.facebook.com/khajaagrofarm', order: 1, is_enabled: 1 },
            { platform: 'YouTube', url: 'https://www.youtube.com/@khajaagrofarm', order: 2, is_enabled: 0 },
            { platform: 'Instagram', url: 'https://www.instagram.com/khajaagro02/', order: 3, is_enabled: 1 },
            { platform: 'WhatsApp', url: 'https://wa.me/8801970271398', order: 4, is_enabled: 1 }
        ];

        for (const soc of socials) {
            run(`INSERT INTO social_links (platform, url, display_order, is_enabled)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(platform) DO UPDATE SET
                    url = excluded.url,
                    display_order = excluded.display_order,
                    is_enabled = excluded.is_enabled`,
                [soc.platform, soc.url, soc.order, soc.is_enabled]);
        }

        console.log('Checking or provisioning administrator account...');
        const existingAdmin = queryOne(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
        if (!existingAdmin) {
            // Provision initial admin: phone 01970271398, email mdmudhfiq883@gmail.com
            const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'KhajaAgro@2026';
            const adminHash = hashPassword(adminPassword);
            run(`INSERT INTO users (full_name, phone, email, password_hash, role, status)
                 VALUES (?, ?, ?, ?, 'admin', 'active')`,
                ['MD Mushfiqur Rahman (Founder)', config.BUSINESS.PHONE, config.BUSINESS.EMAIL, adminHash]);
            console.log(`Administrator account provisioned: Phone: ${config.BUSINESS.PHONE}`);
        } else {
            console.log('Authorized administrator account already exists. Preserving credentials.');
        }

        // Seed a sample verified customer for testing
        const existingCustomer = queryOne(`SELECT id FROM users WHERE phone = '01700000001'`);
        if (!existingCustomer) {
            const custHash = hashPassword('Customer@1234');
            run(`INSERT INTO users (full_name, phone, email, password_hash, role, status)
                 VALUES (?, ?, ?, ?, 'customer', 'active')`,
                ['Karim Ullah', '01700000001', 'customer@example.com', custHash]);
        }
    });

    console.log('Khaja Agro Farm database seeding completed successfully!');
}

if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
