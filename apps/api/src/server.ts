import { createApp } from './app.js';
import { readConfig } from './config.js';

function startServer(): void {
  try {
    const { port, corsAllowedOrigins } = readConfig();
    const server = createApp({ corsAllowedOrigins }).listen(port, () => {
      console.log(`BlueSense API listening on port ${port}.`);
    });

    server.on('error', () => {
      console.error('BlueSense API failed to start.');
      process.exitCode = 1;
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid API configuration.';
    console.error(message);
    process.exitCode = 1;
  }
}

startServer();
