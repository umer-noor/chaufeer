const bcrypt = require("bcryptjs");

const OTP_LENGTH = 6;

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isValidOtpFormat = (otp) => {
  return /^\d{6}$/.test(String(otp));
};

const hashOtp = async (otp) => {
  return bcrypt.hash(String(otp), 10);
};

const compareOtp = async (candidateOtp, hashedOtp) => {
  if (!hashedOtp) {
    return false;
  }

  return bcrypt.compare(String(candidateOtp), hashedOtp);
};

const getOtpExpiryDate = () => {
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  OTP_LENGTH,
  generateOtp,
  isValidOtpFormat,
  hashOtp,
  compareOtp,
  getOtpExpiryDate,
};
