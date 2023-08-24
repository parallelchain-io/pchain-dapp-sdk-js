import { TimeoutError } from "../error";

export const poll = async <T>(
  pollingMaxNumber: number,
  pollingIntervalMs: number,
  needsPollingFunc: () => Promise<T>,
  isDoneFunc: (data: T) => boolean
): Promise<T> => {
  let count = 0;

  while (count < pollingMaxNumber) {
    const result = await needsPollingFunc();
    if (isDoneFunc(result)) {
      return result;
    }
    await sleep(pollingIntervalMs);
    count += 1;
  }

  throw new TimeoutError("Exceeded maximum polling attempts");
};

export const retryExponentialBackoff = async <T>(
  retryMaxNumber: number,
  retryIntervalMs: number,
  retryBackoffMultiplier: number,
  retriableFunc: () => Promise<T | null>
) => {
  let intervalMs = retryIntervalMs;

  for (let count = 0; count < retryMaxNumber; count++) {
    const result = await retriableFunc();
    if (result !== null) {
      return result;
    }
    await sleep(intervalMs);
    intervalMs *= retryBackoffMultiplier;
  }

  throw new TimeoutError("Exceed maximum retries");
};

export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
