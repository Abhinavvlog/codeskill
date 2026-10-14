interface BrowserLocation {
  origin: string;
  hostname: string;
  protocol: string;
}

export function getBrowserApiBaseURL(configuredUrl: string | undefined, location: BrowserLocation): string {
  const baseUrl = configuredUrl?.trim();
  if (!baseUrl || baseUrl === "/api") return "/api";
  try {
    const endpoint = new URL(baseUrl, location.origin);
    const localHosts = ["localhost", "127.0.0.1", "[::1]", "::1"];
    if (!["http:", "https:"].includes(endpoint.protocol)
      || (location.protocol === "https:" && endpoint.protocol === "http:")
      || (localHosts.includes(endpoint.hostname) && !localHosts.includes(location.hostname))) return "/api";
    return baseUrl;
  } catch {
    return "/api";
  }
}
