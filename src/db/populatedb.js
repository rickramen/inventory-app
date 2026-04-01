#!/usr/bin/env node
const pool = require('./pool');

// Build tables and seed data
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS pokemon (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  level INT DEFAULT 1,
  type_id INT REFERENCES types(id) ON DELETE SET NULL,
  trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL
);
`;

const INSERT_TYPES_SQL = `
INSERT INTO types (name) VALUES
  ('Fire'), ('Water'), ('Grass'), ('Electric')
ON CONFLICT DO NOTHING;
`;

const INSERT_TRAINERS_SQL = `
INSERT INTO trainers (name) VALUES
  ('Ash'), ('Misty'), ('Brock')
ON CONFLICT DO NOTHING;
`;

const INSERT_POKEMON_SQL = `
INSERT INTO pokemon (name, level, type_id, trainer_id) VALUES
  ('Charmander', 5, (SELECT id FROM types WHERE name='Fire'), (SELECT id FROM trainers WHERE name='Ash')),
  ('Squirtle', 5, (SELECT id FROM types WHERE name='Water'), (SELECT id FROM trainers WHERE name='Ash')),
  ('Bulbasaur', 5, (SELECT id FROM types WHERE name='Grass'), (SELECT id FROM trainers WHERE name='Ash')),
  ('Pikachu', 8, (SELECT id FROM types WHERE name='Electric'), (SELECT id FROM trainers WHERE name='Ash'))
ON CONFLICT DO NOTHING;
`;

// Modular async functions
async function createTables(client) {
  await client.query(CREATE_TABLES_SQL);
  console.log("Tables created successfully.");
}

async function seedTypes(client) {
  await client.query(INSERT_TYPES_SQL);
  console.log("Types seeded.");
}

async function seedTrainers(client) {
  await client.query(INSERT_TRAINERS_SQL);
  console.log("Trainers seeded.");
}

async function seedPokemon(client) {
  await client.query(INSERT_POKEMON_SQL);
  console.log("Pokemon seeded.");
}

async function main() {
  console.log("Seeding Pokémon database...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // start transaction

    await createTables(client);
    await seedTypes(client);
    await seedTrainers(client);
    await seedPokemon(client);

    await client.query("COMMIT"); // commit transaction
    console.log("Done! Database is ready.");
  } catch (err) {
    await client.query("ROLLBACK"); // rollback on error
    console.error("Error seeding database:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

main();