import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  CreateVenuePayload,
  UpdateVenuePayload,
  Venue,
  VenuesListParams,
  VenuesListResponse,
} from "./venues.types";

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

  return {
    items: value.items ?? [],
    total: value.total,
    page: value.page,
    limit: value.limit,
    totalPages: value.totalPages,
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
  return unwrapApiData<Venue>(response.data);
}
