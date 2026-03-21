import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: "rename-output",
      closeBundle() {
        const outDir = path.resolve(__dirname, "../../../dist/app-ui");
        const src = path.join(outDir, "index.html");
        const dst = path.join(outDir, "dynamic-view.html");
        if (fs.existsSync(src)) {
          fs.renameSync(src, dst);
        }
      },
    },
  ],
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "../../../dist/app-ui"),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
});
