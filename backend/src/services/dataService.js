const { getDB } = require('../config/database');
const logger = require('../utils/logger');
const { DatabaseError } = require('../utils/errors');

// In-memory latest value for instant SSE broadcast
let latestReading = null;
const sseClients = new Set();

class DataService {
    async saveMeasurement(temperature, humidity) {
        try {
            const db = await getDB();
            await db.run(
                'INSERT INTO measurements (temperature, humidity) VALUES (?, ?)',
                [temperature, humidity || 0]
            );

            latestReading = {
                temperature,
                humidity: humidity || 0,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            };

            // Broadcast to all SSE clients instantly
            this.broadcastSSE(latestReading);

            logger.info(`Measurement saved: T=${temperature}°C`);
            return latestReading;
        } catch (error) {
            logger.error('Error saving measurement:', error);
            throw new DatabaseError('Failed to save measurement');
        }
    }

    // SSE Management
    addSSEClient(res) {
        sseClients.add(res);
        // Send latest immediately so client doesn't start empty
        if (latestReading) {
            res.write(`data: ${JSON.stringify(latestReading)}\n\n`);
        }
        res.on('close', () => {
            sseClients.delete(res);
            logger.info(`SSE client disconnected. Active: ${sseClients.size}`);
        });
        logger.info(`SSE client connected. Active: ${sseClients.size}`);
    }

    broadcastSSE(data) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        for (const client of sseClients) {
            try {
                client.write(payload);
            } catch (e) {
                sseClients.delete(client);
            }
        }
    }

    async getMeasurements(range) {
        try {
            const db = await getDB();

            if (!range || range === 'live') {
                // Live: last 50 readings, no downsampling needed
                const data = await db.all(
                    'SELECT temperature, humidity, timestamp FROM measurements ORDER BY timestamp DESC LIMIT 50'
                );
                return data.reverse();
            }

            // Map range to SQL interval and downsampling bucket
            const config = {
                '1h': { interval: '-1 hour', bucket: null },       // ~120 points max, no downsampling
                '24h': { interval: '-24 hours', bucket: 5 },          // Avg every 5 minutes → ~288 points
                '7d': { interval: '-7 days', bucket: 30 },         // Avg every 30 min → ~336 points
                '15d': { interval: '-15 days', bucket: 60 }          // Avg every 60 min → ~360 points
            };

            const cfg = config[range];
            if (!cfg) {
                // Unknown range, fallback to last 50
                const data = await db.all(
                    'SELECT temperature, humidity, timestamp FROM measurements ORDER BY timestamp DESC LIMIT 50'
                );
                return data.reverse();
            }

            if (!cfg.bucket) {
                // No downsampling: return all points in range
                const data = await db.all(
                    `SELECT temperature, humidity, timestamp FROM measurements
                     WHERE timestamp >= datetime('now', '${cfg.interval}')
                     ORDER BY timestamp ASC`
                );
                return data;
            }

            // Downsampled query: group by time buckets
            const data = await db.all(
                `SELECT 
                    ROUND(AVG(temperature), 2) as temperature,
                    ROUND(AVG(humidity), 2) as humidity,
                    MIN(timestamp) as timestamp
                 FROM measurements
                 WHERE timestamp >= datetime('now', '${cfg.interval}')
                 GROUP BY strftime('%s', timestamp) / (${cfg.bucket} * 60)
                 ORDER BY timestamp ASC`
            );

            return data;
        } catch (error) {
            logger.error('Error fetching measurements:', error);
            throw new DatabaseError('Failed to fetch measurements');
        }
    }

    // Stats endpoint for derived values (peak, low, avg) computed on DB side
    async getStats(range) {
        try {
            const db = await getDB();
            let whereClause = '';

            const intervals = {
                '1h': '-1 hour',
                '24h': '-24 hours',
                '7d': '-7 days',
                '15d': '-15 days'
            };

            if (range && intervals[range]) {
                whereClause = `WHERE timestamp >= datetime('now', '${intervals[range]}')`;
            } else {
                // Live: stats from last 50 readings
                const stats = await db.get(
                    `SELECT 
                        ROUND(MAX(temperature), 2) as peak,
                        ROUND(MIN(temperature), 2) as low,
                        ROUND(AVG(temperature), 2) as avg,
                        COUNT(*) as count
                     FROM (SELECT temperature FROM measurements ORDER BY timestamp DESC LIMIT 50)`
                );
                return stats || { peak: 0, low: 0, avg: 0, count: 0 };
            }

            const stats = await db.get(
                `SELECT 
                    ROUND(MAX(temperature), 2) as peak,
                    ROUND(MIN(temperature), 2) as low,
                    ROUND(AVG(temperature), 2) as avg,
                    COUNT(*) as count
                 FROM measurements ${whereClause}`
            );

            return stats || { peak: 0, low: 0, avg: 0, count: 0 };
        } catch (error) {
            logger.error('Error fetching stats:', error);
            throw new DatabaseError('Failed to fetch stats');
        }
    }
}

module.exports = new DataService();
