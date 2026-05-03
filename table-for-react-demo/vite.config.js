import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Use package source locally so `npm run dev` works without pre-building the library
      "table-for-react": path.resolve(
        __dirname,
        "../packages/table-for-react/src/index.jsx"
      ),
    },
  },
});
