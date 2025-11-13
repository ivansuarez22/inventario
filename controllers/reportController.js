const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const ExcelJS = require('exceljs');
const Sale = require('../models/Sale');

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

// Reporte XLSX: 1) Valor total de ventas realizadas
exports.generateSalesTotalXlsx = async (req, res) => {
  try {
    const sales = await Sale.getAll();
    const total = sales.reduce((sum, s) => sum + (s.total || 0), 0);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ventas');
    ws.columns = [
      { header: 'ID Venta', key: 'id', width: 20 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    sales.forEach(s => ws.addRow({ id: s._id, cliente: s.customerName || s.customerId || '', total: s.total || 0 }));
    ws.addRow({});
    ws.addRow({ id: 'TOTAL', total });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ventas_total.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error al generar XLSX de ventas:', err);
    req.flash('error_msg', 'Error al generar reporte de ventas');
    res.redirect('/products');
  }
};

// Reporte XLSX: 2) Total de productos en stock
exports.generateStockTotalXlsx = async (req, res) => {
  try {
    const products = await Product.getAll();
    const totalStock = products.reduce((sum, p) => sum + (parseInt(p.stock, 10) || 0), 0);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stock');
    ws.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Stock', key: 'stock', width: 10 }
    ];
    products.forEach(p => ws.addRow({ id: p.id, nombre: p.nombre, stock: p.stock }));
    ws.addRow({});
    ws.addRow({ id: 'TOTAL', stock: totalStock });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=stock_total.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error al generar XLSX de stock:', err);
    req.flash('error_msg', 'Error al generar reporte de stock');
    res.redirect('/products');
  }
};

// Reporte XLSX: 3) Total de compras por un solo cliente (buscar por nombre o ID)
exports.generateCustomerTotalXlsx = async (req, res) => {
  try {
    const { query } = req.query; // puede ser nombre o ID
    if (!query) {
      req.flash('error_msg', 'Debe especificar nombre o ID de cliente');
      return res.redirect('/products');
    }
    // Buscar por ID exacto o nombre exacto (simple)
    const salesByCustomer = await Sale.getSalesByCustomer({ customerId: query, customerName: query });
    const totalCustomer = salesByCustomer.reduce((sum, s) => sum + (s.total || 0), 0);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('ComprasCliente');
    ws.columns = [
      { header: 'ID Venta', key: 'id', width: 20 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    salesByCustomer.forEach(s => ws.addRow({ id: s._id, cliente: s.customerName || s.customerId || '', total: s.total || 0 }));
    ws.addRow({});
    ws.addRow({ id: 'TOTAL CLIENTE', total: totalCustomer });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=compras_${query}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error al generar XLSX por cliente:', err);
    req.flash('error_msg', 'Error al generar reporte por cliente');
    res.redirect('/products');
  }
};

exports.getReportsIndex = (req, res) => {
  res.render('reports/index', { title: 'Reportes (XLSX)' });
};