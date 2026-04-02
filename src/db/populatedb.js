#!/usr/bin/env node
const pool = require('./pool');

// Drop tables (reset)
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
  type_id INT REFERENCES types(id) ON DELETE SET NULL,
  trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL
);
`;

// Seed data
const INSERT_TYPES_SQL = `
INSERT INTO types (name) VALUES
  ('Fire'), ('Water'), ('Grass'), ('Electric');
`;

const INSERT_TRAINERS_SQL = `
INSERT INTO trainers (name) VALUES
  ('Ash'), ('Misty'), ('Brock');
`;

const INSERT_POKEMON_SQL = `
INSERT INTO pokemon (name, type_id, trainer_id)
SELECT 
  p.name,
  t.id,
  tr.id
FROM (
  VALUES
    ('Charmander', 'Fire', 'Ash'),
    ('Squirtle', 'Water', 'Ash'),
    ('Bulbasaur', 'Grass', 'Ash'),
    ('Pikachu', 'Electric', 'Ash')
) AS p(name, type_name, trainer_name)
JOIN types t ON t.name = p.type_name
JOIN trainers tr ON tr.name = p.trainer_name;
`;

// Functions
async function dropTables(client) {
  await client.query(DROP_TABLES_SQL);
  console.log("Tables dropped.");
}

async function createTables(client) {
  await client.query(CREATE_TABLES_SQL);
  console.log("Tables created.");
}

async function seedData(client) {
  await client.query(INSERT_TYPES_SQL);
  await client.query(INSERT_TRAINERS_SQL);
  await client.query(INSERT_POKEMON_SQL);
  console.log("Data seeded.");
}

async function main() {
  console.log("Resetting and seeding database...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await dropTables(client);
    await createTables(client);
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