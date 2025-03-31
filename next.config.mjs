/**
 * @typedef {import('next').NextConfig} NextConfig
 */

/**
 * Configuration options for the Next.js application.
 * This object manages the build and runtime behavior of Next.js.
 *
 * @type {NextConfig}
 */
const nextConfig = {
  /**
   * Enables React Strict Mode.
   * Helps identify potential problems in an application during development.
   * @see https://react.dev/reference/react/StrictMode
   */
  reactStrictMode: true,

  /**
   * Configures custom HTTP headers for incoming requests.
   * Useful for setting security headers, caching policies, etc.
   * @returns {Promise<Array<{source: string, headers: Array<{key: string, value: string}>}>>} A promise resolving to an array of header configuration objects.
   * @see https://nextjs.org/docs/app/api-reference/next-config-js/headers
   */
  async headers() {
    return [
      {
        // Apply these headers to all routes in the application.
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            // Define feature policies: disable camera, microphone, and geolocation by default.
            // Adjust if specific features are needed.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Controls DNS prefetching. 'off' can slightly improve privacy/security.
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          // Add other security headers as needed, e.g.,
          // {
          //   key: 'Strict-Transport-Security',
          //   value: 'max-age=63072000; includeSubDomains; preload', // Requires HTTPS setup
          // },
          // {
          //   key: 'Content-Security-Policy',
          //   value: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self';", // Example, needs careful configuration
          // },
        ],
      },
    ];
  },

  // No custom webpack configuration needed for MVP.
  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   // Note: Modify webpack config with caution.
  //   // return config
  // },

  // No specific environment variable exposure needed via `env` or `publicRuntimeConfig`.
  // Relying on standard `NEXT_PUBLIC_` prefix and .env file loading.
  // env: {},
};

export default nextConfig;