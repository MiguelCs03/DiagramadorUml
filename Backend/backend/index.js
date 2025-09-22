require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Ejemplo de configuración de Sequelize (puedes cambiar por otro ORM si lo prefieres)
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
	host: process.env.DB_HOST || 'localhost',
	dialect: 'postgres', // Usando PostgreSQL
});

// Probar conexión ORM
sequelize.authenticate()
	.then(() => console.log('Conexión a la base de datos exitosa'))
	.catch(err => console.error('Error de conexión:', err));

app.get('/', (req, res) => {
	res.send('Backend funcionando');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
