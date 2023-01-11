const express = require("express");
const Message = require("../models/message");
const router = new express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async (req, res, next) => {
    try{
        let msg = await Message.get(req.params.id)
        return res.json(msg)
    } catch (e) {
        return next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async (req, res, next) => {
    try{
        let { to_username, body, username } = req.body;
        const msg = await Message.create(username, to_username, body)
        return res.json(msg)
    } catch (e) {
        return next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.get('/:id/read', async (req, res, next) => {
    try{
        const msg = await Message.markRead(req.params.id)
        return res.json(msg)
    } catch (e) {
        return next(e)
    }
})

