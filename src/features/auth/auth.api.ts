import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import { LoginPayload, LoginResponse, MeResponse } from "./auth.types";

export async function loginRequest(payload: LoginPayload) {
  const response = await adminClient.post("/auth/login", payload);
  return unwrapApiData<LoginResponse>(response.data);
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
