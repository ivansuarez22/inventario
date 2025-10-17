const { productsDb } = require('../config/database');

class Product {
  static async getAll() {
    try {
      const result = await productsDb.view('products', 'all');
      return result.rows.map(row => row.value);
    } catch (error) {
      // Si la vista no existe, buscar manualmente
      const query = {
        selector: {
          type: 'product'
        }
      };
      
      const result = await productsDb.find(query);
      return result.docs;
    }
  }

  static async getById(id) {
    try {
      return await productsDb.get(id);
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      return null;
    }
  }

  static async create(productData) {
    const product = {
      type: 'product',
      id: productData.id,
      nombre: productData.nombre,
      precio: parseFloat(productData.precio),
      descripcion: productData.descripcion,
      foto: productData.foto || null,
      stock: parseInt(productData.stock, 10),
      createdAt: new Date().toISOString()
    };
    
    const result = await productsDb.insert(product);
    product._id = result.id;
    product._rev = result.rev;
    
    return product;
  }

  static async update(id, productData) {
    try {
      const product = await this.getById(id);
      
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      // Actualizar campos
      product.id = productData.id || product.id;
      product.nombre = productData.nombre || product.nombre;
      product.precio = productData.precio ? parseFloat(productData.precio) : product.precio;
      product.descripcion = productData.descripcion || product.descripcion;
      product.stock = productData.stock ? parseInt(productData.stock, 10) : product.stock;
      
      // Actualizar foto solo si se proporciona una nueva
      if (productData.foto) {
        product.foto = productData.foto;
      }
      
      product.updatedAt = new Date().toISOString();
      
      const result = await productsDb.insert(product);
      product._rev = result.rev;
      
      return product;
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const product = await this.getById(id);
      
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      
      await productsDb.destroy(id, product._rev);
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  }
}

module.exports = Product;