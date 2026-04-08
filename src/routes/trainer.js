const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');

// CREATE
router.get('/new', trainerController.createGet);
router.post('/new', trainerController.createPost);

// READ
router.get('/', trainerController.list);
router.get('/:id', trainerController.detail);

module.exports = router;