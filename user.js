/** User class for message.ly */
const db = require('../db');
const express = require('expres');
const ExpressError = require('../expressError');
const { user } = require('pg/lib/defaults');
const { SECRET_KEY } = require('../config');
const router = new express.Router();


/** User of the site. */

class User {
  constructor(username, password, first_name, last_name, phone) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const results = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5)`, [username, password, first_name, last_name, phone])

    const u = results.rows[0]
    return new User(u.username, u.password, u.first_name, u.last_name, u.phone)
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    if (!username || !password) {
      throw new ExpressError('Username and password required', 404)
    }

    const results = await db.query(`SELECT username, password FROM users WHERE username =$1`, [username])
    const user = results.rows[0]

    if(user){
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({username}, SECRET_KEY)
        return res.json(true)
      }
    } else {
      return res.json(false)
    }

  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    if (!username) {
      throw new ExpressError('Username', 404)
    }
    let currDate = new Date()
    const results = await db.query(`UPDATE users SET last_login_at=$1 WHERE username=$2 RETURNING username, last_login_at`, [currDate, username])

    const u = results.rows[0]
    return new User(u.username, u.last_login_at)
   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`SELECT * FROM users`)

    const users = results.rows.map(r => new User(r.username, r.password, r.first_name, r.last_name, r.phone))
    return users
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    if (!username) {
      throw new ExpressError('Username', 404)
    }

    const results = await db.query(`SELECT * FROM users WHERE username=$1`, [username])

    const u = results.rows[0]
    return new User(u.username, u.password, u.first_name, u.last_name, u.phone)
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    if (!username) {
      throw new ExpressError('Username', 404)
    }

    const msgResults = await db.query(`SELECT id, to_username, body, sent_at, read_at FROM messages WHERE to_username=$1`, [username])

    return res.json(msgResults.rows[0])
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    if (!username) {
      throw new ExpressError('Username', 404)
    }

    const msgResults = await db.query(`SELECT id, from_username, body, sent_at, read_at FROM messages WHERE from_username=$1`, [username])

    return res.json(msgResults.rows[0])
   }
}


module.exports = User;