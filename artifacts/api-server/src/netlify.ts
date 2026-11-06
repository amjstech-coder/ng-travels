import serverless from "serverless-http";
import app from "./app.js";

// Netlify rewrites /api/* to /.netlify/functions/api/api/*, so strip the function prefix.
export const handler = serverless(app, { basePath: "/.netlify/functions/api" });
