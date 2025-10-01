require('dotenv').config();
const { sequelize, User, Project } = require('./models');

const setupDatabase = async () => {
  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos exitosa');

    // Crear tablas (force: true borra y recrea las tablas)
    // Cambiar a { force: false } o eliminar para no borrar datos existentes
    await sequelize.sync({ force: true });
    console.log('✅ Tablas creadas exitosamente');

    // Crear usuario de prueba (opcional)
    const testUser = await User.create({
      nombre: 'Usuario de Prueba',
      email: 'test@example.com',
      password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.Ci3MpeHLwRPXwLm1LZ8U9.YfqPdEBe' // password: test123
    });
    console.log('✅ Usuario de prueba creado:', testUser.email);

    // Crear proyecto de prueba
    const testProject = await Project.create({
      nombre: 'Proyecto de Prueba',
      descripcion: 'Un proyecto de ejemplo para probar el sistema',
      contenido_diagrama: {
        nodes: [
          {
            id: '1',
            type: 'class',
            data: { label: 'Usuario', attributes: ['id', 'nombre', 'email'] },
            position: { x: 100, y: 100 }
          }
        ],
        edges: []
      },
      usuario_id: testUser.id
    });
    console.log('✅ Proyecto de prueba creado:', testProject.nombre);

    console.log('\n🎉 Base de datos configurada exitosamente!');
    console.log('📧 Email de prueba: test@example.com');
    console.log('🔑 Contraseña de prueba: test123');

  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar setup
setupDatabase();