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

    res.once("end", clearDeadline)
    res.resume();
  });

  const deadline = setTimeout(() => {
    request.destroy(new Error("Health-check request timed out"));
  }, 10_000);
  const clearDeadline = () => clearTimeout(deadline);

  request.once("close", clearDeadline);

  request.on("error", (error) => {
    clearDeadline();
    console.error("Health-check request failed", error);
  });
});

export default job;