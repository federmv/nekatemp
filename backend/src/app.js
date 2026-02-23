const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security and utility middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// API Routes — MUST be before static files
app.use('/api', apiRoutes);

// Serve Static Frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendPath)) {
    // Serve static assets
    app.use(express.static(frontendPath));

    // SPA fallback
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.path.startsWith('/api')) return next();
        if (path.extname(req.path)) return next();

        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    logger.warn(`Frontend build not found at ${frontendPath}. API only mode.`);
    app.get('/', (req, res) => {
        res.send('Backend is running. API available at /api');
    });
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;
