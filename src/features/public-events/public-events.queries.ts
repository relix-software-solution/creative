import { useQuery } from "@tanstack/react-query";
import { getPublicEvent, getPublicEvents } from "./public-events.api";
import { PublicEventsListParams } from "./public-events.types";

export const publicEventsKeys = {
  all: ["public-events"] as const,
  lists: () => [...publicEventsKeys.all, "list"] as const,
  list: (params: PublicEventsListParams) =>
    [...publicEventsKeys.lists(), params] as const,
  details: () => [...publicEventsKeys.all, "detail"] as const,
  detail: (id: string) => [...publicEventsKeys.details(), id] as const,
};

export function usePublicEvents(params: PublicEventsListParams = {}) {
  return useQuery({
    queryKey: publicEventsKeys.list(params),
    queryFn: () => getPublicEvents(params),
  });
}

export function usePublicEvent(id: string) {
  return useQuery({
    queryKey: publicEventsKeys.detail(id),
    queryFn: () => getPublicEvent(id),
    enabled: Boolean(id),
  });
}
