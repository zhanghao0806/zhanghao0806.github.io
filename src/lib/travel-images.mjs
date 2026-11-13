export function imageKitUrl(src) {
  const url = URL.parse(src);
  return url?.origin === 'https://ik.imagekit.io' && !url.username && !url.password
    ? url
    : undefined;
}

export function travelCoverUrl(src) {
  const url = imageKitUrl(src);
  if (!url) return src;

  url.searchParams.set('tr', 'w-800,h-480,q-85,f-auto');
  return url.href;
}
