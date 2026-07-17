import { FormEvent } from "react";
import {
  PublicAttendeeType,
  PublicEvent,
  PublicRegistrationField,
} from "@/features/public-events/public-events.types";

export type ScannerControls = {
  stop: () => void;
};

export type StaffScannerVisitorSource = "scan" | "lookup" | "created";

export type StaffScannerTheme = {
  primary: string;
  primaryHover: string;
  background: string;
  text: string;
  radius: string;
};

export type StaffScannerVisitor = {
  id?: string;
  registrationId?: string;
  publicId?: string | null;

  fullName: string;
  phone?: string | null;
  email?: string | null;
  status?: string | null;

  attendeeTypeName?: string | null;
  attendeeTypeCode?: string | null;

  customFields?: Record<string, unknown> | null;

  qrToken?: string;
  qrImageUrl?: string;
};

export type StaffScannerRegisterForm = {
  fullName: string;
  phone: string;
  email: string;
};

export type StaffScannerPublicEventResponse = PublicEvent & {
  event?: PublicEvent;
  branding?: PublicEvent["branding"];
  attendeeTypes?: PublicAttendeeType[];
  registrationFields?: PublicRegistrationField[];
  data?: {
    event?: PublicEvent;
    branding?: PublicEvent["branding"];
    attendeeTypes?: PublicAttendeeType[];
    registrationFields?: PublicRegistrationField[];
  };
};

export type StaffCreateVisitorModalProps = {
  open: boolean;
  theme: StaffScannerTheme;
  attendeeTypes: PublicAttendeeType[];
  attendeeTypeId: string;
  form: StaffScannerRegisterForm;
  customFields: Record<string, unknown>;
  visibleFields: PublicRegistrationField[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAttendeeTypeChange: (value: string) => void;
  onFormChange: (key: keyof StaffScannerRegisterForm, value: string) => void;
  onCustomChange: (key: string, value: unknown) => void;
};
