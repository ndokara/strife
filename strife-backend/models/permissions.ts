//TODO: differentiate guild and channel permissions: f.e. ban channel member =/ ban guild member
export const Permission = {
  // Super / Global
  ADMINISTRATOR:           1n << 0n,

  // Guild management
  MANAGE_GUILD:            1n << 1n,
  VIEW_AUDIT_LOG:          1n << 2n,
  VIEW_GUILD_INSIGHTS:     1n << 3n,
  MANAGE_ROLES:            1n << 4n,
  MANAGE_CHANNELS:         1n << 5n,
  MANAGE_WEBHOOKS:         1n << 6n,
  MANAGE_INTEGRATIONS:     1n << 7n,
  MANAGE_EXPRESSIONS:      1n << 8n,
  MANAGE_NICKNAMES:        1n << 9n,
  CHANGE_NICKNAME:         1n << 10n,
  MANAGE_EVENTS:           1n << 11n,
  MANAGE_INVITES:          1n << 12n,
  CREATE_INVITES:          1n << 13n,

  // Member moderation
  KICK_MEMBERS:            1n << 14n,
  BAN_MEMBERS:             1n << 15n,
  TIMEOUT_MEMBERS:         1n << 16n,

  // Channel visibility & admin
  VIEW_CHANNEL:            1n << 17n,
  MANAGE_CHANNEL:          1n << 18n,
  MANAGE_CHANNEL_PERMS:    1n << 19n,
  MANAGE_CHANNEL_WEBHOOKS: 1n << 20n,

  // Text messaging
  SEND_MESSAGES:           1n << 21n,
  MANAGE_MESSAGES:         1n << 22n,
  READ_MESSAGE_HISTORY:    1n << 23n,
  ADD_REACTIONS:           1n << 24n,
  USE_EXTERNAL_EMOJIS:     1n << 25n,
  USE_EXTERNAL_STICKERS:   1n << 26n,
  EMBED_LINKS:             1n << 27n,
  ATTACH_FILES:            1n << 28n,
  MENTION_EVERYONE:        1n << 29n,
  USE_APPLICATION_CMDS:    1n << 30n,
  PIN_MESSAGES:            1n << 31n,
  BYPASS_SLOWMODE:         1n << 32n,

  // Threads
  CREATE_PUBLIC_THREADS:   1n << 33n,
  CREATE_PRIVATE_THREADS:  1n << 34n,
  MANAGE_THREADS:          1n << 35n,
  SEND_IN_THREADS:         1n << 36n,

  // Voice / Stage
  CONNECT:                 1n << 37n,
  SPEAK:                   1n << 38n,
  VIDEO:                   1n << 39n,
  USE_VAD:                 1n << 40n,
  PRIORITY_SPEAKER:        1n << 41n,
  STREAM:                  1n << 42n,
  MUTE_MEMBERS:            1n << 43n,
  DEAFEN_MEMBERS:          1n << 44n,
  MOVE_MEMBERS:            1n << 45n,
  REQUEST_TO_SPEAK:        1n << 46n,
  MANAGE_STAGE:            1n << 47n,
};

export type PermissionKey = keyof typeof Permission;            // "ADMINISTRATOR" | "MANAGE_GUILD" | ...
export type PermissionValue = typeof Permission[PermissionKey]; // bigint

// Utility to normalize inputs (string | bigint)
export function normalize(permissions: string | bigint): bigint {
  return typeof permissions === 'string' ? BigInt(permissions) : permissions;
}

export function addPermission(
  permissions: string | bigint,
  perm: PermissionValue
): bigint {
  return normalize(permissions) | perm;
}

export function removePermission(
  permissions: string | bigint,
  perm: PermissionValue
): bigint {
  return normalize(permissions) & ~perm;
}

export function hasPermission(
  permissions: string | bigint,
  perm: PermissionValue
): boolean {
  return (normalize(permissions) & perm) === perm;
}

export function togglePermission(
  permissions: string | bigint,
  perm: PermissionValue
): bigint {
  return normalize(permissions) ^ perm;
}

// Convert permissions bigint to an array of Permission names
export function listPermissions(permissions: string | bigint): string[] {
  const perms = normalize(permissions);
  return Object.entries(Permission)
    .filter(([, value]) => typeof value === 'bigint' && (perms & (value as bigint)) !== 0n)
    .map(([key]) => key);
}
