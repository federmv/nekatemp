const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Define routes with absolute clarity
router.get('/data/stream', (req, res, next) => dataController.streamData(req, res, next));
router.get('/data/stats', (req, res, next) => dataController.getStats(req, res, next));
router.get('/data', (req, res, next) => dataController.getData(req, res, next));
router.post('/data', (req, res, next) => dataController.saveData(req, res, next));

module.exports = router;
