const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Generar reporte de inventario en PDF
exports.generateInventoryReport = async (req, res) => {
  try {
    // Obtener todos los productos
    const products = await Product.getAll();
    
    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar respuesta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario.pdf');
    
    // Pipe PDF a la respuesta
    doc.pipe(res);
    
    // Título del reporte
    doc.fontSize(25).text('Reporte de Inventario', { align: 'center' });
    doc.moveDown();
    
    // Fecha y usuario que genera el reporte
    doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'right' });
    const generatedBy = (req.session && req.session.user && req.session.user.name) ? req.session.user.name : 'Usuario';
    doc.fontSize(12).text(`Generado por: ${generatedBy}`);
    doc.moveDown(2);
    
    // Encabezado de tabla
    doc.fontSize(14).text('Inventario de Productos', { underline: true });
    doc.moveDown();
    
    // Si no hay productos
    if (products.length === 0) {
      doc.fontSize(12).text('No hay productos registrados en el inventario.');
      doc.end();
      return;
    }
    
    // Procesar cada producto
    let y = doc.y;
    const productPromises = products.map(async (product, index) => {
      // Agregar nueva página si es necesario
      if (y > 650) {
        doc.addPage();
        y = 50;
      }
      
      // Información del producto
      doc.fontSize(14).text(`Producto #${index + 1}: ${product.nombre}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`ID: ${product.id}`);
      doc.fontSize(12).text(`Precio: $${product.precio.toFixed(2)}`);
      doc.fontSize(12).text(`Stock: ${product.stock} unidades`);
      doc.fontSize(12).text(`Descripción: ${product.descripcion}`);
      
      // Agregar imagen si existe
      if (product.foto) {
        try {
          // Determinar si la imagen es local o remota
          if (product.foto.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', product.foto);
            if (fs.existsSync(imagePath)) {
              doc.moveDown();
              doc.image(imagePath, { width: 200 });
              doc.moveDown();
            }
          } else if (product.foto.startsWith('http')) {
            // Para imágenes remotas, descargarlas primero
            const tempImagePath = path.join(__dirname, '..', 'uploads', `temp_${Date.now()}.jpg`);
            await downloadImage(product.foto, tempImagePath);
            
            doc.moveDown();
            doc.image(tempImagePath, { width: 200 });
            doc.moveDown();
            
            // Eliminar archivo temporal
            if (fs.existsSync(tempImagePath)) {
              fs.unlinkSync(tempImagePath);
            }
          }
        } catch (error) {
          console.error('Error al procesar imagen:', error);
          doc.text('Error al cargar la imagen del producto');
        }
      }
      
      doc.moveDown(2);
      y = doc.y;
    });
    
    // Esperar a que se procesen todas las imágenes
    await Promise.all(productPromises);
    
    // Agregar pie de página
    doc.fontSize(10).text('© Tienda CouchDB - Todos los derechos reservados', { align: 'center' });
    
    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    req.flash('error_msg', 'Error al generar reporte de inventario');
    res.redirect('/products');
  }
};

// Función para descargar imagen desde URL
function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destination);
    
    protocol.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
}