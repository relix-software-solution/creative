import { AuthUser } from "@/stores/auth-store";

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenPayload = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type MeResponse = AuthUser;
