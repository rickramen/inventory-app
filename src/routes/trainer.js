const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');

// CREATE
router.get('/new', trainerController.createGet);
router.post('/new', trainerController.createPost);

// UPDATE
router.get('/:id/edit', trainerController.updateGet);
router.post('/:id/edit', trainerController.updatePost);

// DELETE
router.post('/:id/delete', trainerController.deletePost);

// READ
router.get('/', trainerController.list);
router.get('/:id', trainerController.detail);

module.exports = router;