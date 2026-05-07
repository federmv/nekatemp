const { createServer } = require('net');
const Aedes = require('aedes');
const logger = require('../utils/logger');
const dataService = require('./dataService');

class MqttService {
    constructor() {
        this.aedes = Aedes();
        this.server = createServer(this.aedes.handle);
        this.port = process.env.MQTT_PORT || 1883;
    }

    initialize() {
        this.server.listen(this.port, () => {
            logger.info(`MQTT Broker listening on port ${this.port}`);
        });

        this.setupEvents();
    }

    setupEvents() {
        // Client Connection
        this.aedes.on('client', (client) => {
            logger.info(`[MQTT] Client connected: ${client ? client.id : 'unknown'}`);
        });

        // Client Disconnection
        this.aedes.on('clientDisconnect', (client) => {
            logger.info(`[MQTT] Client disconnected: ${client ? client.id : 'unknown'}`);
        });

        // Publish Handler
        this.aedes.on('publish', async (packet, client) => {
            const topic = packet.topic;
            const payload = packet.payload.toString();

            if (topic === 'casa/esp32/datos') {
                logger.info(`[MQTT] Data: ${payload}`);

                try {
                    const data = JSON.parse(payload);
                    
                    // Prioritize t_agua/t_ambiente from ESP32 code
                    const waterVal = data.t_agua !== undefined ? data.t_agua : data.water;
                    const ambientVal = data.t_ambiente !== undefined ? data.t_ambiente : data.ambient;

                    if (waterVal !== undefined && ambientVal !== undefined) {
                        await dataService.saveMeasurement(
                            parseFloat(waterVal),
                            parseFloat(ambientVal)
                        );
                    } else {
                        logger.warn(`[MQTT] Missing temperature keys in JSON: ${payload}`);
                    }
                } catch (e) {
                    // Fallback for raw float if not JSON
                    const temperature = parseFloat(payload);
                    if (!isNaN(temperature)) {
                        await dataService.saveMeasurement(temperature, 0);
                    } else {
                        logger.error(`[MQTT] Failed to parse payload: ${payload}`);
                    }
                }
            } else if (topic === 'casa/esp32/status') {
                logger.info(`[MQTT] Device Status: ${payload}`);
            } else if (topic === 'casa/esp32/alerts') {
                logger.warn(`[MQTT] ALERT: ${payload}`);
            }
        });
    }
}

module.exports = new MqttService();
