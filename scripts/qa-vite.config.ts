// Explicit offline QA entry point. Never used by the production build.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [react()],
  server: { allowedHosts: ["terminal.local"] },
  resolve: {
    alias: [
      {
        find: /^firebase\/(auth|firestore|app|storage)$/,
        replacement: fileURLToPath(
          new URL("../tests/fixtures/firebase.mjs", import.meta.url),
        ),
      },
    ],
  },
});
