const authService = require("../services/authService");

const formatUser = (user) => ({
  id: user._id,
  full_name: user.full_name,
  email: user.email,
  phone_number: user.phone_number || null,
  provider: user.provider,
  is_email_verified: user.is_email_verified || false,
  role: user.role || "user",
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

    const result = await authService.signup({
      full_name,
      email,
      password,
      phone_number,
    });

    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Verify to activate your account.",
      data: {
        user: formatUser(result.user),
        requires_verification: true,
      },
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
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ success: false, message: "id_token is required" });
    }

    const { user, token } = await authService.signupWithGoogle(id_token);

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
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ success: false, message: "access_token is required" });
    }

    const { user, token } = await authService.signupWithFacebook(access_token);

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

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    const result = await authService.sendPasswordResetOtp(email);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || otp === undefined || otp === null || otp === "") {
      return res.status(400).json({
        success: false,
        message: "email and otp are required",
      });
    }

    const result = await authService.verifyOtp({ email, otp });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verifySignupOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || otp === undefined || otp === null || otp === "") {
      return res.status(400).json({
        success: false,
        message: "email and otp are required",
      });
    }

    const { user, token } = await authService.verifySignupOtp({ email, otp });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: { user: formatUser(user), token },
    });
  } catch (error) {
    next(error);
  }
};

const resendSignupOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    const result = await authService.resendSignupOtp(email);

    res.status(200).json({
      success: true,
      message: "OTP resent to your email",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, new_password } = req.body;

    if (!email || otp === undefined || otp === null || otp === "" || !new_password) {
      return res.status(400).json({
        success: false,
        message: "email, otp, and new_password are required",
      });
    }

    const user = await authService.resetPassword({ email, otp, new_password });

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      data: { user: formatUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone_number } = req.body;

    if (full_name === undefined && phone_number === undefined) {
      return res.status(400).json({
        success: false,
        message: "At least one of full_name or phone_number is required",
      });
    }

    const user = await authService.updateProfile(req.user._id, {
      full_name,
      phone_number,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    await authService.deleteAccount(req.user._id, password);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  googleSignup,
  facebookSignup,
  logout,
  forgotPassword,
  verifyOtp,
  verifySignupOtp,
  resendSignupOtp,
  resetPassword,
  getProfile,
  updateProfile,
  deleteAccount,
};
