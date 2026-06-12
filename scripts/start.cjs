const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const entry = path.join(root, "dist", "index.js");

if (!fs.existsSync(entry)) {
  console.log("dist/index.js not found — running build...");
  execSync("node scripts/build.cjs", { cwd: root, stdio: "inherit" });
}

if (!fs.existsSync(entry)) {
  console.error(`Build failed: ${entry} does not exist`);
  process.exit(1);
}

const child = spawn(process.execPath, [entry], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
