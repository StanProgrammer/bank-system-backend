const { AppError } = require('./errorHandler');

/** Must run after validateToken (req.user is set by then). */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.user && req.user.user.isAdmin) return next();
  next(new AppError('Admin access required', 403));
};

module.exports = isAdmin;
