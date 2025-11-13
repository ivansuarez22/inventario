const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/new', salesController.getNewSale);
router.post('/', salesController.postCreateSale);

module.exports = router;