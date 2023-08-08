const pool = require("./pool");
const { sql } = require("slonik");

async function seed() {
    const db = await pool;
    db.any(sql.unsafe`CREATE TABLE if not exists users 
        ( id SERIAL PRIMARY KEY,
        email VARCHAR unique NOT NULL,
        password VARCHAR NOT NULL,
        username VARCHAR unique NOT NULL)`);

    db.any(sql.unsafe`CREATE TABLE if not exists threads 
        ( id SERIAL PRIMARY KEY,
        userid SERIAL NOT NULL references users(id),
        title VARCHAR,
        content VARCHAR,
        date timestamp NOT NULL DEFAULT NOW(),
        views BIGINT NOT NULL DEFAULT 0)`);

    db.any(sql.unsafe`CREATE TABLE if not exists comments 
        ( id SERIAL PRIMARY KEY,
        userid SERIAL NOT NULL references users(id),
        rootid SERIAL references threads(id),
        parentid SERIAL,
        content VARCHAR,
        type VARCHAR,
        date timestamp NOT NULL DEFAULT NOW())`);
}

module.exports = seed;
