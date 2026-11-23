const DEFAULT_API_URL = "https://api.escolaveli.com";

export function resolveApiMediaUrl(value?: string | null) {
  const source = value?.trim();
  if (!source) return null;

  if (source.startsWith("blob:") || source.startsWith("data:")) {
    return source;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;

  try {
    const apiUrl = new URL(apiBase);
    const mediaUrl = new URL(source, apiUrl.origin);

    if (mediaUrl.hostname === apiUrl.hostname && mediaUrl.protocol !== apiUrl.protocol) {
      mediaUrl.protocol = apiUrl.protocol;
    }

    return mediaUrl.toString();
  } catch {
    return source;
  }
}
