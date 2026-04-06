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