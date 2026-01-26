const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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
})();

// Endpoint para que el ESP32 envíe datos
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
