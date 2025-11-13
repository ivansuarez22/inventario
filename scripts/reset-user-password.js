const User = require('../models/User');

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Uso: node scripts/reset-user-password.js <email> <nueva_contraseña>');
    process.exit(1);
  }

  try {
    // Buscar usuario por email (sin inicializar DBs para evitar permisos de admin)
    const user = await User.findByEmail(email);
    if (!user) {
      console.error(`Usuario no encontrado: ${email}`);
      process.exit(2);
    }

    // Restablecer contraseña
    await User.resetPassword(user._id, newPassword);
    console.log(`Contraseña actualizada para ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error al restablecer contraseña:', error && error.message || error);
    process.exit(3);
  }
}

main();