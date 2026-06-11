import { create } from "zustand";
import { persist } from "zustand/middleware";

type ScannerContextPayload = {
  assignmentId?: string | null;
  eventId?: string | null;
  eventTitle?: string | null;
  checkpointId?: string | null;
  checkpointName?: string | null;
  checkpointType?: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
  deviceCode?: string | null;
  deviceApiKey?: string | null;
  staffSessionId?: string | null;
};

type DeviceState = {
  assignmentId: string | null;

  deviceApiKey: string | null;
  deviceId: string | null;
  deviceName: string | null;
  deviceCode: string | null;

  eventId: string | null;
  eventTitle: string | null;

  checkpointId: string | null;
  checkpointName: string | null;
  checkpointType: string | null;

  staffSessionId: string | null;

  setDeviceApiKey: (apiKey: string | null) => void;

  setDeviceContext: (payload: ScannerContextPayload) => void;
  setScannerContext: (payload: ScannerContextPayload) => void;

  clearDevice: () => void;
};

const emptyState = {
  assignmentId: null,

  deviceApiKey: null,
  deviceId: null,
  deviceName: null,
  deviceCode: null,

  eventId: null,
  eventTitle: null,

  checkpointId: null,
  checkpointName: null,
  checkpointType: null,

  staffSessionId: null,
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      ...emptyState,

      setDeviceApiKey: (apiKey) => {
        set({ deviceApiKey: apiKey });
      },

      setDeviceContext: (payload) => {
        set((state) => ({
          ...state,
          ...payload,
        }));
      },

      setScannerContext: (payload) => {
        set((state) => ({
          ...state,
          ...payload,
        }));
      },

      clearDevice: () => {
        set(emptyState);
      },
    }),
    {
      name: "creative-device",
    },
  ),
);
