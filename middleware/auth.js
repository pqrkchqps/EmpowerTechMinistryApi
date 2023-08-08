const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  let token = req.header("auth-token");
  if (!token) {
    return res.status(401).json({
      message: "User must log in to gain access",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: 3600,
    });
    res.set("auth-token", newToken);
    next();
  } catch (err) {
    res.status(400).json({
      message: "Token could not be verified",
    });
  }
}

module.exports = auth;
