const ADMIN_DISCORD_IDS = new Set<string>(["406118319612231682"]);

const GOLD_NICK_DISCORD_IDS = new Set<string>([
  "875985864113684480",
  "463762867884130314",
  "896941594903707649",
  "913080370751213599",
  "1373707963759464458",
  "922279901304852521",
  "1288890403864576062",
  "972180836185169940",
  "603543593046769664",
  "908348591574253568",
  "577384113657610250",
  "1071176875042406400",
  "258891805091823616",
  "942094045440798720",
  "1361926942705848412",
  "1089537106059210793",
  "236992897621164032",
  "486857947884814337",
]);

const GREEN_NICK_DISCORD_IDS = new Set<string>([
  "406118319612231682",
  "1100061023941165147",
]);

export function isAdminDiscordId(discordId: string | null | undefined): boolean {
  if (!discordId) return false;
  return ADMIN_DISCORD_IDS.has(discordId);
}

export function getNickColor(discordId: string | null | undefined): string | null {
  if (!discordId) return null;
  if (GOLD_NICK_DISCORD_IDS.has(discordId)) return "#d4af37";
  if (GREEN_NICK_DISCORD_IDS.has(discordId)) return "#008000";
  return null;
}
