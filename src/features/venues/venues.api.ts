import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateVenuePayload,
  UpdateVenuePayload,
  Venue,
  VenuesListParams,
  VenuesListResponse,
} from "./venues.types";

type DeleteVenueResponse = {
  id?: string;
  message?: string;
  venue?: Venue;
};

function normalizeVenuesList(data: unknown): VenuesListResponse {
  const value = unwrapApiData<VenuesListResponse | Venue[]>(data);

  if (Array.isArray(value)) {
    return {
      items: value,
      total: value.length,
      page: 1,
      limit: value.length,
      totalPages: 1,
    };
  }

  const items = value.items ?? [];
  const limit = value.limit ?? 20;
  const total = value.total ?? items.length;

  return {
    items,
    total,
    page: value.page ?? 1,
    limit,
    totalPages: value.totalPages ?? Math.max(Math.ceil(total / limit), 1),
  };
}

export async function getVenues(params: VenuesListParams) {
  const response = await adminClient.get("/venues", {
    params,
  });

  return normalizeVenuesList(response.data);
}

export async function getVenue(id: string) {
  const response = await adminClient.get(`/venues/${id}`);

  return unwrapApiData<Venue>(response.data);
}

export async function createVenue(payload: CreateVenuePayload) {
  const response = await adminClient.post("/venues", payload);

  return unwrapApiData<Venue>(response.data);
}

export async function updateVenue(id: string, payload: UpdateVenuePayload) {
  const response = await adminClient.patch(`/venues/${id}`, payload);

  return unwrapApiData<Venue>(response.data);
}

export async function deleteVenue(id: string) {
  const response = await adminClient.delete(`/venues/${id}`);

  const data = unwrapApiData<DeleteVenueResponse | Venue>(response.data);

  if (data && typeof data === "object" && "venue" in data && data.venue?.id) {
    return {
      id: data.venue.id,
      venue: data.venue,
    };
  }

  if (data && typeof data === "object" && "id" in data && data.id) {
    return {
      id: data.id,
      venue: data as Venue,
    };
  }

  return { id };
}
