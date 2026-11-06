// Netlify scheduled function: replaces the Vercel cron in vercel.json.
// Calls the API's cron endpoint, which requires CRON_SECRET to be set.
export default async () => {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const res = await fetch(`${base}/api/cron/cleanup-trip-images`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log("cleanup-trip-images:", res.status, await res.text());
};

export const config = { schedule: "0 3 * * *" };
