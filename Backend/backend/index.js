require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Configuración de CORS para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-frontend-url.vercel.app', 'https://tu-dominio.com'] // Actualiza con tu URL de frontend
    : '*', // En desarrollo permite todos los orígenes
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Límite para diagramas grandes

// Importar modelos y base de datos
const { sequelize } = require('./models');

// Importar rutas
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Probar conexión y sincronizar modelos
sequelize.authenticate()
	.then(() => {
		console.log('Conexión a la base de datos exitosa');
		// Sincronizar modelos con la base de datos
		return sequelize.sync({ alter: true }); // alter: true actualiza las tablas sin borrar datos
	})
	.then(() => {
		console.log('Modelos sincronizados con la base de datos');
	})
	.catch(err => console.error('Error de conexión o sincronización:', err));

app.get('/', (req, res) => {
	res.json({
		message: 'Backend del Diagramador UML funcionando',
		status: 'OK',
		timestamp: new Date().toISOString(),
		version: '1.0.0'
	});
});

// Health check endpoint para Render
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'healthy',
		uptime: process.uptime(),
		timestamp: Date.now()
	});
});

// Manejo de errores global
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
