import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "./config";
import { useAuthStore } from "@/stores/auth-store";

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  allowOfflineRequest?: boolean;
};

export class OfflineNetworkRequestError extends Error {
  readonly code = "OFFLINE_NETWORK_REQUEST_BLOCKED";

  constructor(message = "Network request was blocked while offline.") {
    super(message);
    this.name = "OfflineNetworkRequestError";
  }
}

let refreshPromise: Promise<string | null> | null = null;

export const adminClient = axios.create({
  baseURL: API_BASE_URL,
});

function isBrowserOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function allowsOfflineRequest(config: InternalAxiosRequestConfig) {
  return Boolean(
    (
      config as InternalAxiosRequestConfig & {
        allowOfflineRequest?: boolean;
      }
    ).allowOfflineRequest,
  );
}

async function refreshAccessToken() {
  /*
   * مهم:
   * لا نحاول Refresh Token أثناء الأوفلاين،
   * ولا نسجل خروج المستخدم بسبب انقطاع الشبكة.
   */
  if (isBrowserOffline()) {
    return null;
  }

  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    useAuthStore.getState().logout();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      })
      .then((response) => {
        const responseData = response.data?.data ?? response.data;

        const newAccessToken = responseData?.accessToken;
        const newRefreshToken = responseData?.refreshToken;

        if (!newAccessToken || !newRefreshToken) {
          useAuthStore.getState().logout();
          return null;
        }

        const currentUser = useAuthStore.getState().user;

        useAuthStore.getState().setAuth({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user: currentUser,
        });

        return newAccessToken as string;
      })
      .catch(() => {
        /*
         * نسجل الخروج فقط عندما يوجد اتصال فعلي،
         * لأن فشل الطلب أثناء Offline لا يعني أن الجلسة منتهية.
         */
        if (!isBrowserOffline()) {
          useAuthStore.getState().logout();
        }

        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

adminClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isBrowserOffline() && !allowsOfflineRequest(config)) {
    return Promise.reject(new OfflineNetworkRequestError());
  }

  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

adminClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    /*
     * لا نحاول Refresh ولا Logout إذا انقطع الإنترنت.
     */
    if (
      isBrowserOffline() ||
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error"
    ) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    originalRequest.headers = {
      ...originalRequest.headers,
      Authorization: `Bearer ${newAccessToken}`,
    };

    return adminClient(originalRequest);
  },
);
