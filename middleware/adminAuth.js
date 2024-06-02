const jwt = require("jsonwebtoken");

const generateAuthToken = (user) => {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;
  const token = jwt.sign(
    { _id:user._id,email:user.email,role:"admin" },
    jwtSecretKey,
    { expiresIn: "48h" },
  );
  return token;
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    console.log(token);

    if (!token) {
      return res.status(401).json({ message: 'Authentication failed: No token provided.' });
    }

    if (!token.startsWith('Bearer')) {
      return res.status(401).json({ message: 'Authentication failed: Invalid token format.' });
    }

    const tokenWithoutBearer = token.slice(7).trim();

    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET_KEY);

    if (decoded.role === 'admin') {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({ message: 'Authentication failed: Invalid role.' });
    }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication failed: Token has expired.' });
    }
    return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
  }
};

module.exports = {
  generateAuthToken,
  verifyToken
};