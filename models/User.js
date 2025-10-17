const { usersDb } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    try {
      const result = await usersDb.view('users', 'byEmail', { key: email });
      return result.rows.length > 0 ? result.rows[0].value : null;
    } catch (error) {
      // Si la vista no existe, buscar manualmente
      const query = {
        selector: {
          email: email,
          type: 'user'
        }
      };
      
      const result = await usersDb.find(query);
      return result.docs.length > 0 ? result.docs[0] : null;
    }
  }

  static async create(userData) {
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user = {
      type: 'user',
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      createdAt: new Date().toISOString()
    };
    
    const result = await usersDb.insert(user);
    user._id = result.id;
    user._rev = result.rev;
    
    return user;
  }

  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    
    if (!user) {
      return null;
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  static async updateResetToken(userId, token, expires) {
    try {
      const user = await usersDb.get(userId);
      user.resetToken = token;
      user.resetTokenExpires = expires;
      
      const result = await usersDb.insert(user);
      user._rev = result.rev;
      
      return user;
    } catch (error) {
      console.error('Error al actualizar token de restablecimiento:', error);
      throw error;
    }
  }

  static async findByResetToken(token) {
    try {
      const query = {
        selector: {
          resetToken: token,
          resetTokenExpires: { $gt: new Date().toISOString() },
          type: 'user'
        }
      };
      
      const result = await usersDb.find(query);
      return result.docs.length > 0 ? result.docs[0] : null;
    } catch (error) {
      console.error('Error al buscar por token de restablecimiento:', error);
      throw error;
    }
  }

  static async resetPassword(userId, newPassword) {
    try {
      const user = await usersDb.get(userId);
      
      // Encriptar nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpires = null;
      
      const result = await usersDb.insert(user);
      user._rev = result.rev;
      
      return user;
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  }
}

module.exports = User;