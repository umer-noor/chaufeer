const { execSync } = require("child_process");

const port = process.env.PORT || 5000;

const freePort = () => {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const pids = new Set();

    output
      .split(/\r?\n/)
      .filter((line) => line.includes("LISTENING"))
      .forEach((line) => {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && pid !== "0") {
          pids.add(pid);
        }
      });

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`Freed port ${port} (stopped PID ${pid})`);
      } catch {
        // Process may already be gone
      }
    });
  } catch {
    // Port is already free
  }
};

freePort();
