const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');

router.get('/', trainerController.list);
router.get('/:id', trainerController.detail);

module.exports = router;