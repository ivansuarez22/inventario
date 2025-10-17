// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Por favor inicia sesión para acceder');
  res.redirect('/login');
};

module.exports = { isAuthenticated };