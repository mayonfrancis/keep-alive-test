import axios from "axios";
import { Agent as HttpsAgent } from "https";
import { Agent as HttpAgent } from "http";

const baseDomain = `local.example.com`;

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
  }
  console.timeEnd("sequentialKeepAlive");
  httpAgent.destroy();
  httpsAgent.destroy();
}

async function parallelNormal(count, useHttps) {
  console.time("parallelNormal");
  const normalPromises = [];
  for (let i = 0; i < count; i++) {
    normalPromises.push(
      axios.get(`${useHttps ? "https://" : "http://"}${baseDomain}`)
    );
  }
  await Promise.all(normalPromises);
  console.timeEnd("parallelNormal");
}

async function parallelKeepAlive(count, maxSockets, useHttps) {
  const { commonInstance, httpAgent, httpsAgent } = getAxiosClient(
    maxSockets,
    useHttps
  );

  console.time("parallelKeepAlive");
  const keepAlivePromises = [];
  for (let i = 0; i < count; i++) {
    keepAlivePromises.push(commonInstance.get());
  }
  await Promise.all(keepAlivePromises);
  console.timeEnd("parallelKeepAlive");
  httpAgent.destroy();
  httpsAgent.destroy();
}

async function run(count, maxSockets, useHttps) {
  console.log("\n\n##################");
  console.log(
    `Request Count: ${count}. Max Sockets for keep alive: ${maxSockets}`
  );
  await sequentialNormal(count, useHttps);
  await sequentialKeepAlive(count, maxSockets, useHttps);
  await parallelNormal(count, useHttps);
  await parallelKeepAlive(count, maxSockets, useHttps);
}

export async function test1Main(useHttps) {
  console.log();
  console.log("Using HTTPS: ", useHttps);
  await run(10000, undefined, useHttps);
  await run(10000, 100, useHttps);
  await run(1000, undefined, useHttps);
  await run(100, undefined, useHttps);
}

