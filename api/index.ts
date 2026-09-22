import app from "../src/app.js";

/**
 * Vercel Serverless Function entry point.
 *
 * Vercel's Node runtime imports this module and uses the default export as the
 * request handler. Every incoming request is routed here by the catch-all
 * rewrite in `vercel.json`, while the original path (e.g. `/api/places`) is
 * preserved so the Express router can match it normally.
 *
 * `src/index.ts` (which calls `app.listen`) must NOT be imported here: a
 * serverless function must never bind a port.
 */
export default app;
