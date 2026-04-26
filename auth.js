const express = require('express');
const mysql = require('mysql');
const router = express.Router();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'myapp'
});

router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    db.query(query, (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.user = results[0];
            req.session.isAdmin = results[0].is_admin;
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false });
        }
    });
});

router.get('/users', (req, res) => {
    const query = "SELECT * FROM users";
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

router.post('/reset-password', (req, res) => {
    const email = req.body.email;
    const newPassword = req.body.newPassword;

    const query = `UPDATE users SET password = '${newPassword}' WHERE email = '${email}'`;
    db.query(query, (err) => {
        if (err) throw err;
        res.json({ success: true });
    });
});

module.exports = router;