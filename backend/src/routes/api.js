const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

// Define routes with absolute clarity and no overlap
router.get('/data/stream', (req, res, next) => {
    console.log('HIT: /api/data/stream');
    return dataController.streamData(req, res, next);
});

router.get('/data/stats', (req, res, next) => {
    console.log('HIT: /api/data/stats');
    return dataController.getStats(req, res, next);
});

router.get('/data', (req, res, next) => {
    console.log('HIT: /api/data');
    return dataController.getData(req, res, next);
});

router.post('/data', (req, res, next) => {
    return dataController.saveData(req, res, next);
});

module.exports = router;
