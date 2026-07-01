import { defineConfig } from 'vitest/config';
import path from 'path';

// No @vitejs/plugin-react needed: vitest's esbuild transforms TSX using
// tsconfig's `jsx: react-jsx` setting.
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            'server-only': path.resolve(__dirname, './lib/__tests__/stubs/server-only.ts'),
        },
    },
    test: {
        environment: 'node',
        include: ['**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next', 'generated', 'scripts'],
    }
});
