const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// More specific routes FIRST
router.get('/data/stream', dataController.streamData);
router.get('/data/stats', dataController.getStats);

// General data routes
router.get('/data', dataController.getData);
router.post('/data', dataController.saveData);

module.exports = router;

