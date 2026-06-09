export type Zone = {
  id: string;
  eventId: string;
  venueId: string;
  nameAr: string;
  nameEn: string;
  code: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  event?: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
  venue?: {
    id: string;
    nameAr: string;
    nameEn: string;
  } | null;
};

export type ZonesListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  venueId?: string;
};

export type CreateZonePayload = {
  eventId: string;
  venueId: string;
  nameAr: string;
  nameEn: string;
  code: string;
  sortOrder: number;
};

export type UpdateZonePayload = Partial<CreateZonePayload>;

export type ZonesListResponse = {
  items: Zone[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
