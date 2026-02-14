/**
 * Список драконов (изображения из public/images).
 * URL для отображения: getDragonUrl(filename) => "/images/" + encodeURIComponent(filename)
 */
export const DRAGON_FILENAMES = [
  "20260212_2326_Image Generation_remix_01kh9n3630ft3a6jmvmjskerr1.avif",
  "20260212_2234_Image Generation_remix_01kh9j3jp3emc9d044vaketv2k.avif",
  "20260212_2240_Милый воздушный поцелуй_remix_01kh9jefjzfvm82jjz3rej5d69.avif",
  "20260212_2306_Image Generation_remix_01kh9kxxjmfxtvgmcyjmjmj3kt.avif",
  "20260212_2310_Удивленный дракон_remix_01kh9m4n4ef0j85dxq7q7fxpt3.avif",
  "20260212_2335_Image Generation_remix_01kh9nk3a5efjs9bzdx71568x1.avif",
  "20260214_1405_Image Generation_remix_01khdsr3jyfhwr96j5nr5a4rbv.avif",
  "20260214_1405_Image Generation_remix_01khdsr3jzej5twrc6xw5pfzv2.avif",
  "20260214_1407_Эмоция дракончика_remix_01khdswh18ezaa4b8qrzppnn2j.avif",
  "20260214_1408_Эмоциональный дракон_remix_01khdsyg0hee6bmsqy9a6sh7xs.avif",
  "20260214_1414_Image Generation_remix_01khdt8kx9e94vkq0yfty8p9a0.avif",
  "20260214_1424_Image Generation_remix_01khdtsgjtfxabx7gcgrm1r4zs.avif",
  "20260214_1428_Image Generation_remix_01khdv3kwxe4gr120p0q2bbp0j.avif",
  "20260214_1432_Дракон с сердцем_remix_01khdv7p13fvbtfd2mzr5ss12d.avif",
  "20260214_1436_Image Generation_remix_01khdvh73vfpy970n9r9afr399.avif",
  "20260214_1440_Image Generation_remix_01khdvpz5yf589ej7sdnxnpe4n.avif",
  "20260214_1449_Image Generation_remix_01khdw8k9aejzvn16ymj602cjt.avif",
  "20260214_1452_Image Generation_remix_01khdwcn7we2frvt9tm06wc0d2.avif",
  "20260214_1455_Image Generation_remix_01khdwk6nefc5te2brkzdh18ja.avif",
  "20260214_1457_Image Generation_remix_01khdwpwa5emtafwakpq9ds8wg.avif",
  "20260214_1508_Image Generation_remix_01khdxa21rfctr6jkw6t9na61g.avif",
  "20260214_1511_Image Generation_remix_01khdxgc6cfs4bjq03s35hyzpj.avif",
  "20260214_1516_Image Generation_remix_01khdxr0nvegrt2dgr6qtwe1hy.avif",
  "20260214_1517_Image Generation_remix_01khdxwd23fg3ab0647anwwr49.avif",
  "20260214_1519_Image Generation_remix_01khdxypbqfzsbqrfcg1s1z47z.avif",
  "20260214_1526_Image Generation_remix_01khdyaptseb4ah0hfc9pewgkt.avif",
  "20260214_1528_Image Generation_remix_01khdyfjpefexsgrjehebz7mm9.avif",
  "20260214_1528_Image Generation_remix_01khdyfjpff0tt3vrgynqbf0t3.avif",
  "20260214_1535_Image Generation_remix_01khdyx0nqe75rba8wgeaherdv.avif",
  "20260214_1537_Дракон-пожарный с сердцем_remix_01khdz0pr5faprvksh2km0bs00.avif",
  "20260214_1538_Image Generation_remix_01khdz3g1hf60a7txf59ac9hnz.avif",
  "20260214_1540_Image Generation_remix_01khdz61t3eed8c42ews0pz2rs.avif",
  "20260214_1541_Image Generation_remix_01khdz9hhhepws3netrarkeets.avif",
  "20260214_1543_Image Generation_remix_01khdzbf19fpsa7z7qv4j6djv2.avif",
  "20260214_1726_Image Generation_remix_01khe57xp6fwks8567g076zvc4.avif",
  "ChatGPT Image 14 февр. 2026 г., 18_00_12.avif",
  "ChatGPT Image 14 февр. 2026 г., 18_06_22.avif",
  "ChatGPT Image 14 февр. 2026 г., 18_19_06.avif",
  "ChatGPT Image 14 февр. 2026 г., 18_22_34.avif",
] as const;

export function getDragonUrl(filename: string): string {
  return "/images/" + encodeURIComponent(filename);
}

export function migrateDragonImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("/images/")) return trimmed;

  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/images/")) return trimmed;
    const filename = decoded.slice("/images/".length);
    if (!filename.toLowerCase().endsWith(".png")) return trimmed;

    const avifName = filename.replace(/\.png$/i, ".avif");
    if (DRAGON_FILENAMES.includes(avifName as (typeof DRAGON_FILENAMES)[number])) {
      return getDragonUrl(avifName);
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

export const DRAGON_URLS: string[] = DRAGON_FILENAMES.map(getDragonUrl);

export function isAllowedDragonUrl(url: string): boolean {
  try {
    const decoded = decodeURIComponent(migrateDragonImageUrl(url));
    if (!decoded.startsWith("/images/")) return false;
    const name = decoded.slice("/images/".length);
    return DRAGON_FILENAMES.includes(name as (typeof DRAGON_FILENAMES)[number]);
  } catch {
    return false;
  }
}
