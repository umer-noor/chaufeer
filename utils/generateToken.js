const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number || null,
      provider: user.provider,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

module.exports = generateToken;
