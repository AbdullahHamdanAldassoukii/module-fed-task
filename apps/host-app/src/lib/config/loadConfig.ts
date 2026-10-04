import { ConfigError } from '../errors';
import { appConfigSchema, type AppConfig } from './schema';

export type FetchJson = (url: string) => Promise<unknown>;

export async function loadConfig(fetchJson: FetchJson, url = '/config.json'): Promise<AppConfig> {
  let raw: unknown;
  try {
    raw = await fetchJson(url);
  } catch (cause) {
    throw new ConfigError(`Could not load ${url}`, { cause });
  }

  const parsed = appConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new ConfigError(`Invalid ${url}: ${issues}`, { cause: parsed.error });
  }
  return parsed.data;
}
