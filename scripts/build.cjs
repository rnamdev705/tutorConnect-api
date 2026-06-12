const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

execSync("npx prisma generate && npx tsc", {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

// Render sometimes runs `node dist/index.js` with cwd set to `src/`.
// Mirror dist there so that misconfiguration still finds the build output.
const srcDist = path.join(root, "src", "dist");
const rootDist = path.join(root, "dist");

if (fs.existsSync(rootDist)) {
  fs.rmSync(srcDist, { recursive: true, force: true });
  fs.symlinkSync(path.join("..", "dist"), srcDist, "dir");
}
