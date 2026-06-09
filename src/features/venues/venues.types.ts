export type Venue = {
  id: string;
  eventId: string;
  nameAr: string;
  nameEn: string;
  addressAr?: string | null;
  addressEn?: string | null;
  city: string;
  country: string;
  createdAt?: string;
  updatedAt?: string;
  event?: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
};

export type VenuesListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
};

export type CreateVenuePayload = {
  eventId: string;
  nameAr: string;
  nameEn: string;
  addressAr?: string;
  addressEn?: string;
  city: string;
  country: string;
};

export type UpdateVenuePayload = Partial<CreateVenuePayload>;

export type VenuesListResponse = {
  items: Venue[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
