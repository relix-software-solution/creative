import { adminClient } from "@/lib/api/admin-client";
import { publicClient } from "@/lib/api/public-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  LoginPayload,
  LoginResponse,
  MeResponse,
  RefreshTokenPayload,
  RefreshTokenResponse,
} from "./auth.types";

export async function loginRequest(payload: LoginPayload) {
  const response = await publicClient.post("/auth/login", payload);
  return unwrapApiData<LoginResponse>(response.data);
}

export async function refreshTokenRequest(payload: RefreshTokenPayload) {
  const response = await publicClient.post("/auth/refresh", payload);
  return unwrapApiData<RefreshTokenResponse>(response.data);
}

export async function meRequest() {
  const response = await adminClient.get("/auth/me");
  return unwrapApiData<MeResponse>(response.data);
}

export async function logoutRequest(refreshToken: string) {
  const response = await adminClient.post("/auth/logout", {
    refreshToken,
  });

  return unwrapApiData(response.data);
}
