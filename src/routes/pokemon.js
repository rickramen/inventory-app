const express = require('express');
const router = express.Router();
const pokemonController = require('../controllers/pokemonController');


// CREATE
router.get('/new', pokemonController.createGet);
router.post('/new', pokemonController.createPost);

// UPDATE
router.get('/:id/edit', pokemonController.updateGet);
router.post('/:id/edit', pokemonController.updatePost);

// DELETE
router.post('/:id/delete', pokemonController.deletePost);

// READ
router.get('/', pokemonController.list);
router.get('/:id', pokemonController.detail);

module.exports = router;