export type BadgeHorizontalAlign = "left" | "center" | "right";
export type BadgeVerticalAlign = "top" | "center" | "bottom";
export type BadgeTextDirection = "auto" | "rtl" | "ltr";

export type BadgeFieldLayoutValue = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;

  bold?: boolean;
  fontWeight?: string | number;
  textColor?: string;
  boldColor?: string;

  textAlign?: BadgeHorizontalAlign;
  verticalAlign?: BadgeVerticalAlign;
  textDirection?: BadgeTextDirection;

  maxLines?: number;
  lineHeight?: number;
};

export type BadgeFieldLayoutMap = Record<string, BadgeFieldLayoutValue>;

export type BadgeAutoLayoutGroup = {
  id: string;
  name?: string;
  fieldKeys: string[];

  x: number;
  y: number;
  width: number;
  height: number;
  gap?: number;

  horizontalAlign?: BadgeHorizontalAlign;
  verticalAlign?: BadgeVerticalAlign;
  collapseEmpty?: boolean;
};

export type BadgeTemplateLayoutConfig = {
  fields?: BadgeFieldLayoutMap;
  groups?: BadgeAutoLayoutGroup[];
  [key: string]: unknown;
};

export type BadgeAutoLayoutItem = {
  fieldKey: string;
  yMm: number;
  heightMm: number;
};

export function normalizeBadgeHorizontalAlign(
  value: unknown,
  fallback: BadgeHorizontalAlign = "right",
): BadgeHorizontalAlign {
  return value === "left" || value === "center" || value === "right"
    ? value
    : fallback;
}

export function normalizeBadgeVerticalAlign(
  value: unknown,
  fallback: BadgeVerticalAlign = "center",
): BadgeVerticalAlign {
  return value === "top" || value === "center" || value === "bottom"
    ? value
    : fallback;
}

export function normalizeBadgeTextDirection(
  value: unknown,
): BadgeTextDirection {
  return value === "rtl" || value === "ltr" ? value : "auto";
}

/** Text direction is independent of the position of the text inside its box. */
export function resolveBadgeTextDirection(
  text: string,
  setting: BadgeTextDirection | undefined,
): "rtl" | "ltr" {
  const preference = normalizeBadgeTextDirection(setting);
  if (preference !== "auto") return preference;
  const firstStrong = text.match(/[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Latin}]/u)?.[0];
  if (!firstStrong) return "ltr";
  return /[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(firstStrong)
    ? "rtl"
    : "ltr";
}

export function badgeVerticalAlignToFlex(
  value: BadgeVerticalAlign | undefined,
) {
  const alignment = normalizeBadgeVerticalAlign(value);

  if (alignment === "top") return "flex-start" as const;
  if (alignment === "bottom") return "flex-end" as const;

  return "center" as const;
}

export function normalizeBadgeAutoLayoutGroups(
  value: unknown,
): BadgeAutoLayoutGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const groups: BadgeAutoLayoutGroup[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return;
    }

    const record = item as Record<string, unknown>;

    const fieldKeys = Array.isArray(record.fieldKeys)
      ? [
          ...new Set(
            record.fieldKeys.filter(
              (key): key is string =>
                typeof key === "string" && key.trim().length > 0,
            ),
          ),
        ]
      : [];

    const toFiniteNumber = (input: unknown, fallback: number) => {
      const parsed = Number(input);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    groups.push({
      id:
        typeof record.id === "string" && record.id.trim()
          ? record.id.trim()
          : `badge-group-${index + 1}`,
      name:
        typeof record.name === "string" && record.name.trim()
          ? record.name.trim()
          : `مجموعة ${index + 1}`,
      fieldKeys,
      x: toFiniteNumber(record.x, 10),
      y: toFiniteNumber(record.y, 20),
      width: Math.max(1, toFiniteNumber(record.width, 60)),
      height: Math.max(1, toFiniteNumber(record.height, 35)),
      gap: Math.max(0, toFiniteNumber(record.gap, 2)),
      horizontalAlign: normalizeBadgeHorizontalAlign(record.horizontalAlign),
      verticalAlign: normalizeBadgeVerticalAlign(record.verticalAlign),
      collapseEmpty: record.collapseEmpty !== false,
    });
  });

  return groups;
}

export function getGroupedBadgeFieldKeys(groups: BadgeAutoLayoutGroup[]) {
  return new Set(groups.flatMap((group) => group.fieldKeys));
}

export function computeBadgeAutoLayoutItems({
  group,
  fieldKeys,
  getHeightMm,
}: {
  group: BadgeAutoLayoutGroup;
  fieldKeys: string[];
  getHeightMm: (fieldKey: string) => number;
}): BadgeAutoLayoutItem[] {
  if (fieldKeys.length === 0) {
    return [];
  }

  const heights = fieldKeys.map((fieldKey) => {
    const measured = getHeightMm(fieldKey);
    return {
      fieldKey,
      heightMm: Number.isFinite(measured) ? Math.max(0.1, measured) : 1,
    };
  });

  const heightsTotal = heights.reduce((total, item) => total + item.heightMm, 0);
  const availableHeight = Math.max(0.1, group.height);

  // If the requested line heights exceed the group, scale them together.
  // Without this, the last field would escape the group (and overlap the QR).
  if (heightsTotal > availableHeight) {
    const scale = availableHeight / heightsTotal;
    heights.forEach((item) => { item.heightMm *= scale; });
  }
  const fittedHeightsTotal = heights.reduce((total, item) => total + item.heightMm, 0);
  const requestedGap = Number(group.gap ?? 2);
  let effectiveGap = Number.isFinite(requestedGap) ? Math.max(0, requestedGap) : 2;

  if (heights.length > 1) {
    const availableForGaps = Math.max(0, availableHeight - fittedHeightsTotal);

    if (availableForGaps <= 0) {
      effectiveGap = 0;
    } else {
      effectiveGap = Math.min(
        effectiveGap,
        availableForGaps / (heights.length - 1),
      );
    }
  }

  const contentHeight =
    fittedHeightsTotal + effectiveGap * Math.max(0, heights.length - 1);

  const verticalAlign = normalizeBadgeVerticalAlign(group.verticalAlign);

  let offsetY = 0;

  if (contentHeight < availableHeight) {
    if (verticalAlign === "center") {
      offsetY = (availableHeight - contentHeight) / 2;
    } else if (verticalAlign === "bottom") {
      offsetY = availableHeight - contentHeight;
    }
  }

  let cursorY = group.y + Math.max(0, offsetY);

  return heights.map((item) => {
    const result = {
      fieldKey: item.fieldKey,
      yMm: cursorY,
      heightMm: item.heightMm,
    };

    cursorY += item.heightMm + effectiveGap;

    return result;
  });
}
