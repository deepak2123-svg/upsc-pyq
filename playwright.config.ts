import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const vercelOidcToken = process.env.VERCEL_OIDC_TOKEN;

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: remoteBaseURL || "http://127.0.0.1:4173",
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    extraHTTPHeaders: vercelOidcToken ? { "x-vercel-trusted-oidc-idp-token": vercelOidcToken } : undefined,
  },
  projects: [{
    name: "chromium",
    use: { ...devices["Desktop Chrome"], viewport: { width: 1600, height: 1000 } },
  }],
  webServer: remoteBaseURL ? undefined : {
    command: `${process.platform === "win32" ? "npm.cmd" : "npm"} run dev -- --hostname 127.0.0.1 --port 4173`,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
