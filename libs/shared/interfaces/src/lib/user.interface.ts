export interface User {
  id: string;
  email: string;
  name: string;
}
export interface UserWithToken extends User {
  token: string;
}
export interface UserWithTokenAndRefreshToken extends UserWithToken {
  refreshToken: string;
}
export interface UserWithTokenAndRefreshTokenAndRole
  extends UserWithTokenAndRefreshToken {
  role: string;
}
export interface UserWithTokenAndRefreshTokenAndRoleAndPermissions
  extends UserWithTokenAndRefreshTokenAndRole {
  permissions: string[];
}
export interface UserWithTokenAndRefreshTokenAndRoleAndPermissionsAndProfile
  extends UserWithTokenAndRefreshTokenAndRoleAndPermissions {
  profile: string;
}
export interface UserWithTokenAndRefreshTokenAndRoleAndPermissionsAndProfileAndSettings
  extends UserWithTokenAndRefreshTokenAndRoleAndPermissionsAndProfile {
  settings: string;
}
