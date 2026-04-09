#!/usr/bin/env node
const pool = require('./pool');

// !!! Drop tables (reset) !!!
const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS pokemon, trainers, types CASCADE;
`;

// Create tables
const CREATE_TABLES_SQL = `
CREATE TABLE types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE trainers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE pokemon (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type_id INT NOT NULL REFERENCES types(id) ON DELETE RESTRICT,
  trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL,
  image_url TEXT
);
`;

// Populate trainers
const INSERT_TRAINERS_SQL = `
INSERT INTO trainers (name) VALUES
  ('Ash'), ('Misty'), ('Brock'),
  ('May'), ('Dawn'), ('Cynthia')
`;

async function fetchPokemon(name) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  const data = await res.json();

  return {
    name: data.name,
    type: data.types[0].type.name,
    image: data.sprites.front_default
  };
}

async function insertPokemon(client, pokemon, trainerName) {
  // Insert new type (or assigns if already exists)
  const typeResult = await client.query(
    `INSERT INTO types (name)
     VALUES ($1)
     ON CONFLICT (name) DO NOTHING
     RETURNING id`,
    [pokemon.type]
  );

  const trainerResult = await client.query(
    'SELECT id FROM trainers WHERE name = $1',
    [trainerName]
  );

  const typeId = typeResult.rows[0].id;
  const trainerId = trainerResult.rows[0]?.id;

  await client.query(
    `INSERT INTO pokemon (name, type_id, trainer_id, image_url)
     VALUES ($1, $2, $3, $4)`,
    [pokemon.name, typeId, trainerId, pokemon.image]
  );
}

// Seed Pokémon using API
async function seedData(client) {
  await client.query(INSERT_TRAINERS_SQL);

  const pokemonList = [
    { name: 'pikachu', trainer: 'Ash' },
    { name: 'gyarados', trainer: 'Misty' },
    { name: 'steelix', trainer: 'Brock' },
    { name: 'blaziken', trainer: 'May' },
    { name: 'piplup', trainer: 'Dawn' },
    { name: 'garchomp', trainer: 'Cynthia' }
  ];

  for (const p of pokemonList) {
    const data = await fetchPokemon(p.name);
    await insertPokemon(client, data, p.trainer);
    console.log(`Inserted ${data.name}`);
  }

  console.log("Data seeded with PokéAPI.");
}

async function main() {
  console.log("Resetting and seeding database...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(DROP_TABLES_SQL);
    console.log("Tables dropped.");

    await client.query(CREATE_TABLES_SQL);
    console.log("Tables created.");

    await seedData(client);

    await client.query("COMMIT");
    console.log("Done! Database is fresh.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

main();