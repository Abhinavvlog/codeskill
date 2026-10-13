import { getBrowserApiBaseURL } from "@/lib/api-base-url";

const production = { origin: "https://codeskill.example.test", hostname: "codeskill.example.test", protocol: "https:" };
const development = { origin: "http://localhost:3000", hostname: "localhost", protocol: "http:" };

it.each([undefined, "", "  ", "/api", "http://13.235.62.189/api", "http://localhost:5001/api", "http://127.0.0.1:5001/api", "http://[::1]:5001/api", "https://localhost:5001/api", "http://[invalid"])('uses same-origin /api for unsafe or missing production URL %s', configured => {
  expect(getBrowserApiBaseURL(configured, production)).toBe("/api");
});

it('preserves an explicitly configured HTTPS API', () => {
  expect(getBrowserApiBaseURL("https://api.example.test/api", production)).toBe("https://api.example.test/api");
});

it('preserves relative API routing', () => {
  expect(getBrowserApiBaseURL("/custom-api", production)).toBe("/custom-api");
});

it.each(["http://localhost:5001/api", "http://127.0.0.1:5001/api", "http://[::1]:5001/api"])('keeps valid local development API %s', configured => {
  expect(getBrowserApiBaseURL(configured, development)).toBe(configured);
});

it('does not use loopback on a remote HTTP host', () => {
  expect(getBrowserApiBaseURL("http://127.0.0.1:5001/api", { ...production, origin: "http://codeskill.example.test", protocol: "http:" })).toBe("/api");
});
