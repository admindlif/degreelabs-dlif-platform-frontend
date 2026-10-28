export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    if (process.env.NODE_ENV === "production") {
      const parsed = new URL(configured);
      if (
        parsed.protocol !== "https:" ||
        /^(localhost|.*\.localhost|127(?:\.\d+){3}|\[::1\]|0\.0\.0\.0)$/i.test(parsed.hostname) ||
        parsed.username || parsed.password || parsed.search || parsed.hash
      ) {
        throw new Error("NEXT_PUBLIC_API_URL must be a deployed HTTPS backend URL in production.");
      }
    }
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    // Keep existing local setups working while adopting NEXT_PUBLIC_API_URL.
    return (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (typeof window === "undefined" ? process.env.API_BASE_URL : undefined) ||
      "http://localhost:8000"
    ).replace(/\/+$/, "");
  }

  throw new Error("NEXT_PUBLIC_API_URL must be configured in production.");
}
