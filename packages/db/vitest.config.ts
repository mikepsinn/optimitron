import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@optimitron\/data$/,
        replacement: path.resolve(__dirname, "../data/src/index.ts"),
      },
      {
        find: /^@optimitron\/data\/parameters$/,
        replacement: path.resolve(__dirname, "../data/src/parameters/index.ts"),
      },
      {
        find: /^@optimitron\/data\/datasets\/world-leaders$/,
        replacement: path.resolve(__dirname, "../data/src/datasets/world-leaders.ts"),
      },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
