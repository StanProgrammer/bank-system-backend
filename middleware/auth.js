const jwt = require('jsonwebtoken');
const validateToken = (req, res, next) => {
  
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Invalid token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => { 
    if (err) {
        console.log(err);
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.user = user;
    next();
  });
};

module.exports = validateToken;