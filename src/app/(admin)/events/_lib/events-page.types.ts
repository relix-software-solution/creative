import { ChangeEvent } from "react";
import { UseFormReturn } from "react-hook-form";
import { EventFormValues } from "@/features/events/events.schema";
import type {
  BadgeAutoLayoutGroup,
  BadgeFieldLayoutValue,
} from "@/features/badge-templates/badge-layout";

export type { BadgeAutoLayoutGroup, BadgeFieldLayoutValue };

export type ImageType = "logo" | "background" | "badgeBackground";

export type EventFormInstance = UseFormReturn<EventFormValues>;

export type ImageChangeHandler = (
  event: ChangeEvent<HTMLInputElement>,
  type: ImageType,
) => void;

export type ImageRemoveHandler = (type: ImageType) => void;

export type BadgeFieldLayoutMap = Record<string, BadgeFieldLayoutValue>;

export type BadgeVisibleMap = Record<string, boolean>;
