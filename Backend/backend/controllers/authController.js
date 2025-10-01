const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authController = {
  // Registro de usuario
  register: async (req, res) => {
    try {
      const { nombre, email, password } = req.body;

      // Validar que se proporcionen todos los campos
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe con este email' });
      }

      // Hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Crear usuario
      const newUser = await User.create({
        nombre,
        email,
        password: hashedPassword
      });

      // Generar token JWT
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: newUser.id,
          nombre: newUser.nombre,
          email: newUser.email
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Login de usuario
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validar campos
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      // Buscar usuario
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener perfil del usuario
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.userId, {
        attributes: ['id', 'nombre', 'email', 'createdAt']
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({ user });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = authController;