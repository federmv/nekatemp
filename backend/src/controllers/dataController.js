const dataService = require('../services/dataService');
const { ValidationError } = require('../utils/errors');
const { asyncHandler } = require('../middleware/errorHandler');

class DataController {
    saveData = asyncHandler(async (req, res, next) => {
        const { temperature, humidity } = req.body;

        if (temperature === undefined) {
            throw new ValidationError('Temperature is required');
        }

        const numericTemp = parseFloat(temperature);
        if (isNaN(numericTemp)) {
            throw new ValidationError('Temperature must be a number');
        }

        await dataService.saveMeasurement(numericTemp, humidity);

        res.status(201).json({
            status: 'success',
            message: 'Data saved successfully'
        });
    });

    getData = asyncHandler(async (req, res, next) => {
        const { range } = req.query;
        const data = await dataService.getMeasurements(range);

        // Set cache headers for non-live data
        if (range && range !== 'live') {
            res.set('Cache-Control', 'public, max-age=30');
        }

        res.status(200).json(data);
    });

    // SSE endpoint for real-time data push
    streamData = (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable nginx buffering
        });

        // Send initial heartbeat
        res.write(':heartbeat\n\n');

        dataService.addSSEClient(res);

        // Keep alive every 30s
        const keepAlive = setInterval(() => {
            try {
                res.write(':ping\n\n');
            } catch (e) {
                clearInterval(keepAlive);
            }
        }, 30000);

        req.on('close', () => {
            clearInterval(keepAlive);
        });
    };

    // Stats endpoint
    getStats = asyncHandler(async (req, res, next) => {
        const { range } = req.query;
        const stats = await dataService.getStats(range);

        if (range && range !== 'live') {
            res.set('Cache-Control', 'public, max-age=30');
        }

        res.status(200).json(stats);
    });
}

module.exports = new DataController();
