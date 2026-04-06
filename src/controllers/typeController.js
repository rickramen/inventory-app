const pool = require('../db/pool');

// List all types
exports.list = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM types ORDER BY name');
    res.render('types/list', { types: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};

// Detail of one type with Pokémon
exports.detail = async (req, res) => {
  const typeId = req.params.id;
  try {
    const typeRes = await pool.query('SELECT * FROM types WHERE id = $1', [typeId]);
    const type = typeRes.rows[0];

    if (!type) return res.status(404).send('Type not found');

    const pokemonRes = await pool.query(`
      SELECT p.*, tr.name AS trainer_name
      FROM pokemon p
      LEFT JOIN trainers tr ON p.trainer_id = tr.id
      WHERE p.type_id = $1
      ORDER BY p.name
    `, [typeId]);

    res.render('types/detail', { type, pokemonList: pokemonRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
};