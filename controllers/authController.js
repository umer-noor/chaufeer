const authService = require("../services/authService");

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
});

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    const { user, token } = await authService.authenticateWithGoogle(idToken);

    res.status(200).json({
      success: true,
      message: "Google authentication successful",
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const facebookAuth = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: "accessToken is required" });
    }

    const { user, token } = await authService.authenticateWithFacebook(accessToken);

    res.status(200).json({
      success: true,
      message: "Facebook authentication successful",
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);

    res.status(200).json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleAuth,
  facebookAuth,
  getMe,
};
