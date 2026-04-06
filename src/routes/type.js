const express = require('express');
const router = express.Router();
const typeController = require('../controllers/typeController');

router.get('/', typeController.list);       
router.get('/:id', typeController.detail); 

module.exports = router;