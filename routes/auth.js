const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', { title: 'Iniciar sesión', layout: false });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('auth/login', {
      title: 'Iniciar sesión',
      layout: false,
      error: 'Correo o contraseña incorrectos.'
    });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
