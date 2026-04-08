// pokemonController.js

const pool = require('../db/pool');

exports.list = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.image_url, t.name AS type, COALESCE(tr.name, 'No Trainer') AS trainer
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
              COALESCE(tr.name, 'No Trainer') AS trainer
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
      trainers: trainers.rows,  // fetch trainers for dropdown
      error: null,           // for validation
      isUpdate: false 
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
  return res.render('pokemon/form', { 
    pokemon: { name, trainer_id: trainerIdInt }, 
    trainers, 
    error: 'Name is required',
    isUpdate: false         
  });
}

if (!trainer_id || isNaN(trainerIdInt)) {
  return res.render('pokemon/form', { 
    pokemon: { name }, 
    trainers, 
    error: 'You must assign a trainer',
    isUpdate: false         
  });
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
  } catch (err) {
    return res.render('pokemon/form', { pokemon: { name, trainer_id: trainerIdInt }, trainers, error: 'Failed to fetch Pokemon data from PokeAPI' });
  }

  // Insert pokemon into DB
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Upsert type and return type_id
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

exports.updateGet = async (req, res) => {
  const id = req.params.id;
  try {
    // Fetch the Pokémon and trainers
    const pokemonResult = await pool.query('SELECT * FROM pokemon WHERE id = $1', [id]);
    const trainersResult = await pool.query('SELECT * FROM trainers');

    if (pokemonResult.rows.length === 0) {
      return res.status(404).send('Pokemon not found');
    }

    res.render('pokemon/form', {
      pokemon: pokemonResult.rows[0], // pre-fill form
      trainers: trainersResult.rows,
      error: null,
      isUpdate: true  // new flag for the template
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

exports.updatePost = async (req, res) => {
  const id = req.params.id;
  const {trainer_id } = req.body;
  const trainerIdInt = parseInt(trainer_id, 10);

  // Validate input
  if (!trainer_id || isNaN(trainerIdInt)) return res.send('Trainer is required');

  try {
    // Update the Pokémon
    await pool.query(
      `UPDATE pokemon
       SET trainer_id = $1
       WHERE id = $2`,
      [trainerIdInt, id]
    );
    res.redirect(`/pokemon/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

exports.deletePost = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query('DELETE FROM pokemon WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Pokemon not found');
    }

    res.redirect('/pokemon'); // back to the list
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};