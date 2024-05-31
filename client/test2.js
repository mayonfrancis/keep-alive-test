import axios from "axios";
import { Agent as HttpsAgent } from "https";
import { Agent as HttpAgent } from "http";

const baseDomain = `local.example.com`;
async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function getAxiosClient(maxSockets, useHttps) {
  const httpAgent = new HttpAgent({
    keepAlive: true,
    maxSockets,
  });
  const httpsAgent = new HttpsAgent({
    keepAlive: true,
    maxSockets,
  });
  const commonInstance = axios.create({
    baseURL: `${useHttps ? "https://" : "http://"}${baseDomain}`,
    httpAgent: httpAgent,
    httpsAgent: httpsAgent,
  });

  return {
    commonInstance,
    httpAgent,
    httpsAgent,
  };
}

async function sequentialNormal(count, useHttps) {
  console.time("sequentialNormal");
  for (let i = 0; i < count; i++) {
    await axios.get(`${useHttps ? "https://" : "http://"}${baseDomain}`);
    sleep(10);
  }
  console.timeEnd("sequentialNormal");
}

async function sequentialKeepAlive(count, maxSockets, useHttps) {
  const { commonInstance, httpAgent, httpsAgent } = getAxiosClient(
    maxSockets,
    useHttps
  );
  console.time("sequentialKeepAlive");
  for (let i = 0; i < count; i++) {
    await commonInstance.get();
    sleep(10);
  }
  console.timeEnd("sequentialKeepAlive");
  httpAgent.destroy();
  httpsAgent.destroy();
}

export async function test2Main(useHttps) {
  console.log();
  console.log("Using HTTPS: ", useHttps);
  await sequentialNormal(10000, useHttps);
  console.log("max sockets: ", undefined);
  await sequentialKeepAlive(10000, undefined, useHttps);

  console.log("max sockets: ", 100);
  await sequentialKeepAlive(10000, 100, useHttps);
}
