const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

if (process.env.RENDER === "true") {
  console.log("Render detected — compiling TypeScript...");
  execSync("node scripts/build.cjs", { cwd: root, stdio: "inherit" });
}
