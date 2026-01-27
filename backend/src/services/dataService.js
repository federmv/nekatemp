const { getDB } = require('../config/database');
const logger = require('../utils/logger');
const { DatabaseError } = require('../utils/errors');

class DataService {
    async saveMeasurement(temperature, humidity) {
        try {
            const db = await getDB();
            await db.run(
                'INSERT INTO measurements (temperature, humidity) VALUES (?, ?)',
                [temperature, humidity || 0]
            );
            logger.info(`Measurement saved: T=${temperature}°C, H=${humidity || 0}%`);
            return { temperature, humidity: humidity || 0 };
        } catch (error) {
            logger.error('Error saving measurement:', error);
            throw new DatabaseError('Failed to save measurement');
        }
    }

    async getMeasurements(range) {
        try {
            const db = await getDB();
            let query = 'SELECT * FROM measurements';
            // Params array is not strictly used in current string concat logic but good for future prepared statements if logic changes

            if (range === '1h') {
                query += " WHERE timestamp >= datetime('now', '-1 hour')";
            } else if (range === '12h') {
                query += " WHERE timestamp >= datetime('now', '-12 hours')";
            } else if (range === '24h') {
                query += " WHERE timestamp >= datetime('now', '-24 hours')";
            } else if (range === '7d') {
                query += " WHERE timestamp >= datetime('now', '-7 days')";
            } else if (range === '15d') {
                query += " WHERE timestamp >= datetime('now', '-15 days')";
            } else {
                // Default (Live): Last 50 measurements
                query += ' ORDER BY timestamp DESC LIMIT 50';
                const data = await db.all(query);
                // Return reversed to show correctly in charts (oldest to newest) if needed, 
                // but usually charts want time order. 
                // If we limit 50 desc, we get newest 50. Responding with them might need sorting.
                return data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }

            query += ' ORDER BY timestamp ASC';
            const data = await db.all(query);
            return data;
        } catch (error) {
            logger.error('Error fetching measurements:', error);
            throw new DatabaseError('Failed to fetch measurements');
        }
    }
}

module.exports = new DataService();
