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
  "20260212_2335_Image Generation_remix_01kh9nk3a5efjs9bzdx71568x1.png",
  "20260214_1405_Image Generation_remix_01khdsr3jyfhwr96j5nr5a4rbv.png",
  "20260214_1405_Image Generation_remix_01khdsr3jzej5twrc6xw5pfzv2.png",
  "20260214_1407_Эмоция дракончика_remix_01khdswh18ezaa4b8qrzppnn2j.png",
  "20260214_1408_Эмоциональный дракон_remix_01khdsyg0hee6bmsqy9a6sh7xs.png",
  "20260214_1414_Image Generation_remix_01khdt8kx9e94vkq0yfty8p9a0.png",
  "20260214_1424_Image Generation_remix_01khdtsgjtfxabx7gcgrm1r4zs.png",
  "20260214_1428_Image Generation_remix_01khdv3kwxe4gr120p0q2bbp0j.png",
  "20260214_1432_Дракон с сердцем_remix_01khdv7p13fvbtfd2mzr5ss12d.png",
  "20260214_1436_Image Generation_remix_01khdvh73vfpy970n9r9afr399.png",
  "20260214_1440_Image Generation_remix_01khdvpz5yf589ej7sdnxnpe4n.png",
  "20260214_1449_Image Generation_remix_01khdw8k9aejzvn16ymj602cjt.png",
  "20260214_1452_Image Generation_remix_01khdwcn7we2frvt9tm06wc0d2.png",
  "20260214_1455_Image Generation_remix_01khdwk6nefc5te2brkzdh18ja.png",
  "20260214_1457_Image Generation_remix_01khdwpwa5emtafwakpq9ds8wg.png",
  "20260214_1508_Image Generation_remix_01khdxa21rfctr6jkw6t9na61g.png",
  "20260214_1511_Image Generation_remix_01khdxgc6cfs4bjq03s35hyzpj.png",
  "20260214_1516_Image Generation_remix_01khdxr0nvegrt2dgr6qtwe1hy.png",
  "20260214_1517_Image Generation_remix_01khdxwd23fg3ab0647anwwr49.png",
  "20260214_1519_Image Generation_remix_01khdxypbqfzsbqrfcg1s1z47z.png",
  "20260214_1526_Image Generation_remix_01khdyaptseb4ah0hfc9pewgkt.png",
  "20260214_1528_Image Generation_remix_01khdyfjpefexsgrjehebz7mm9.png",
  "20260214_1528_Image Generation_remix_01khdyfjpff0tt3vrgynqbf0t3.png",
  "20260214_1535_Image Generation_remix_01khdyx0nqe75rba8wgeaherdv.png",
  "20260214_1537_Дракон-пожарный с сердцем_remix_01khdz0pr5faprvksh2km0bs00.png",
  "20260214_1538_Image Generation_remix_01khdz3g1hf60a7txf59ac9hnz.png",
  "20260214_1540_Image Generation_remix_01khdz61t3eed8c42ews0pz2rs.png",
  "20260214_1541_Image Generation_remix_01khdz9hhhepws3netrarkeets.png",
  "20260214_1543_Image Generation_remix_01khdzbf19fpsa7z7qv4j6djv2.png",
  "20260214_1726_Image Generation_remix_01khe57xp6fwks8567g076zvc4.png",
  "ChatGPT Image 14 февр. 2026 г., 18_00_12.png",
  "ChatGPT Image 14 февр. 2026 г., 18_06_22.png",
  "ChatGPT Image 14 февр. 2026 г., 18_19_06.png",
  "ChatGPT Image 14 февр. 2026 г., 18_22_34.png",
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
