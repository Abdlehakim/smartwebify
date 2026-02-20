// src/constants/permissions.ts
export const PERMISSIONS = {
  /* MANAGE_DASHBOARD_USERS: 'M_Access', */
  MANAGE_Access: 'M_Access',
  MANAGE_WebsiteData: 'M_WebsiteData',
  MANAGE_Stock: 'M_Stock',
  MANAGE_Blog: 'M_Blog',
  MANAGE_Checkout:'M_Checkout'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export function isValidPermission(key: string): key is Permission {
  return Object.values(PERMISSIONS).includes(key as Permission);
}
