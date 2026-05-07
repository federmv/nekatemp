const { getDB } = require('../config/database');
const logger = require('../utils/logger');
const { DatabaseError } = require('../utils/errors');

// In-memory latest value for instant SSE broadcast
let latestReading = null;
const sseClients = new Set();

class DataService {
    async saveMeasurement(temp_water, temp_ambient) {
        try {
            const db = await getDB();
            await db.run(
                'INSERT INTO measurements (temp_water, temp_ambient) VALUES (?, ?)',
                [temp_water, temp_ambient]
            );

            latestReading = {
                id: this.lastPolledId ? this.lastPolledId + 1 : 1, // Fallback if no polling yet
                temp_water,
                temp_ambient,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            };

            logger.info(`Measurement saved: Water=${temp_water}°C, Ambient=${temp_ambient}°C`);
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
            if (typeof res.flush === 'function') res.flush(); // Added flush for the initial send
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
                if (typeof client.flush === 'function') client.flush();
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
                    'SELECT temp_water, temp_ambient, timestamp FROM measurements ORDER BY timestamp DESC LIMIT 50'
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
                    'SELECT temp_water, temp_ambient, timestamp FROM measurements ORDER BY timestamp DESC LIMIT 50'
                );
                return data.reverse();
            }

            if (!cfg.bucket) {
                // No downsampling: return all points in range
                const data = await db.all(
                    `SELECT temp_water, temp_ambient, timestamp FROM measurements
                     WHERE timestamp >= datetime('now', '${cfg.interval}')
                     ORDER BY timestamp ASC`
                );
                return data;
            }

            // Downsampled query: group by time buckets
            const data = await db.all(
                `SELECT 
                    ROUND(AVG(temp_water), 2) as temp_water,
                    ROUND(AVG(temp_ambient), 2) as temp_ambient,
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
                        ROUND(MAX(temp_water), 2) as peak,
                        ROUND(MIN(temp_water), 2) as low,
                        ROUND(AVG(temp_water), 2) as avg,
                        COUNT(*) as count
                     FROM (SELECT temp_water FROM measurements ORDER BY timestamp DESC LIMIT 50)`
                );
                return stats || { peak: 0, low: 0, avg: 0, count: 0 };
            }

            const stats = await db.get(
                `SELECT 
                    ROUND(MAX(temp_water), 2) as peak,
                    ROUND(MIN(temp_water), 2) as low,
                    ROUND(AVG(temp_water), 2) as avg,
                    COUNT(*) as count
                 FROM measurements ${whereClause}`
            );

            return stats || { peak: 0, low: 0, avg: 0, count: 0 };
        } catch (error) {
            logger.error('Error fetching stats:', error);
            throw new DatabaseError('Failed to fetch stats');
        }
    }

    // 1. Retention Policy
    async cleanOldData(days = 30) {
        try {
            const db = await getDB();
            const result = await db.run(`DELETE FROM measurements WHERE timestamp < datetime('now', '-${days} days')`);
            logger.info(`Retention Policy: Cleaned measurements older than ${days} days.`);
            return result.changes;
        } catch (error) {
            logger.error('Error cleaning old data:', error);
        }
    }

    // 2. Process Decoupling: Web Server polls for new SSEs instead of direct pushing
    lastPolledId = 0;

    async pollLatestForSSE() {
        if (sseClients.size === 0) return; // Prevent DB load if no viewers

        try {
            const db = await getDB();
            const latest = await db.get('SELECT id, temp_water, temp_ambient, timestamp FROM measurements ORDER BY id DESC LIMIT 1');

            if (latest && latest.id > this.lastPolledId) {
                // Ignore the very first poll to prevent dumping historical data as "new" event
                if (this.lastPolledId !== 0) {
                    this.broadcastSSE({
                        temp_water: latest.temp_water,
                        temp_ambient: latest.temp_ambient,
                        timestamp: latest.timestamp
                    });
                }
                this.lastPolledId = latest.id;
                latestReading = latest; // Keep in sync for immediately connecting clients
            }
        } catch (e) {
            // fail silently on polling error
        }
    }
}

module.exports = new DataService();
