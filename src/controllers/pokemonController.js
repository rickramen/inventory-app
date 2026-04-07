// pokemonController.js

const pool = require('../db/pool');

exports.list = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.image_url, t.name AS type, tr.name AS trainer
      FROM pokemon p
      LEFT JOIN types t ON p.type_id = t.id
      LEFT JOIN trainers tr ON p.trainer_id = tr.id
      ORDER BY p.id;
    `);

    res.render('pokemon/list', { pokemon: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

exports.detail = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.image_url,
              t.name AS type,
              tr.name AS trainer
       FROM pokemon p
       LEFT JOIN types t ON p.type_id = t.id
       LEFT JOIN trainers tr ON p.trainer_id = tr.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Pokemon not found');
    }

    res.render('pokemon/detail', { pokemon: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

exports.createGet = async (req, res) => {
  try {
    // Fetch trainers for the dropdown
    const trainers = await pool.query('SELECT * FROM trainers');

    res.render('pokemon/form', {
      pokemon: null,        // empty form for new Pokémon
      trainers: trainers.rows,
      error: null           // for validation messages
    });
  } catch (err) {
    console.error(err);
    res.send('Error loading form');
  }
};

exports.createPost = async (req, res) => {
  const { name, trainer_id } = req.body;
  const trainerIdInt = parseInt(trainer_id, 10);
  const trainers = (await pool.query('SELECT * FROM trainers')).rows;

  // Validate input
  if (!name) {
    return res.render('pokemon/form', { pokemon: { name, trainer_id: trainerIdInt }, trainers, error: 'Name is required' });
  }
  if (!trainer_id || isNaN(trainerIdInt)) {
    return res.render('pokemon/form', { pokemon: { name }, trainers, error: 'You must assign a trainer' });
  }

  // Fetch PokéAPI
  let pokeData;
  try {
    const pokeResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase().trim()}`);
    if (!pokeResponse.ok) throw new Error('PokeAPI returned non-OK status');
    const data = await pokeResponse.json();

    const typeName = data.types[0]?.type?.name;
    if (!typeName) throw new Error('Pokemon type not found');

    pokeData = {
      name: data.name,
      type: typeName,
      image: data.sprites.front_default || null
    };
    console.log('Normalized Pokémon data:', pokeData);
  } catch (err) {
    return res.render('pokemon/form', { pokemon: { name, trainer_id: trainerIdInt }, trainers, error: 'Failed to fetch Pokemon data from PokeAPI' });
  }

  // Insert into DB
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const typeResult = await client.query(
      `INSERT INTO types (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [pokeData.type]
    );
    const typeId = typeResult.rows[0].id;

    await client.query(
      `INSERT INTO pokemon (name, type_id, trainer_id, image_url)
       VALUES ($1, $2, $3, $4)`,
      [pokeData.name, typeId, trainerIdInt, pokeData.image]
    );

    await client.query('COMMIT');
    res.redirect('/pokemon');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.render('pokemon/form', { pokemon: { name, trainer_id: trainerIdInt }, trainers, error: 'Database error' });
  } finally {
    client.release();
  }
};

exports.updateGet = (req, res) => {
  res.send('Update');
};

exports.updatePost = (req, res) => {
  res.send('Update');
};

exports.deletePost = (req, res) => {
  res.send('Delete');
};