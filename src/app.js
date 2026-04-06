require('dotenv').config();
const express = require('express');
const app = express();
const pool = require('./db/pool'); 
const path = require('path');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const pokemonRoutes = require('./routes/pokemon');
const typeRoutes = require('./routes/type');
const trainerRoutes = require('./routes/trainer');

app.use('/pokemon', pokemonRoutes);
app.use('/types', typeRoutes);
app.use('/trainers', trainerRoutes);

// Redirect root to /pokemon
app.get('/', (req, res) => res.redirect('/pokemon'));

// Test DB route (remove later)
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});