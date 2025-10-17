const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar carpeta de uploads y usar ruta absoluta
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitizar nombre de archivo para evitar caracteres problemáticos
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});
 
 // Filtro para tipos de archivos permitidos
 const fileFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|png|gif/;
   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
   const mimetype = allowedTypes.test(file.mimetype);
   
   if (extname && mimetype) {
     return cb(null, true);
   } else {
     cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
   }
 };
 
 // Configuración de multer
 const upload = multer({
   storage,
   limits: { fileSize: 5000000 }, // 5MB
   fileFilter
 }).single('foto');

// Mostrar todos los productos
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.render('products/index', { 
      title: 'Productos',
      products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    req.flash('error_msg', 'Error al cargar productos');
    res.redirect('/');
  }
};

// Mostrar formulario para agregar producto
exports.getAddProduct = (req, res) => {
  res.render('products/add', { title: 'Registrar Producto' });
};

// Procesar agregar producto
exports.postAddProduct = (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        req.flash('error_msg', err.message);
        return res.redirect('/products/add');
      }
      
      const { id, nombre, precio, descripcion, stock } = req.body;
      
      // Validar campos
      if (!id || !nombre || !precio || !descripcion || !stock) {
        req.flash('error_msg', 'Por favor complete todos los campos');
        return res.redirect('/products/add');
      }
      
      // Verificar si ya existe un producto con el mismo ID
      const existingProducts = await Product.getAll();
      const productExists = existingProducts.some(p => p.id === id);
      
      if (productExists) {
        req.flash('error_msg', 'Ya existe un producto con ese ID');
        return res.redirect('/products/add');
      }
      
      // Crear producto
      const productData = {
        id,
        nombre,
        precio,
        descripcion,
        stock,
        foto: req.file ? `/uploads/${req.file.filename}` : null
      };
      
      await Product.create(productData);
      
      req.flash('success_msg', 'Producto registrado correctamente');
      res.redirect('/products');
    } catch (error) {
      console.error('Error al agregar producto:', error);
      req.flash('error_msg', 'Error al registrar producto');
      res.redirect('/products/add');
    }
  });
};

// Mostrar formulario para editar producto
exports.getEditProduct = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    
    if (!product) {
      req.flash('error_msg', 'Producto no encontrado');
      return res.redirect('/products');
    }
    
    res.render('products/edit', { 
      title: 'Actualizar Producto',
      product
    });
  } catch (error) {
    console.error('Error al obtener producto para editar:', error);
    req.flash('error_msg', 'Error al cargar producto');
    res.redirect('/products');
  }
};

// Procesar editar producto
exports.postEditProduct = (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        req.flash('error_msg', err.message);
        return res.redirect(`/products/edit/${req.params.id}`);
      }
      
      const { id, nombre, precio, descripcion, stock } = req.body;
      
      // Validar campos
      if (!id || !nombre || !precio || !descripcion || !stock) {
        req.flash('error_msg', 'Por favor complete todos los campos');
        return res.redirect(`/products/edit/${req.params.id}`);
      }
      
      // Obtener producto actual
      const currentProduct = await Product.getById(req.params.id);
      
      if (!currentProduct) {
        req.flash('error_msg', 'Producto no encontrado');
        return res.redirect('/products');
      }
      
      // Verificar si el ID ya está en uso por otro producto
      if (id !== currentProduct.id) {
        const existingProducts = await Product.getAll();
        const productExists = existingProducts.some(p => p.id === id && p._id !== req.params.id);
        
        if (productExists) {
          req.flash('error_msg', 'Ya existe otro producto con ese ID');
          return res.redirect(`/products/edit/${req.params.id}`);
        }
      }
      
      // Actualizar producto
      const productData = {
        id,
        nombre,
        precio,
        descripcion,
        stock
      };
      
      // Si se subió una nueva foto
      if (req.file) {
        // Eliminar foto anterior si existe
        if (currentProduct.foto && currentProduct.foto.startsWith('/uploads/')) {
          const oldImagePath = path.join(__dirname, '..', 'uploads', path.basename(currentProduct.foto));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }

        productData.foto = `/uploads/${req.file.filename}`;
      }
      
      await Product.update(req.params.id, productData);
      
      req.flash('success_msg', 'Producto actualizado correctamente');
      res.redirect('/products');
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      req.flash('error_msg', 'Error al actualizar producto');
      res.redirect(`/products/edit/${req.params.id}`);
    }
  });
};

// Eliminar producto
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    
    if (!product) {
      req.flash('error_msg', 'Producto no encontrado');
      return res.redirect('/products');
    }
    
    // Eliminar foto si existe
    if (product.foto && product.foto.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', 'uploads', path.basename(product.foto));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Product.delete(req.params.id);
    
    req.flash('success_msg', 'Producto eliminado correctamente');
    res.redirect('/products');
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    req.flash('error_msg', 'Error al eliminar producto');
    res.redirect('/products');
  }
};