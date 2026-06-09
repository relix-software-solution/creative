import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createVenue, deleteVenue, getVenues, updateVenue } from "./venues.api";
import {
  CreateVenuePayload,
  UpdateVenuePayload,
  VenuesListParams,
} from "./venues.types";

export const venuesKeys = {
  all: ["venues"] as const,
  lists: () => [...venuesKeys.all, "list"] as const,
  list: (params: VenuesListParams) => [...venuesKeys.lists(), params] as const,
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) return message[0] ?? "حدث خطأ غير متوقع";
    if (typeof message === "string") return message;
  }

  return "حدث خطأ غير متوقع";
}

export function useVenues(params: VenuesListParams) {
  return useQuery({
    queryKey: venuesKeys.list(params),
    queryFn: () => getVenues(params),
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVenuePayload) => createVenue(payload),

    onSuccess: () => {
      toast.success("تم إضافة المكان بنجاح");
      queryClient.invalidateQueries({ queryKey: venuesKeys.lists() });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateVenuePayload;
    }) => updateVenue(id, payload),

    onSuccess: () => {
      toast.success("تم تعديل المكان بنجاح");
      queryClient.invalidateQueries({ queryKey: venuesKeys.lists() });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVenue(id),

    onSuccess: () => {
      toast.success("تم حذف المكان بنجاح");
      queryClient.invalidateQueries({ queryKey: venuesKeys.lists() });
    },

    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
