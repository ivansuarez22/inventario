const { salesDb, productsDb } = require('../config/database');

class Sale {
  static async create({ customerName, customerId, items }) {
    // Calcular totales
    const processedItems = [];
    let total = 0;

    for (const item of items) {
      // Obtener producto para validar precio/nombre actual
      const product = await productsDb.get(item._id);
      const quantity = parseInt(item.quantity, 10);
      const price = parseFloat(product.precio);
      const subtotal = price * quantity;
      total += subtotal;

      processedItems.push({
        productId: product._id,
        id: product.id,
        nombre: product.nombre,
        precio: price,
        cantidad: quantity,
        subtotal
      });

      // Decrementar stock
      product.stock = parseInt(product.stock, 10) - quantity;
      if (product.stock < 0) {
        throw new Error(`Stock insuficiente para producto ${product.nombre}`);
      }
      const updateRes = await productsDb.insert(product);
      product._rev = updateRes.rev;
    }

    const sale = {
      type: 'sale',
      customerName,
      customerId,
      items: processedItems,
      total,
      createdAt: new Date().toISOString()
    };

    const result = await salesDb.insert(sale);
    sale._id = result.id;
    sale._rev = result.rev;
    return sale;
  }

  static async getAll() {
    const query = { selector: { type: 'sale' } };
    const result = await salesDb.find(query);
    return result.docs;
  }

  static async getTotalSales() {
    const sales = await this.getAll();
    return sales.reduce((sum, s) => sum + (s.total || 0), 0);
  }

  static async getSalesByCustomer({ customerId, customerName }) {
    const selector = { type: 'sale' };
    if (customerId) selector.customerId = customerId;
    if (customerName) selector.customerName = customerName;
    const result = await salesDb.find({ selector });
    return result.docs;
  }
}

module.exports = Sale;