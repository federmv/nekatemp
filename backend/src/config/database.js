const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const logger = require('../utils/logger');

let db;

async function connectDB() {
    if (db) return db;

    try {
        const dbPath = process.env.DB_PATH
            ? path.resolve(process.cwd(), process.env.DB_PATH)
            : path.join(__dirname, '../../database.sqlite');

        logger.info(`Connecting to database at ${dbPath}`);

        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Performance: WAL mode for concurrent reads + bigger cache
        await db.exec('PRAGMA journal_mode = WAL');
        await db.exec('PRAGMA synchronous = NORMAL');
        await db.exec('PRAGMA cache_size = -8000'); // 8MB cache
        await db.exec('PRAGMA mmap_size = 268435456'); // 256MB mmap

        await db.exec(`
            CREATE TABLE IF NOT EXISTS measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temp_water REAL,
                temp_ambient REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Index on timestamp for fast range queries
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_measurements_timestamp
            ON measurements(timestamp)
        `);

        logger.info('SQLite database ready with WAL mode and indexes.');
        return db;
    } catch (error) {
        logger.error('Failed to connect to database', error);
        throw error;
    }
}

async function getDB() {
    if (!db) await connectDB();
    return db;
}

module.exports = { connectDB, getDB };
