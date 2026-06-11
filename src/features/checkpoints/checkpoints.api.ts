import { adminClient } from "@/lib/api/admin-client";
import { unwrapApiData } from "@/lib/api/unwrap-api-data";
import {
  Checkpoint,
  CheckpointsListParams,
  CheckpointsListResponse,
  CreateCheckpointPayload,
  UpdateCheckpointPayload,
} from "./checkpoints.types";

type DeleteCheckpointResponse = {
  id?: string;
  message?: string;
  checkpoint?: Checkpoint;
};

function normalizeCheckpointsList(data: unknown): CheckpointsListResponse {
  const value = unwrapApiData<CheckpointsListResponse | Checkpoint[]>(data);

  if (Array.isArray(value)) {
    const activeItems = value.filter(
      (checkpoint) => checkpoint.isActive !== false,
    );

    return {
      items: activeItems,
      total: activeItems.length,
      page: 1,
      limit: activeItems.length,
      totalPages: 1,
    };
  }

  const items = (value.items ?? []).filter(
    (checkpoint) => checkpoint.isActive !== false,
  );

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

export async function getCheckpoints(params: CheckpointsListParams) {
  const response = await adminClient.get("/checkpoints", {
    params,
  });

  return normalizeCheckpointsList(response.data);
}

export async function getCheckpoint(id: string) {
  const response = await adminClient.get(`/checkpoints/${id}`);

  return unwrapApiData<Checkpoint>(response.data);
}

export async function createCheckpoint(payload: CreateCheckpointPayload) {
  const response = await adminClient.post("/checkpoints", payload);

  return unwrapApiData<Checkpoint>(response.data);
}

export async function updateCheckpoint(
  id: string,
  payload: UpdateCheckpointPayload,
) {
  const response = await adminClient.patch(`/checkpoints/${id}`, payload);

  return unwrapApiData<Checkpoint>(response.data);
}

export async function deleteCheckpoint(id: string) {
  const response = await adminClient.delete(`/checkpoints/${id}`);

  const data = unwrapApiData<DeleteCheckpointResponse | Checkpoint>(
    response.data,
  );

  if (
    data &&
    typeof data === "object" &&
    "checkpoint" in data &&
    data.checkpoint?.id
  ) {
    return {
      id: data.checkpoint.id,
      checkpoint: data.checkpoint,
    };
  }

  if (data && typeof data === "object" && "id" in data && data.id) {
    return {
      id: data.id,
      checkpoint: data as Checkpoint,
    };
  }

  return { id };
}
