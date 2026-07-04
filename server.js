require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Run: npm run dev (it frees the port automatically) or npm run free-port`
        );
      } else {
        console.error(`Failed to start server: ${error.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const shutdown = (callback) => {
  const finish = () => {
    mongoose.connection.close(false).finally(() => {
      if (callback) {
        callback();
      } else {
        process.exit(0);
      }
    });
  };

  if (!server) {
    finish();
    return;
  }

  server.close(finish);
};

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

process.once("SIGUSR2", () => {
  shutdown(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});

startServer();
