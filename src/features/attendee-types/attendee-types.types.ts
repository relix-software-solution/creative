export type AttendeeType = {
  id: string;
  eventId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  event?: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
};

export type AttendeeTypesListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
};

export type CreateAttendeeTypePayload = {
  eventId: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
  sortOrder: number;
};

export type UpdateAttendeeTypePayload = Partial<CreateAttendeeTypePayload>;

export type AttendeeTypesListResponse = {
  items: AttendeeType[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
