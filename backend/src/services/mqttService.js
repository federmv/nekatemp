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
            if (packet.topic === 'casa/esp32/datos') {
                const msg = packet.payload.toString();
                logger.info(`[MQTT] Data received: ${msg}`);

                // ESP32 sends only number (e.g., "25.5")
                const temperature = parseFloat(msg);

                if (!isNaN(temperature)) {
                    try {
                        await dataService.saveMeasurement(temperature, 0);
                    } catch (error) {
                        // Logged in service
                    }
                }
            }
        });
    }
}

module.exports = new MqttService();
