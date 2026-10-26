// SQLite Database Connection using Node 24 native node:sqlite DatabaseSync
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config/config');

// Ensure data directory exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

function getDb() {
    if (!dbInstance) {
        dbInstance = new DatabaseSync(config.DB_PATH);
        // Optimize for concurrent web read performance and reliability
        dbInstance.exec('PRAGMA foreign_keys = ON;');
        dbInstance.exec('PRAGMA journal_mode = WAL;');
        dbInstance.exec('PRAGMA synchronous = NORMAL;');
        dbInstance.exec('PRAGMA busy_timeout = 5000;');
    }
    return dbInstance;
}

function initSchema() {
    const db = getDb();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(sql);
}

// Helper methods with parameterized prepared statements
function queryAll(sql, params = []) {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}

function queryOne(sql, params = []) {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.get(...params) || null;
}

function run(sql, params = []) {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.run(...params);
}

let inTransaction = false;

function transaction(fn) {
    const db = getDb();
    if (inTransaction) {
        return fn(db);
    }
    inTransaction = true;
    db.exec('BEGIN IMMEDIATE;');
    try {
        const result = fn(db);
        db.exec('COMMIT;');
        return result;
    } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
    } finally {
        inTransaction = false;
    }
}

module.exports = {
    getDb,
    initSchema,
    queryAll,
    queryOne,
    run,
    transaction
};
