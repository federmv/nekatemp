const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const dataService = require('./src/services/dataService');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // 1. Connect to Database with Retries or simple wait
        await connectDB();

        // 2. Start Express Server
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`HTTP Server listening on http://0.0.0.0:${PORT}`);
        });

        // 3. Independent SSE Polling loop (Process Decoupling Strategy)
        // Since MQTT ingestion is now decoupled into mqtt_worker.js, we poll
        // the DB to detect new records in a low-cost manner and trigger SSE.
        setInterval(async () => {
            await dataService.pollLatestForSSE();
        }, 1500);

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
