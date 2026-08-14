import { CronJob } from "cron";
import http from "node:http";
import https from "node:https";

// every 14 minutes send a GET request to the health endpoint
const job = new CronJob("*/14 * * * *", function () {

  const base = process.env.API_URL;
  if (!base) return;
  const url = new URL("/health", base).href;
  const client = url.startsWith("https:") ? https : http;

  const request = client.get(url, (res) => {
    if (res.statusCode === 200) console.log("GET request sent successfully");
    else console.log("GET request failed", res.statusCode);

    res.resume();
  });

  request.setTimeout(10_000, () => {
    request.destroy(new Error("Health-check request timed out"));
  });
  request.on("error", (e) => console.error("Error while sending request", e));
});

export default job;