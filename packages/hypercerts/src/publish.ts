import { Agent, AtpAgent, type ComAtprotoRepoCreateRecord } from '@atproto/api';
import {
  JoseKey,
  NodeOAuthClient,
  type NodeOAuthClientOptions,
} from '@atproto/oauth-client-node';
import { HypercertRecordSchema, type HypercertRecord } from './types.js';

export interface AtprotoRecordRef {
  uri: string;
  cid: string;
}

export interface AtprotoRecordPublisher {
  createRecord(input: {
    repo: string;
    collection: string;
    record: HypercertRecord;
    rkey?: string;
  }): Promise<AtprotoRecordRef>;
}

export interface AppPasswordLoginInput {
  service: string;
  identifier: string;
  password: string;
}

type ImportableJoseKey = Parameters<typeof JoseKey.fromImportable>[0];

export function createAtprotoPublisher(
  agent: Pick<Agent, 'com'>,
): AtprotoRecordPublisher {
  return {
    async createRecord({ repo, collection, record, rkey }) {
      const response = await agent.com.atproto.repo.createRecord({
        repo,
        collection,
        record,
        rkey,
      });
      return {
        uri: response.data.uri,
        cid: response.data.cid,
      };
    },
  };
}

export async function createAppPasswordAgent(
  input: AppPasswordLoginInput,
): Promise<AtpAgent> {
  const agent = new AtpAgent({ service: input.service });
  await agent.login({
    identifier: input.identifier,
    password: input.password,
  });
  return agent;
}

export function createNodeOAuthClient(
  options: NodeOAuthClientOptions,
): NodeOAuthClient {
  return new NodeOAuthClient(options);
}

export async function beginOAuthLogin(
  client: Pick<NodeOAuthClient, 'authorize'>,
  handleOrServer: string,
  options: { state?: string; signal?: AbortSignal } = {},
): Promise<string> {
  const url = await client.authorize(handleOrServer, options);
  return String(url);
}

export async function completeOAuthLogin(
  client: Pick<NodeOAuthClient, 'callback'>,
  params: URLSearchParams,
): Promise<{ agent: Agent; did: string; state: string | undefined }> {
  const { session, state } = await client.callback(params);
  return {
    agent: new Agent(session),
    did: session.did,
    state: state ?? undefined,
  };
}

export async function restoreOAuthAgent(
  client: Pick<NodeOAuthClient, 'restore'>,
  did: string,
): Promise<Agent> {
  const session = await client.restore(did);
  return new Agent(session);
}

export async function importJoseKey(
  key: ImportableJoseKey,
  kid: string,
): Promise<JoseKey> {
  return JoseKey.fromImportable(key, kid);
}

export async function publishRecord(
  publisher: AtprotoRecordPublisher,
  repo: string,
  record: HypercertRecord,
  options: { rkey?: string } = {},
): Promise<AtprotoRecordRef> {
  const parsed = HypercertRecordSchema.parse(record);
  return publisher.createRecord({
    repo,
    collection: parsed.$type,
    record: parsed,
    rkey: options.rkey,
  });
}

export async function publishRecords(
  publisher: AtprotoRecordPublisher,
  repo: string,
  records: HypercertRecord[],
): Promise<AtprotoRecordRef[]> {
  const published: AtprotoRecordRef[] = [];
  for (const record of records) {
    published.push(await publishRecord(publisher, repo, record));
  }
  return published;
}

export type CreateRecordInput = ComAtprotoRepoCreateRecord.InputSchema;
