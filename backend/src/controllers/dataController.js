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

        res.status(200).json(data);
    });
}

module.exports = new DataController();
