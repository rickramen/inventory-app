require('dotenv').config();
const express = require('express');
const app = express();
const pool = require('./db/pool'); 
const path = require('path');

// Routes
const pokemonRoutes = require('./routes/pokemon');
const typeRoutes = require('./routes/type');
const trainerRoutes = require('./routes/trainer');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route Mounting
app.use('/pokemon', pokemonRoutes);
app.use('/types', typeRoutes);
app.use('/trainers', trainerRoutes);

// Redirect root to /pokemon
app.get('/', (req, res) => res.redirect('/pokemon'));

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});