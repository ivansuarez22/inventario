const nano = require('nano');

// Configuración de conexión a CouchDB
const url = process.env.COUCHDB_URL || 'http://localhost:5984';
const username = process.env.COUCHDB_USER || 'ivan';
const password = process.env.COUCHDB_PASSWORD || '1234';

// Crear conexión con autenticación
const couch = nano(`http://${username}:${password}@${url.replace('http://', '')}`);

// Bases de datos
const DB_NAME = process.env.COUCHDB_DB_NAME || 'proyect_2';
const DB_USERS = `${DB_NAME}_users`;
const DB_PRODUCTS = `${DB_NAME}_products`;

// Inicializar bases de datos
async function initDatabases() {
  try {
    // Verificar si las bases de datos existen, si no, crearlas
    const dbList = await couch.db.list();
    
    if (!dbList.includes(DB_USERS)) {
      await couch.db.create(DB_USERS);
      console.log(`Base de datos ${DB_USERS} creada`);
    }
    
    if (!dbList.includes(DB_PRODUCTS)) {
      await couch.db.create(DB_PRODUCTS);
      console.log(`Base de datos ${DB_PRODUCTS} creada`);
    }
    
    // Crear vistas para productos
    const productsDb = couch.use(DB_PRODUCTS);
    const designDoc = {
      _id: '_design/products',
      views: {
        all: {
          map: function(doc) {
            if (doc.type === 'product') {
              emit(doc._id, doc);
            }
          }.toString()
        },
        byName: {
          map: function(doc) {
            if (doc.type === 'product') {
              emit(doc.nombre, doc);
            }
          }.toString()
        }
      }
    };
    
    try {
      const existingDesignDoc = await productsDb.get('_design/products');
      designDoc._rev = existingDesignDoc._rev;
    } catch (err) {
      // El documento de diseño no existe, se creará uno nuevo
    }
    
    await productsDb.insert(designDoc);
    console.log('Vistas de productos configuradas');
    
  } catch (error) {
    console.error('Error al inicializar las bases de datos:', error);
  }
}

module.exports = {
  couch,
  usersDb: couch.use(DB_USERS),
  productsDb: couch.use(DB_PRODUCTS),
  initDatabases
};