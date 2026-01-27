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

        await db.exec(`
            CREATE TABLE IF NOT EXISTS measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temperature REAL,
                humidity REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        logger.info('SQLite database ready and table initialized.');
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
