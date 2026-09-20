/**
 * The one SWR JSON fetcher (Slice 15). Ten components each declared
 * `const fetcher = (url) => fetch(url).then((r) => r.json())`, most without
 * checking `r.ok`, so a 500 parsed as JSON and reached the component as data.
 * This one throws on a non-2xx status so SWR surfaces `error` instead.
 */
export class FetchError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`Request to ${url} failed with ${status}`);
    this.name = "FetchError";
  }
}

export async function jsonFetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new FetchError(response.status, url);
  return (await response.json()) as T;
}
