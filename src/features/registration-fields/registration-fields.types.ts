export type RegistrationFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "CHECKBOX";

export type RegistrationFieldOption = {
  labelAr: string;
  labelEn: string;
  value: string;
};

export type RegistrationField = {
  id: string;
  eventId: string;
  attendeeTypeId: string;
  key: string;
  labelAr: string;
  labelEn: string;
  type: RegistrationFieldType;
  placeholderAr?: string | null;
  placeholderEn?: string | null;
  options?: RegistrationFieldOption[] | string[] | null;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  event?: {
    id: string;
    titleAr: string;
    titleEn: string;
  } | null;
  attendeeType?: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  } | null;
};

export type RegistrationFieldsListParams = {
  page?: number;
  limit?: number;
  eventId?: string;
  attendeeTypeId?: string;
};

export type CreateRegistrationFieldPayload = {
  eventId: string;
  attendeeTypeId: string;
  key: string;
  labelAr: string;
  labelEn: string;
  type: RegistrationFieldType;
  placeholderAr?: string;
  placeholderEn?: string;
  options: RegistrationFieldOption[];
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type UpdateRegistrationFieldPayload =
  Partial<CreateRegistrationFieldPayload>;

export type RegistrationFieldsListResponse = {
  items: RegistrationField[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
