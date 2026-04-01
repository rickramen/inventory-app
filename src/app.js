// app.js
require('dotenv').config();
const express = require('express');
const pool = require('./db/pool'); 
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Test DB route 
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // simple test query
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});