const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const mqttService = require('./src/services/mqttService');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // 1. Connect to Database with Retries or simple wait
        await connectDB();

        // 2. Initialize MQTT Broker
        mqttService.initialize();

        // 3. Start Express Server
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`HTTP Server listening on http://0.0.0.0:${PORT}`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
