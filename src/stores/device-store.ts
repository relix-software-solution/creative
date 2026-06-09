import { create } from "zustand";
import { persist } from "zustand/middleware";

type DeviceState = {
  deviceApiKey: string | null;
  deviceId: string | null;
  eventId: string | null;
  staffSessionId: string | null;
  checkpointId: string | null;

  setDeviceApiKey: (apiKey: string) => void;

  setDeviceContext: (payload: {
    deviceId?: string | null;
    eventId?: string | null;
    staffSessionId?: string | null;
    checkpointId?: string | null;
  }) => void;

  clearDevice: () => void;
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      deviceApiKey: null,
      deviceId: null,
      eventId: null,
      staffSessionId: null,
      checkpointId: null,

      setDeviceApiKey: (apiKey) => {
        set({ deviceApiKey: apiKey });
      },

      setDeviceContext: (payload) => {
        set((state) => ({
          ...state,
          ...payload,
        }));
      },

      clearDevice: () => {
        set({
          deviceApiKey: null,
          deviceId: null,
          eventId: null,
          staffSessionId: null,
          checkpointId: null,
        });
      },
    }),
    {
      name: "creative-device",
    },
  ),
);
