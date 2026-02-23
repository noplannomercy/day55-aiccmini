import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from trying to bundle Node.js-native packages into the
  // browser or Edge Runtime bundles.  The postgres driver (used by Drizzle ORM)
  // uses built-ins such as `fs`, `net`, `tls`, and `perf_hooks` which are only
  // available in a standard Node.js environment (i.e. API Route handlers and
  // Server Components running under the Node.js runtime).
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
