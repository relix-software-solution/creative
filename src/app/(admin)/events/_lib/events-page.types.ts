import { ChangeEvent } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/features/events/events.schema";

export type ImageType = "logo" | "background" | "badgeBackground";

export type EventFormInstance = UseFormReturn<EventFormValues>;

export type ImageChangeHandler = (
  event: ChangeEvent<HTMLInputElement>,
  type: ImageType,
) => void;

export type ImageRemoveHandler = (type: ImageType) => void;

export type BadgeFieldLayoutValue = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
};

export type BadgeFieldLayoutMap = Record<string, BadgeFieldLayoutValue>;

export type BadgeVisibleMap = Record<string, boolean>;
