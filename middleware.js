/**
 * Vercel Edge Middleware: per-request CSP with a random style nonce.
 * - style-src no longer uses broad 'unsafe-inline' (tighter XSS surface for injected <style>).
 * - style-src-attr 'unsafe-inline' is required for React inline style={...} (cannot attach CSP nonces to DOM style props).
 * - Linked / same-origin stylesheets + fonts.googleapis.com remain allowed; optional <style nonce="..."> is supported.
 *
 * Local `vite` / `vite preview` do not run this file — only Vercel deployments.
 */
import { next } from '@vercel/edge';

function buildCsp(styleNonce) {
  // Strip characters that could break the CSP header value if ever maliciously influenced
  const n = styleNonce.replace(/['";]/g, '');
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `style-src-elem 'self' 'nonce-${n}' https://fonts.googleapis.com`,
    "style-src-attr 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:*",
    'upgrade-insecure-requests',
  ].join('; ');
}

function randomStyleNonce() {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  let bin = '';
  for (let i = 0; i < buf.length; i += 1) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

export default function middleware() {
  const styleNonce = randomStyleNonce();
  return next({
    headers: {
      'Content-Security-Policy': buildCsp(styleNonce),
    },
  });
}

export const config = {
  matcher: '/:path*',
};
