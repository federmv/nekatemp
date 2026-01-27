const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');

router.post('/data', dataController.saveData);
router.get('/data', dataController.getData);

module.exports = router;
