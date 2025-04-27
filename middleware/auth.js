const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  let token = req.header("auth-token");
  if (!token) {
    return res.status(401).json({
      error: "User must log in to gain access",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      //expiresIn: 3600,
    });
    res.set("auth-token", newToken);
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({
      error: "Token could not be verified",
    });
  }
}

module.exports = auth;
