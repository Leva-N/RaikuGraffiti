/**
 * Список драконов (изображения из public/images).
 * URL для отображения: getDragonUrl(filename) => "/images/" + encodeURIComponent(filename)
 */
export const DRAGON_FILENAMES = [
  "20260212_2326_Image Generation_remix_01kh9n3630ft3a6jmvmjskerr1.png",
  "20260212_2234_Image Generation_remix_01kh9j3jp3emc9d044vaketv2k.png",
  "20260212_2240_Милый воздушный поцелуй_remix_01kh9jefjzfvm82jjz3rej5d69.png",
  "20260212_2306_Image Generation_remix_01kh9kxxjmfxtvgmcyjmjmj3kt.png",
  "20260212_2310_Удивленный дракон_remix_01kh9m4n4ef0j85dxq7q7fxpt3.png",
] as const;

export function getDragonUrl(filename: string): string {
  return "/images/" + encodeURIComponent(filename);
}

export const DRAGON_URLS: string[] = DRAGON_FILENAMES.map(getDragonUrl);

export function isAllowedDragonUrl(url: string): boolean {
  try {
    const decoded = decodeURIComponent(url);
    if (!decoded.startsWith("/images/")) return false;
    const name = decoded.slice("/images/".length);
    return DRAGON_FILENAMES.includes(name as (typeof DRAGON_FILENAMES)[number]);
  } catch {
    return false;
  }
}
