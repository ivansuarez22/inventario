require('dotenv').config();
const { initDatabases } = require('./config/database');
const User = require('./models/User');

async function createUser() {
  try {
    // Inicializar bases de datos
    await initDatabases();
    
    // Datos del usuario
    const userData = {
      email: 'suaresivan53@gmail.com',
      password: '12345',
      name: 'Ivan Suarez'
    };
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      console.log('El usuario ya existe');
      process.exit(0);
    }
    
    // Crear usuario
    const user = await User.create(userData);
    console.log('Usuario creado exitosamente:', user);
    process.exit(0);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    process.exit(1);
  }
}

createUser();