import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import dts from "vite-plugin-dts";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

// @warehouse/ui-kit: shared design tokens + component library consumed by
// every remote and by warehouse-console. Built as a library (not an app) --
// consumers import from "@warehouse/ui-kit", never reach into src/.
export default defineConfig({
  plugins: [
    react(),
    dts({ tsconfigPath: `${rootDir}tsconfig.app.json`, insertTypesEntry: true }),
  ],
  build: {
    lib: {
      entry: `${rootDir}src/index.ts`,
      name: "WarehouseUiKit",
      fileName: (format) => `ui-kit.${format}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      // react/react-dom are peer deps: every remote and the shell bring
      // their own single copy (via Module Federation's shared singleton
      // config) -- bundling React into the kit would risk two React
      // instances at runtime, which breaks hooks silently.
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: { react: "React", "react-dom": "ReactDOM" },
      },
    },
    cssCodeSplit: false,
  },
});
