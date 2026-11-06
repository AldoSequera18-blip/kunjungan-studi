const { spawnSync } = require("node:child_process");

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Perintah npm belum diberikan.");
  process.exit(2);
}

const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.toLowerCase() === "npm_config_cache_dir") delete env[key];
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npm, [command, ...args], { env, stdio: "inherit", shell: process.platform === "win32" });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
