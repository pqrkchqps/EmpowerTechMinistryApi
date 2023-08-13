const pool = require("./pool");
const { sql } = require("slonik");

async function seed() {
    const db = await pool;
    db.any(sql.unsafe`CREATE TABLE if not exists users 
        ( id SERIAL PRIMARY KEY,
        email VARCHAR unique NOT NULL,
        password VARCHAR NOT NULL,
        username VARCHAR unique NOT NULL,
        type VARCHAR NOT NULL default 'user')`);
    db.any(sql.unsafe`ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL default 'user';`);

    db.any(sql.unsafe`CREATE TABLE if not exists threads 
        ( id SERIAL PRIMARY KEY,
        userid SERIAL NOT NULL references users(id),
        title VARCHAR,
        content VARCHAR,
        date timestamp NOT NULL DEFAULT NOW(),
        views BIGINT NOT NULL DEFAULT 0)`);

    db.any(sql.unsafe`CREATE TABLE if not exists articles 
        ( id SERIAL PRIMARY KEY,
        userid SERIAL NOT NULL references users(id),
        title VARCHAR,
        content VARCHAR,
        date timestamp NOT NULL DEFAULT NOW(),
        views BIGINT NOT NULL DEFAULT 0)`);

    db.any(sql.unsafe`DROP TABLE if exists comments; CREATE TABLE if not exists comments 
        ( id SERIAL PRIMARY KEY,
        userid SERIAL NOT NULL references users(id),
        rootid SERIAL,
        parentid SERIAL,
        content VARCHAR,
        type VARCHAR,
        date timestamp NOT NULL DEFAULT NOW())`);
}

module.exports = seed;
