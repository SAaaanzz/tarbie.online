import { createMiddleware } from 'hono/factory';
import type { HonoEnv } from '../env.js';

export const corsMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const origin = c.req.header('Origin') ?? '';
  const appUrl = c.env.APP_URL ?? '';
  const allowedOrigins = [appUrl, 'https://tarbie.online', 'http://localhost:5173'].filter(Boolean);
  
  const isAllowed = allowedOrigins.includes(origin);
  const allowOrigin = isAllowed && origin ? origin : (allowedOrigins[0] ?? '*');

  if (c.req.method === 'OPTIONS') {
    c.header('Access-Control-Allow-Origin', allowOrigin);
    c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Max-Age', '86400');
    return c.body(null, 204);
  }

  await next();

  c.res.headers.set('Access-Control-Allow-Origin', allowOrigin);
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
});
