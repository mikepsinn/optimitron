import { getLatestUploadCid, retrieveStoredSnapshot, type StorachaListClient } from './client.js';

export async function getLatest(
  client: StorachaListClient,
): Promise<string | null> {
  return getLatestUploadCid(client);
}

export async function getHistory(
  latestCid: string,
  depth: number,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const history: string[] = [];
  let currentCid: string | undefined = latestCid;

  while (currentCid && history.length < depth) {
    history.push(currentCid);
    const snapshot = await retrieveStoredSnapshot(currentCid, fetchImpl);
    currentCid = snapshot.previousCid;
  }

  return history;
}
