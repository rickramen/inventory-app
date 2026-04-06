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