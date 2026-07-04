const { protect } = require("./authMiddleware");

const exactPublicRoutes = [
  ["GET", "/health"],
  ["POST", "/auth/signup"],
  ["POST", "/auth/login"],
  ["POST", "/auth/signup/google"],
  ["POST", "/auth/signup/facebook"],
  ["POST", "/auth/forgot-password"],
  ["POST", "/auth/verify-otp"],
  ["POST", "/auth/reset-password"],
  ["GET", "/booking/payment/webhook"],
  ["POST", "/get_in_touch/create"],
];

const isPublicGetRoute = (path) => {
  const publicGetPatterns = [
    /^\/fleet\/get$/,
    /^\/fleet\/[^/]+$/,
    /^\/fleet_detail\/get$/,
    /^\/fleet_detail\/[^/]+$/,
    /^\/service_coverage\/get$/,
    /^\/service_coverage\/[^/]+$/,
    /^\/customer_review\/get$/,
    /^\/customer_review\/[^/]+$/,
  ];

  return publicGetPatterns.some((pattern) => pattern.test(path));
};

const isPublicRoute = (req) => {
  const path = req.path;

  if (exactPublicRoutes.some(([method, route]) => method === req.method && route === path)) {
    return true;
  }

  if (req.method === "GET" && isPublicGetRoute(path)) {
    return true;
  }

  return false;
};

const requireAuthUnlessPublic = (req, res, next) => {
  if (isPublicRoute(req)) {
    return next();
  }

  return protect(req, res, next);
};

module.exports = requireAuthUnlessPublic;
