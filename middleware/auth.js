function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { error: 'Debes iniciar sesión para acceder.' };
    return res.redirect('/auth/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { error: 'Debes iniciar sesión para acceder.' };
    return res.redirect('/auth/login');
  }
  if (req.session.user.role !== 'admin') {
    req.session.flash = { error: 'No tienes permisos para acceder a esta sección.' };
    return res.redirect('/');
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
