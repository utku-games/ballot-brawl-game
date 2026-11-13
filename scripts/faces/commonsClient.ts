/**
 * Wikimedia Commons access for the face pipeline: file metadata (licence, author, page) and cached downloads.
 * Requests are paced and retried with backoff on HTTP 429, as Wikimedia asks of automated clients.
 * A generic user agent is sent so no personal or project details leave the machine.
 */
import { existsSync, writeFileSync } from 'node:fs';
import type { CommonsMeta } from './faceRules.ts';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'face-fetch-script/0.1';
const DOWNLOAD_WIDTH = 1200;
const REQUEST_GAP_MS = 1500;
const RETRY_BACKOFF_MS = 10000;
const MAX_ATTEMPTS = 6;
const HTTP_TOO_MANY_REQUESTS = 429;

export class CommonsError extends Error {}

export interface ImageInfo {
  meta: CommonsMeta;
  downloadUrl: string;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await sleep(REQUEST_GAP_MS);
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok) return response;
    if (response.status !== HTTP_TOO_MANY_REQUESTS) throw new CommonsError(`${response.status} for ${url}`);
    await sleep(RETRY_BACKOFF_MS * attempt);
  }
  throw new CommonsError(`Rate limited: ${url}`);
}

type InfoBody = {
  query: { pages: Record<string, { imageinfo?: Array<{ thumburl?: string; url: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }> }> };
};

export async function imageInfo(file: string): Promise<ImageInfo> {
  const params = new URLSearchParams({
    action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata',
    iiurlwidth: String(DOWNLOAD_WIDTH), format: 'json',
  });
  const body = (await (await request(`${COMMONS_API}?${params}`)).json()) as InfoBody;
  const info = Object.values(body.query.pages)[0]?.imageinfo?.[0];
  if (!info) throw new CommonsError(`No Commons file named ${file}`);
  const m = info.extmetadata;
  return {
    downloadUrl: info.thumburl ?? info.url,
    meta: {
      license: m.LicenseShortName?.value ?? '',
      licenseUrl: m.LicenseUrl?.value ?? '',
      artist: m.Artist?.value ?? '',
      pageUrl: info.descriptionurl,
    },
  };
}

/** Downloads the image to `path` unless it is already cached there. */
export async function downloadOnce(url: string, path: string): Promise<void> {
  if (!existsSync(path)) writeFileSync(path, Buffer.from(await (await request(url)).arrayBuffer()));
}
