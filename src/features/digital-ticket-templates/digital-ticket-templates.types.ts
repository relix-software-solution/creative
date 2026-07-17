export type DigitalTicketElementType = "TEXT" | "FIELD" | "IMAGE" | "QR";

export type DigitalTicketElementPosition =
  | "TOP_LEFT"
  | "TOP_CENTER"
  | "TOP_RIGHT"
  | "CENTER_LEFT"
  | "CENTER"
  | "CENTER_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_CENTER"
  | "BOTTOM_RIGHT";

export type DigitalTicketFieldSource = "FIXED" | "SYSTEM" | "CUSTOM";

export type DigitalTicketTheme = {
  primary: string;
  background: string;
  text: string;
};

export type DigitalTicketElement = {
  id?: string;
  type: DigitalTicketElementType;

  position?: DigitalTicketElementPosition;

  x?: number;
  y?: number;

  width?: number;
  height?: number;

  /**
   * يدعمها بعض أجزاء الباك، لكننا سنعتمد width/height.
   */
  w?: number;
  h?: number;

  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  color?: string;
  align?: "left" | "center" | "right";

  text?: string;
  value?: string;

  fieldKey?: string;
  key?: string;
  source?: string;
};

export type DigitalTicketSelectedField = {
  key: string;
  source: DigitalTicketFieldSource;
  label?: string;
  visible?: boolean;
};

export type DigitalTicketTemplate = {
  id: string;
  eventId: string;

  /**
   * null يعني قالب عام لكل زوار الفعالية.
   */
  attendeeTypeId?: string | null;
  attendeeTypeScopeKey?: string;

  name: string;

  widthPx: number;
  heightPx: number;

  backgroundImageUrl?: string | null;
  backgroundImagePath?: string | null;

  theme: DigitalTicketTheme;
  elements: DigitalTicketElement[];
  selectedFields: DigitalTicketSelectedField[];

  version?: number;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

export type DigitalTicketTemplatesListResponse = {
  items?: DigitalTicketTemplate[];
  templates?: DigitalTicketTemplate[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  totalPages?: number;
};

export type SaveDigitalTicketTemplatePayload = {
  eventId: string;
  name: string;
  widthPx: number;
  heightPx: number;
  theme: DigitalTicketTheme;
  elements: DigitalTicketElement[];
  selectedFields: DigitalTicketSelectedField[];
  backgroundImage?: File | null;
};

export type DigitalTicketPreviewPayload = {
  registrationId: string;
  widthPx: number;
  heightPx: number;
  theme: DigitalTicketTheme;
  elements: DigitalTicketElement[];
  selectedFields: DigitalTicketSelectedField[];
};

export type DigitalTicketPreviewResponse = {
  imageUrl: string;
  relativePath?: string;
  widthPx?: number;
  heightPx?: number;
};
