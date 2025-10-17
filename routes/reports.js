const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(isAuthenticated);

// Rutas de reportes
router.get('/inventory', reportController.generateInventoryReport);

module.exports = router;