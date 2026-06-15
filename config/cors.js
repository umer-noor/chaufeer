const getAllowedOrigins = () => {
  const defaults = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];

  if (!process.env.CLIENT_URL) {
    return defaults;
  }

  const customOrigins = process.env.CLIENT_URL.split(",").map((url) => url.trim());
  return [...new Set([...defaults, ...customOrigins])];
};

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = getAllowedOrigins();

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV !== "production" && origin.includes("localhost")) {
      callback(null, true);
      return;
    }

    if (origin.endsWith(".vercel.app")) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = corsOptions;
