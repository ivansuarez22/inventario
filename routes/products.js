const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuthenticated } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(isAuthenticated);

// Rutas de productos
router.get('/', productController.getAllProducts);
router.get('/add', productController.getAddProduct);
router.post('/add', productController.postAddProduct);
router.get('/edit/:id', productController.getEditProduct);
router.post('/edit/:id', productController.postEditProduct);
router.get('/delete/:id', productController.deleteProduct);

module.exports = router;