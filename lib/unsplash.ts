export async function fetchUnsplashPhoto(query: string): Promise<string> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return '';
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    const data = await res.json();
    return data.results?.[0]?.urls?.regular ?? '';
  } catch {
    return '';
  }
}
