import { build, loadEnv, createServer } from "vite";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { validateV2Environment, projectId } from "./v2-env.mjs";
const env = {
  ...loadEnv("v2", process.cwd(), "VITE_"),
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith("VITE_")),
  ),
};
try {
  validateV2Environment(env);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (process.argv.includes("--serve")) {
  const server = await createServer({
    configFile: "vite.config.ts",
    mode: "v2",
  });
  await server.listen();
  server.printUrls();
} else {
  const require = createRequire(import.meta.url);
  const check = spawnSync(
    process.execPath,
    [require.resolve("typescript/bin/tsc"), "-b"],
    { stdio: "inherit" },
  );
  if (check.error) throw check.error;
  if (check.status !== 0) process.exit(check.status || 1);
  console.log(`Building V2 for Firebase project ${projectId}.`);
  await build({
    configFile: "vite.config.ts",
    mode: "v2",
    build: { outDir: "dist-v2" },
  });
}
