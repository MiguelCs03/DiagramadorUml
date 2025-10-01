const { Sequelize } = require('sequelize');

// Configuración de la conexión a la base de datos
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: console.log, // Para ver las queries SQL en desarrollo
});

// Importar modelos
const User = require('./User')(sequelize);
const Project = require('./Project')(sequelize);

// Definir relaciones
User.hasMany(Project, {
  foreignKey: 'usuario_id',
  as: 'projects'
});

Project.belongsTo(User, {
  foreignKey: 'usuario_id',
  as: 'user'
});

// Exportar modelos y conexión
module.exports = {
  sequelize,
  User,
  Project
};