require("dotenv").config();
const { Pool } = require("pg");

// Default to dev environment
const env = process.env.NODE_ENV || "development";

const pool = new Pool(
  env === "production"
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT|| 5432,
        ssl: false,
      }
);

module.exports = pool;