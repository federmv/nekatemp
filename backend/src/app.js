const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security and utility middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable CSP for now if it interferes with inline scripts/React dev
}));
app.use(cors());
app.use(compression());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api', apiRoutes);

const fs = require('fs');

// Serve Static Frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));

    // Fallback for SPA
    // Fallback for SPA (Express 5 regex for "match all")
    app.get(/^(.*)$/, (req, res) => {
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
