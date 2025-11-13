const Sale = require('../models/Sale');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');

exports.getNewSale = async (req, res) => {
  try {
    const products = await Product.getAll();
    const selectedProductId = req.query.product || null;
    res.render('sales/new', { title: 'Registrar Venta', products, selectedProductId });
  } catch (err) {
    console.error('Error al cargar productos para venta:', err);
    req.flash('error_msg', 'No se pudieron cargar los productos');
    res.redirect('/products');
  }
};

exports.postCreateSale = async (req, res) => {
  try {
    const { customerName, customerId } = req.body;
    // items enviados como [{_id, quantity}] desde el formulario
    let itemsRaw = req.body.items;
    let items = itemsRaw;
    if (typeof itemsRaw === 'string') {
      try {
        items = itemsRaw && itemsRaw.trim().length > 0 ? JSON.parse(itemsRaw) : null;
      } catch (parseErr) {
        items = null;
      }
    }

    // Fallback: reconstruir desde nombres de campos si el JSON oculto no llegó
    if (!Array.isArray(items) || items.length === 0) {
      const products = await Product.getAll();
      const rebuilt = [];
      for (const p of products) {
        const sel = req.body[`sel-${p._id}`]; // 'on' si checkbox está marcado
        const qtyStr = req.body[`qty-${p._id}`];
        let qty = qtyStr ? parseInt(qtyStr, 10) : 0;
        if (Number.isNaN(qty)) qty = 0;

        if (qty > 0) {
          rebuilt.push({ _id: p._id, quantity: qty });
        } else if (sel) {
          // Si viene el checkbox marcado pero sin cantidad válida, tomar 1 por defecto
          rebuilt.push({ _id: p._id, quantity: 1 });
        }
      }
      items = rebuilt;
    }

    if (!Array.isArray(items) || items.length === 0) {
      req.flash('error_msg', 'Debes seleccionar al menos un producto');
      return res.redirect('/sales/new');
    }

    const sale = await Sale.create({ customerName, customerId, items });

    // Generar factura PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura_${sale._id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Factura de Venta', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Fecha: ${new Date().toLocaleString()}`);
    doc.text(`Cliente: ${sale.customerName || ''}`);
    doc.text(`ID Cliente: ${sale.customerId || ''}`);
    doc.moveDown();

    doc.fontSize(14).text('Detalle de Productos', { underline: true });
    doc.moveDown();

    sale.items.forEach((item, idx) => {
      doc.text(`${idx + 1}. ${item.nombre} (x${item.cantidad}) - $${item.precio.toFixed(2)} c/u - Subtotal: $${item.subtotal.toFixed(2)}`);
    });

    doc.moveDown();
    doc.fontSize(16).text(`Total: $${sale.total.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error('Error al registrar la venta:', err);
    req.flash('error_msg', err.message || 'Error al registrar la venta');
    res.redirect('/sales/new');
  }
};