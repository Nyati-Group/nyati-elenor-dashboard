// Vercel serverless function: serves every /api/* route (see vercel.json rewrites).
// The static React app in dist/ is served directly by Vercel's CDN.
import { createApp } from '../server/app.js';

const app = createApp();

export default app;
