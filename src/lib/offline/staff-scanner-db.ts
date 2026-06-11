import Dexie, { Table } from "dexie";
import { QueuedStaffScan } from "@/features/scans/scans.types";

class StaffScannerDatabase extends Dexie {
  scans!: Table<QueuedStaffScan, number>;

  constructor() {
    super("creative-staff-scanner-db");

    this.version(1).stores({
      scans:
        "++id, operationId, eventId, deviceId, staffSessionId, checkpointId, qrToken, type, status, createdAt, syncedAt",
    });
  }
}

export const staffScannerDb = new StaffScannerDatabase();

export async function addScanToQueue(
  scan: Omit<QueuedStaffScan, "id" | "status" | "createdAt" | "syncedAt">,
) {
  return staffScannerDb.scans.add({
    ...scan,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    syncedAt: null,
    errorMessage: null,
  });
}

export async function getPendingScansCount() {
  return staffScannerDb.scans.where("status").equals("PENDING").count();
}

export async function getQueuedScans() {
  return staffScannerDb.scans.orderBy("createdAt").reverse().toArray();
}
