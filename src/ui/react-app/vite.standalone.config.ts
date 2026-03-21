import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "../../../dist/app-ui"),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "standalone.html"),
    },
  },
});
