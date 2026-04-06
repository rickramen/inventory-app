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