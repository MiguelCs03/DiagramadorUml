require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

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
	res.send('Backend del Diagramador UML funcionando');
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
