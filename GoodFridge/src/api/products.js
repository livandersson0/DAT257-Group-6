const API_KEY = import.meta.env.VITE_SERPAPI_KEY;

export async function searchProducts(query) {
  const params = new URLSearchParams({
    engine: 'google_images',
    q: query,
    google_domain: 'google.se',
    hl: 'sv',
    gl: 'se',
    num: '1',
    api_key: API_KEY,
  });

  const res = await fetch(`/serpapi/search?${params}`);
  const data = await res.json();
  console.log('SerpApi svar:', data);

  const firstImage = data.images_results?.[0]?.thumbnail;
  return firstImage ? [{ image: firstImage }] : [];
}