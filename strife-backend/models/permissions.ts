export const Permission = {
  // SUPER / GLOBAL
  ADMINISTRATOR:           1n << 0n,

  // GUILD MANAGEMENT
  MANAGE_GUILD:            1n << 1n,
  MANAGE_ROLES:            1n << 2n,
  MANAGE_CHANNELS:         1n << 3n,
  MANAGE_WEBHOOKS:         1n << 4n,
  MANAGE_INTEGRATIONS:     1n << 5n,
  MANAGE_NICKNAMES:        1n << 6n,
  MANAGE_EVENTS:           1n << 7n,
  MANAGE_INVITES:          1n << 8n,

  // MEMBER MODERATION
  KICK_MEMBERS:            1n << 9n,
  BAN_MEMBERS:             1n << 10n,
  TIMEOUT_MEMBERS:         1n << 11n,

  // CHANNEL MANAGEMENT
  MANAGE_CHANNEL:          1n << 12n,
  MANAGE_CHANNEL_ROLES:    1n << 13n,
  MANAGE_CHANNEL_WEBHOOKS: 1n << 14n,

  // CHANNEL CREATION
  CREATE_PUBLIC_CHANNELS:  1n << 15n,
  CREATE_PRIVATE_CHANNELS: 1n << 16n,

  // TEXT MESSAGING
  SEND_MESSAGES:           1n << 17n,
  CHANNEL_SEND_MESSAGES:   1n << 18n,
  ADD_REACTIONS:           1n << 19n,
  CHANNEL_ADD_REACTIONS:   1n << 20n,
  USE_EXTERNAL_EMOJIS:     1n << 21n,
  USE_EXTERNAL_STICKERS:   1n << 22n,
  EMBED_LINKS:             1n << 23n,
  ATTACH_FILES:            1n << 24n,
  MENTION_EVERYONE:        1n << 25n,
  USE_APPLICATION_CMDS:    1n << 26n,
  PIN_MESSAGES:            1n << 27n,
  CHANNEL_PIN_MESSAGES:    1n << 28n,

  // VOICE
  CONNECT:                 1n << 29n,
  CHANNEL_CONNECT:         1n << 30n,
  SPEAK:                   1n << 31n,
  CHANNEL_SPEAK:           1n << 32n,
  VIDEO:                   1n << 33n,
  STREAM:                  1n << 34n,
  MUTE_MEMBERS:            1n << 35n,
  DEAFEN_MEMBERS:          1n << 36n,
};


export const PermissionKeys: string[] = Object.keys(Permission);

export const ALL_PERMISSIONS = Object.values(Permission)
  .reduce((acc, perm) => acc | perm, 0n);

export type PermissionKey = keyof typeof Permission;            // "ADMINISTRATOR" | "MANAGE_GUILD" | ...
export type PermissionValue = typeof Permission[PermissionKey]; // bigint

// Utility to normalize inputs (string | bigint)
export function normalize(permissions: string | bigint): bigint {
  return typeof permissions === 'string' ? BigInt(permissions) : permissions;
}
export function validatePermissionKeys(keys: string []): void{
  const invalidKeys = keys.filter(k => !(PermissionKeys).includes(k as PermissionKey));
  if(invalidKeys.length > 0)
    throw new Error(`Invalid permission keys: ${invalidKeys.join(', ')}`);
}
