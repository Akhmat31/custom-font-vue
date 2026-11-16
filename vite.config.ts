import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ["src"],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "VueFontLoader",
      fileName: "ext-vue-font",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["vue", "axios"],
      output: {
        globals: {
          vue: "Vue",
          axios: "axios",
        },
      },
    },
  },
});
