const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const Aedes = require('aedes');
const { createServer } = require('net');

const app = express();
const PORT = process.env.PORT || 3001;
const MQTT_PORT = 1883; // Puerto estándar MQTT

// Configuración del Broker MQTT
const aedes = Aedes();
const mqttServer = createServer(aedes.handle);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Base de datos
let db;

(async () => {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
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
    console.log('Base de datos SQLite lista.');

    // Iniciar Broker MQTT
    mqttServer.listen(MQTT_PORT, function () {
        console.log('Broker MQTT escuchando en el puerto', MQTT_PORT);
    });

    // Escuchar mensajes publicados
    aedes.on('publish', async function (packet, client) {
        if (packet.topic === 'casa/esp32/datos') {
            const msg = packet.payload.toString();
            console.log(`[MQTT] Dato recibido: ${msg}`);

            // El ESP32 envía solo el número (ej: "25.5")
            const temperature = parseFloat(msg);

            if (!isNaN(temperature)) {
                try {
                    await db.run(
                        'INSERT INTO measurements (temperature, humidity) VALUES (?, ?)',
                        [temperature, 0] // Asumimos humedad 0 ya que el código actual solo envía temp
                    );
                    console.log(`[DB] Temperatura guardada: ${temperature}°C`);
                } catch (error) {
                    console.error('[DB] Error al guardar:', error.message);
                }
            }
        }
    });

    // Eventos de conexión
    aedes.on('client', function (client) {
        console.log(`[MQTT] Nuevo cliente conectado: ${client ? client.id : client}`);
    });
})();

// Endpoint para que el ESP32 envíe datos (Soporte Legacy HTTP)
app.post('/api/data', async (req, res) => {
    const { temperature, humidity } = req.body;

    if (temperature === undefined) {
        return res.status(400).json({ error: 'Temperatura requerida' });
    }

    try {
        await db.run(
            'INSERT INTO measurements (temperature, humidity) VALUES (?, ?)',
            [temperature, humidity || 0]
        );
        console.log(`Dato recibido: T=${temperature}°C, H=${humidity || 0}%`);
        res.status(201).json({ message: 'Datos guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar en la BD' });
    }
});

// Endpoint para que la web consulte los datos
app.get('/api/data', async (req, res) => {
    try {
        const data = await db.all('SELECT * FROM measurements ORDER BY timestamp DESC LIMIT 50');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

// Servir los archivos estáticos del Frontend (React build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Cualquier otra ruta devuelve el index.html (para que React Router funcione, si se usara)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
