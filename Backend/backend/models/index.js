const { Sequelize } = require('sequelize');

// Configuración de la conexión a la base de datos
let sequelize;

// Priorizar conexión interna en Render si está disponible
if (process.env.INTERNAL_DATABASE_URL) {
  sequelize = new Sequelize(process.env.INTERNAL_DATABASE_URL, {
    dialect: 'postgres',
    // Conexión interna no usa SSL
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (process.env.DATABASE_URL) {
  // Conexión externa (TLS requerido)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // En desarrollo local, usar variables individuales
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

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