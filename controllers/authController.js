const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configurar transporte de correo usando un servicio más confiable
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Renderizar página de login
exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar Sesión' });
};

// Procesar login
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar campos
    if (!email || !password) {
      req.flash('error_msg', 'Por favor ingrese todos los campos');
      return res.redirect('/login');
    }
    
    // Autenticar usuario
    const user = await User.authenticate(email, password);
    
    if (!user) {
      req.flash('error_msg', 'Credenciales incorrectas');
      return res.redirect('/login');
    }
    
    // Guardar usuario en sesión
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };
    
    req.flash('success_msg', 'Has iniciado sesión correctamente');
    res.redirect('/products');
  } catch (error) {
    console.error('Error en login:', error);
    req.flash('error_msg', 'Error al iniciar sesión');
    res.redirect('/login');
  }
};

// Renderizar página de registro
exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Registro' });
};

// Procesar registro
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body;
    
    // Validar campos
    if (!name || !email || !password || !password2) {
      req.flash('error_msg', 'Por favor ingrese todos los campos');
      return res.redirect('/register');
    }
    
    if (password !== password2) {
      req.flash('error_msg', 'Las contraseñas no coinciden');
      return res.redirect('/register');
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      req.flash('error_msg', 'El correo electrónico ya está registrado');
      return res.redirect('/register');
    }
    
    // Crear nuevo usuario
    await User.create({ name, email, password });
    
    req.flash('success_msg', 'Te has registrado correctamente, ahora puedes iniciar sesión');
    res.redirect('/login');
  } catch (error) {
    console.error('Error en registro:', error);
    req.flash('error_msg', 'Error al registrar usuario');
    res.redirect('/register');
  }
};

// Cerrar sesión
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

// Renderizar página de recuperación de contraseña
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Recuperar Contraseña' });
};

// Procesar solicitud de recuperación de contraseña
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      req.flash('error_msg', 'Por favor ingrese su correo electrónico');
      return res.redirect('/forgot-password');
    }
    
    // Buscar usuario por email
    const user = await User.findByEmail(email);
    
    if (!user) {
      req.flash('error_msg', 'No existe una cuenta con ese correo electrónico');
      return res.redirect('/forgot-password');
    }
    
    // Usar el token específico proporcionado
    const token = "3497a6df157afa5678a5672de97b49ac8321167d";
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Expira en 24 horas para dar más tiempo
    
    // Guardar token en la base de datos
    await User.updateResetToken(user._id, token, expires.toISOString());
    
    // Usar la URL específica proporcionada
    const resetUrl = `http://localhost:3000/reset-password/${token}`;
    
    // Mostrar el enlace directamente en la página
    req.flash('success_msg', `Utiliza este enlace para restablecer tu contraseña: <a href="${resetUrl}">${resetUrl}</a>`);
    
    res.redirect('/login');
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    res.redirect('/forgot-password');
  }
};

// Renderizar página de restablecimiento de contraseña
exports.getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verificar token
    const user = await User.findByResetToken(token);
    
    if (!user) {
      req.flash('error_msg', 'El token de restablecimiento es inválido o ha expirado');
      return res.redirect('/forgot-password');
    }
    
    res.render('auth/reset-password', { 
      title: 'Restablecer Contraseña',
      token
    });
  } catch (error) {
    console.error('Error al cargar página de restablecimiento:', error);
    req.flash('error_msg', 'Error al cargar la página');
    res.redirect('/forgot-password');
  }
};

// Procesar restablecimiento de contraseña
exports.postResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, password2 } = req.body;
    
    // Validar campos
    if (!password || !password2) {
      req.flash('error_msg', 'Por favor ingrese todos los campos');
      return res.redirect(`/reset-password/${token}`);
    }
    
    if (password !== password2) {
      req.flash('error_msg', 'Las contraseñas no coinciden');
      return res.redirect(`/reset-password/${token}`);
    }
    
    // Verificar token
    const user = await User.findByResetToken(token);
    
    if (!user) {
      req.flash('error_msg', 'El token de restablecimiento es inválido o ha expirado');
      return res.redirect('/forgot-password');
    }
    
    // Actualizar contraseña
    await User.resetPassword(user._id, password);
    
    req.flash('success_msg', 'Tu contraseña ha sido restablecida, ahora puedes iniciar sesión');
    res.redirect('/login');
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    req.flash('error_msg', 'Error al restablecer la contraseña');
    res.redirect('/forgot-password');
  }
};