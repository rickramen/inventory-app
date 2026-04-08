const pool = require('../db/pool'); 

exports.list = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainers ORDER BY name');
    res.render('trainers/list', { trainers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

exports.detail = async (req, res) => {
  const trainerId = req.params.id;
  try {
    const trainerRes = await pool.query('SELECT * FROM trainers WHERE id = $1', [trainerId]);
    const trainer = trainerRes.rows[0];

    if (!trainer) return res.status(404).send('Trainer not found');

    const pokemonRes = await pool.query(`
      SELECT p.*, t.name AS type_name
      FROM pokemon p
      JOIN types t ON p.type_id = t.id
      WHERE p.trainer_id = $1
      ORDER BY p.name
    `, [trainerId]);

    res.render('trainers/detail', { trainer, pokemonList: pokemonRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

exports.createGet = (req, res) => {
  res.render('trainers/form', { 
    trainer: null, 
    error: null, 
    isUpdate: false
  });
};

exports.createPost = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.render('trainers/form', {
      trainer: { name },
      error: 'Trainer name is required',
      isUpdate: false   
    });
  }

  try {
    await pool.query(
      'INSERT INTO trainers (name) VALUES ($1)',
      [name.trim()]
    );

    res.redirect('/trainers');
  } catch (err) {
    console.error(err);
    res.render('trainers/form', {
      trainer: { name },
      error: 'Failed to create trainer'
    });
  }
};

exports.updateGet = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM trainers WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Trainer not found');

    res.render('trainers/form', {
      trainer: result.rows[0],
      error: null,
      isUpdate: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

exports.updatePost = async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name) return res.send('Trainer name is required');

  try {
    await pool.query('UPDATE trainers SET name = $1 WHERE id = $2', [name, id]);
    res.redirect(`/trainers/${id}`);  // redirect to trainer detail page
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};


exports.deletePost = async (req, res) => {
  const id = req.params.id;

  try {
    // Reassign trainers pokemon to null before delete
    await pool.query('UPDATE pokemon SET trainer_id = NULL WHERE trainer_id = $1', [id]);

    // Delete trainer
    const result = await pool.query('DELETE FROM trainers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).send('Trainer not found');

    res.redirect('/trainers');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};