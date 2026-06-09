import axios from "axios";
import { API_BASE_URL } from "./config";
import { useDeviceStore } from "@/stores/device-store";

export const deviceClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

deviceClient.interceptors.request.use((config) => {
  const deviceApiKey = useDeviceStore.getState().deviceApiKey;

  if (deviceApiKey) {
    config.headers["X-Device-Api-Key"] = deviceApiKey;
  }

  return config;
});
