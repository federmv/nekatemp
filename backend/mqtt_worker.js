const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB } = require('./src/config/database');
const mqttService = require('./src/services/mqttService');
const dataService = require('./src/services/dataService');
const logger = require('./src/utils/logger');

async function startWorker() {
    try {
        logger.info('Starting MQTT Database Worker...');
        await connectDB();

        // Start MQTT Listener
        mqttService.initialize();

        // 1. Data Retention Policy Routine: Runs every 24 hours to delete old data
        //    Configured for 30 days retention. Adjust here if needed.
        setInterval(async () => {
            logger.info('Running DB cleanup routine...');
            await dataService.cleanOldData(30);
        }, 24 * 60 * 60 * 1000);

        // Run an initial clean on startup
        await dataService.cleanOldData(30);

    } catch (error) {
        logger.error('Worker failed to start:', error);
        process.exit(1);
    }
}

startWorker();
