const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.post('/data', dataController.saveData);
router.get('/data', dataController.getData);
router.get('/data/stream', dataController.streamData);
router.get('/data/stats', dataController.getStats);

module.exports = router;
