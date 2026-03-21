import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    viteSingleFile(),
    {
      name: 'copy-output',
      closeBundle() {
        const outDir = path.resolve(__dirname, "../../../dist/app-ui");
        const src = path.join(outDir, "index.html");
        const dstDynamic = path.join(outDir, "dynamic-view.html");
        const dstUniversal = path.join(outDir, "universal-renderer.html");
        if (fs.existsSync(src)) {
          // Copy to both names — universal-renderer is the canonical one
          fs.copyFileSync(src, dstUniversal);
          fs.renameSync(src, dstDynamic);
        }
      }
    }
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
