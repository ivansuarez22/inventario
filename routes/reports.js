const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(isAuthenticated);

// Página índice de reportes
router.get('/', reportController.getReportsIndex);

// Rutas de reportes
router.get('/inventory', reportController.generateInventoryReport);
router.get('/sales-total.xlsx', reportController.generateSalesTotalXlsx);
router.get('/stock-total.xlsx', reportController.generateStockTotalXlsx);
router.get('/customer-total.xlsx', reportController.generateCustomerTotalXlsx);

module.exports = router;