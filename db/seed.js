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

  db.any(sql.unsafe`CREATE TABLE if not exists comments 
        ( id SERIAL PRIMARY KEY,
        userid SERIAL NOT NULL references users(id),
        rootid SERIAL,
        parentid SERIAL,
        content VARCHAR,
        type VARCHAR,
        date timestamp NOT NULL DEFAULT NOW())`);

  // Create the THREAD_NOTIFY function if it doesn't exist
  await db.any(sql.unsafe`
      CREATE OR REPLACE FUNCTION THREAD_NOTIFY() RETURNS trigger AS
      $BODY$
      DECLARE
        username TEXT;
      BEGIN
        -- Retrieve the username of the user who made the comment
        SELECT u.username INTO username
        FROM users u
        WHERE u.id = NEW.userid;

        PERFORM pg_notify('thread', 
          JSON_BUILD_OBJECT(
            'content', NEW.content, 
            'id', NEW.id, 
            'username', username,
            'userid', NEW.userid,
            'year', EXTRACT (YEAR FROM NEW.date),
            'month', EXTRACT (MONTH FROM NEW.date),
            'day', EXTRACT (DAY FROM NEW.date),
            'title', NEW.title,
            'views', NEW.views
          )::TEXT
        );
        RETURN NEW;
      END;
      $BODY$
      LANGUAGE 'plpgsql';
  `);

  // Create the ARTICLE_NOTIFY function if it doesn't exist
  await db.any(sql.unsafe`
      CREATE OR REPLACE FUNCTION ARTICLE_NOTIFY() RETURNS trigger AS
      $BODY$
      DECLARE
        username TEXT;
      BEGIN
        -- Retrieve the username of the user who made the comment
        SELECT u.username INTO username
        FROM users u
        WHERE u.id = NEW.userid;

        PERFORM pg_notify('article', 
          JSON_BUILD_OBJECT(
            'content', NEW.content, 
            'id', NEW.id, 
            'username', username,
            'userid', NEW.userid,
            'year', EXTRACT (YEAR FROM NEW.date),
            'month', EXTRACT (MONTH FROM NEW.date),
            'day', EXTRACT (DAY FROM NEW.date),
            'title', NEW.title,
            'views', NEW.views
          )::TEXT
        );
        RETURN NEW;
      END;
      $BODY$
      LANGUAGE 'plpgsql';
  `);

  // Create the COMMENT_NOTIFY function if it doesn't exist
  await db.any(sql.unsafe`
      CREATE OR REPLACE FUNCTION COMMENT_NOTIFY() RETURNS trigger AS
      $BODY$
      DECLARE
        username TEXT;
        title TEXT;
      BEGIN
      -- Retrieve the username of the user who made the comment
      SELECT u.username INTO username
      FROM users u
      WHERE u.id = NEW.userid;

      -- Retrieve the title of the thread containing the comment
      SELECT t.title INTO title
      FROM threads t
      WHERE t.id = NEW.rootid;

      PERFORM pg_notify('comment', 
        JSON_BUILD_OBJECT(
          'content', NEW.content, 
          'id', NEW.id, 
          'parentid', NEW.parentid, 
          'rootid', NEW.rootid, 
          'username', username,
          'userid', NEW.userid,
          'year', EXTRACT (YEAR FROM NEW.date),
          'month', EXTRACT (MONTH FROM NEW.date),
          'day', EXTRACT (DAY FROM NEW.date),
          'title', title,
          'type', NEW.type
        )::TEXT
      );
      RETURN NEW;
      END;
      $BODY$
      LANGUAGE 'plpgsql';
  `);

  await db.any(sql.unsafe`
      DROP TRIGGER IF EXISTS threads_after ON threads;
  `);
  await db.any(sql.unsafe`
      DROP TRIGGER IF EXISTS articles_after ON articles;
  `);
  await db.any(sql.unsafe`
      DROP TRIGGER IF EXISTS comments_after ON comments;
  `);

  // Check if the trigger exists
  const threadsTriggerExists = await db.maybeOne(sql.unsafe`
        SELECT 1
        FROM information_schema.triggers
        WHERE trigger_name = 'threads_after'
    `);

  if (!threadsTriggerExists) {
    // Create the trigger
    await db.any(sql.unsafe`
    CREATE TRIGGER threads_after 
        AFTER INSERT
        ON threads 
        FOR EACH ROW
        EXECUTE PROCEDURE THREAD_NOTIFY();
    `);
  } else {
    console.log("Trigger 'threads_after' already exists.");
  }

  // Check if the trigger exists
  const articlesTriggerExists = await db.maybeOne(sql.unsafe`
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_name = 'articles_after'
  `);

  if (!articlesTriggerExists) {
    // Create the trigger
    await db.any(sql.unsafe`
    CREATE TRIGGER articles_after 
      AFTER INSERT
      ON articles 
      FOR EACH ROW
      EXECUTE PROCEDURE ARTICLE_NOTIFY();
  `);
  } else {
    console.log("Trigger 'articles_after' already exists.");
  }

  // Check if the trigger exists
  const commentsTriggerExists = await db.maybeOne(sql.unsafe`
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_name = 'comments_after'
  `);

  if (!commentsTriggerExists) {
    // Create the trigger
    await db.any(sql.unsafe`
    CREATE TRIGGER comments_after 
      AFTER INSERT
      ON comments 
      FOR EACH ROW
      EXECUTE PROCEDURE COMMENT_NOTIFY();
  `);
  } else {
    console.log("Trigger 'comments_after' already exists.");
  }
}

module.exports = seed;
