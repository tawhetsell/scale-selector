// Runs export-fixtures.ts through Vite, so the TypeScript sources load without a build step.
import { runnerImport } from 'vite';

await runnerImport(new URL('./export-fixtures.ts', import.meta.url).pathname);
