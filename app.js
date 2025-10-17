require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const path = require('path');

// Importar configuración de base de datos
const { initDatabases } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const reportRoutes = require('./routes/reports');

// Inicializar la aplicación
const app = express();

// Configurar middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: 'tienda-couchdb-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Configurar motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para variables globales
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Rutas
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/reports', reportRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.render('index', { title: 'Inicio - Sistema de Gestión de Productos' });
});

// Health check para Render
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Inicializar bases de datos y luego iniciar el servidor
initDatabases().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al inicializar las bases de datos:', err);
});