/**
 * Script de inicio para entorno de producción
 * Este script configura y arranca la aplicación en modo producción
 */

// Cargar variables de entorno
require('dotenv').config();

// Importar el módulo principal de la aplicación
const app = require('./app');

// Configurar el puerto para producción
const PORT = process.env.PORT || 3000;

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en modo producción en el puerto ${PORT}`);
  console.log(`La aplicación está disponible en http://localhost:${PORT}`);
});