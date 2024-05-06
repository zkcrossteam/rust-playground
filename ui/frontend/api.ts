import * as z from 'zod';

// const host = 'https://play.rust-lang.org'
const host = 'https://play.zkcross.org'
const node_host = process.env.REACT_APP_NODE_HOST;
export const routes = {
  compile: `${host}/compile`,
  execute:  `${host}/execute`,
  format: `${host}/format`,
  clippy: `${host}/clippy`,
  miri: `${host}/miri`,
  macroExpansion:  `${host}/macro-expansion`,
  meta: {
    crates: `${host}/meta/crates`,
    versions:  `${host}/meta/versions`,
    gistSave: `${host}/meta/gist`,
    gistLoad: `${host}/meta/gist/id`,
  },
  uploadWasm: `${node_host}`,
};

type FetchArg = Parameters<typeof fetch>[0];

export function jsonGet(url: FetchArg): Promise<unknown> {
  return fetchJson(url, {
    method: 'get',
  });
}

export function jsonPost(url: FetchArg, body: Record<string, any>): Promise<unknown> {
  return fetchJson(url, {
    method: 'post',
    body: JSON.stringify(body),
  });
}

const ErrorResponse = z.object({
  error: z.string(),
});
type ErrorResponse = z.infer<typeof ErrorResponse>;

async function fetchJson(url: FetchArg, args: RequestInit) {
  const headers = new Headers(args.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...args, headers });
  const body = await response.json();

  if (response.ok) {
    // HTTP 2xx
    return body;
  } else {
    // HTTP 4xx, 5xx (e.g. malformed JSON request)
    const error = await ErrorResponse.parseAsync(body);
    throw new Error(`The server reported an error: ${error.error}`);
  }
}
