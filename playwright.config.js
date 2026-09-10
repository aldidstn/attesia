import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './docs/phase-0/tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/wireflow/',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1 --directory docs/phase-0',
    url: 'http://127.0.0.1:4173/wireflow/',
    reuseExistingServer: !process.env.CI,
  },
});
