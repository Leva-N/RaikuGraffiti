const ADMIN_DISCORD_IDS = new Set<string>(["406118319612231682"]);

export function isAdminDiscordId(discordId: string | null | undefined): boolean {
  if (!discordId) return false;
  return ADMIN_DISCORD_IDS.has(discordId);
}
