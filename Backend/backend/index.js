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

// Probar conexión y sincronizar modelos con reintentos (útil en Render al levantar servicios)
const connectWithRetry = async (retries = 5, delayMs = 3000) => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			console.log(`Intentando conectar a la base de datos (intento ${attempt}/${retries})...`);
			await sequelize.authenticate();
			console.log('Conexión a la base de datos exitosa');
			await sequelize.sync({ alter: true });
			console.log('Modelos sincronizados con la base de datos');
			return;
		} catch (err) {
			console.error(`Error al conectar/sincronizar (intento ${attempt}):`, err.code || err.message || err);
			if (attempt < retries) {
				console.log(`Reintentando en ${delayMs}ms...`);
				await new Promise(r => setTimeout(r, delayMs));
			} else {
				console.error('No se pudo conectar a la base de datos después de varios intentos. Continuando sin DB.');
			}
		}
	}
};

connectWithRetry();

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
