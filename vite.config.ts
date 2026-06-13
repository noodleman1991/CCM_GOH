import { defineConfig } from 'vitest/config';
import path from 'path';

// No @vitejs/plugin-react needed: vitest's esbuild transforms TSX using
// tsconfig's `jsx: react-jsx` setting.
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './')
        }
    },
    test: {
        environment: 'node',
        include: ['**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next', 'generated', 'scripts'],
    }
});
