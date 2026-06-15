const authService = require("../services/authService");

const formatUser = (user) => ({
  id: user._id,
  full_name: user.full_name,
  email: user.email,
  phone_number: user.phone_number || null,
  provider: user.provider,
});

const signup = async (req, res, next) => {
  try {
    const { full_name, email, password, phone_number } = req.body;

    if (!full_name || !email || !password || !phone_number) {
      return res.status(400).json({
        success: false,
        message: "full_name, email, password, and phone_number are required",
      });
    }

    const { user, token } = await authService.signup({
      full_name,
      email,
      password,
      phone_number,
    });

    res.status(201).json({
      success: true,
      message: "Signup successful",
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const { user, token } = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    next(error);
  }
};

const googleSignup = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    const { user, token } = await authService.signupWithGoogle(idToken);

    res.status(200).json({
      success: true,
      message: "Google signup/login successful",
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    next(error);
  }
};

const facebookSignup = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: "accessToken is required" });
    }

    const { user, token } = await authService.signupWithFacebook(accessToken);

    res.status(200).json({
      success: true,
      message: "Facebook signup/login successful",
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

module.exports = {
  signup,
  login,
  googleSignup,
  facebookSignup,
  logout,
};
