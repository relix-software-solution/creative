export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "STAFF"
  | "CLIENT_VIEWER"
  | string;

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  CLIENT_VIEWER: "CLIENT_VIEWER",
} as const;

export function isAdminRole(role?: UserRole | null) {
  return role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.ADMIN;
}

export function isStaffRole(role?: UserRole | null) {
  return role === USER_ROLES.STAFF;
}

export function isClientViewerRole(role?: UserRole | null) {
  return role === USER_ROLES.CLIENT_VIEWER;
}

export function getDefaultPathByRole(role?: UserRole | null) {
  if (isAdminRole(role)) return "/dashboard";
  if (isStaffRole(role)) return "/staff/scanner";
  if (isClientViewerRole(role)) return "/client";

  return "/login";
}

export function canAccessAdmin(role?: UserRole | null) {
  return isAdminRole(role);
}

export function canAccessStaff(role?: UserRole | null) {
  return isAdminRole(role) || isStaffRole(role);
}

export function canAccessClient(role?: UserRole | null) {
  return isAdminRole(role) || isClientViewerRole(role);
}
