export function decodeBody(text: string, contentType: string | null): unknown {
  if (text === '') return null;
  if (contentType?.toLowerCase().includes('json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}
