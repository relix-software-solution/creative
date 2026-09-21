"use client";

import { useId, type ChangeEventHandler, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BadgeAvailableField } from "@/features/events/events.types";
import {
  BadgeAutoLayoutGroup,
  BadgeFieldLayoutMap,
  BadgeFieldLayoutValue,
  BadgeVisibleMap,
  ImageChangeHandler,
  ImageRemoveHandler,
} from "../_lib/events-page.types";
import {
  badgeVerticalAlignToFlex,
  computeBadgeAutoLayoutItems,
  getGroupedBadgeFieldKeys,
  normalizeBadgeHorizontalAlign,
  normalizeBadgeVerticalAlign,
  normalizeBadgeTextDirection,
  resolveBadgeTextDirection,
  type BadgeTextDirection,
  type BadgeHorizontalAlign,
  type BadgeVerticalAlign,
} from "@/features/badge-templates/badge-layout";
import { resolveAssetUrl, toNumber } from "../_lib/events-page.utils";

export type BadgeState = {
  badgeEnabled: boolean;
  setBadgeEnabled: (value: boolean) => void;

  badgeName: string;
  setBadgeName: (value: string) => void;

  badgeWidthMm: string;
  setBadgeWidthMm: (value: string) => void;

  badgeHeightMm: string;
  setBadgeHeightMm: (value: string) => void;

  badgePrimaryColor: string;
  setBadgePrimaryColor: (value: string) => void;

  badgeTextColor: string;
  setBadgeTextColor: (value: string) => void;

  badgeBackgroundColor: string;
  setBadgeBackgroundColor: (value: string) => void;

  badgeBackgroundPreview: string;

  visibleFields: BadgeVisibleMap;
  setVisibleFields: (value: BadgeVisibleMap) => void;

  fieldLayout: BadgeFieldLayoutMap;
  setFieldLayout: (value: BadgeFieldLayoutMap) => void;

  autoLayoutGroups: BadgeAutoLayoutGroup[];
  setAutoLayoutGroups: (value: BadgeAutoLayoutGroup[]) => void;
};

function getFieldLabel(field: BadgeAvailableField) {
  if (field.key === "fullName") return "الاسم الكامل";
  if (field.key === "qrCode") return "رمز QR";

  return field.labelAr || field.labelEn || field.key;
}

function getPreviewText(field: BadgeAvailableField) {
  if (field.key === "fullName") return "الاسم الكامل للزائر";
  if (field.key === "qrCode") return "QR";
  if (field.key === "companyName") return "اسم الشركة";
  if (field.key === "jobTitle") return "المسمى الوظيفي";
  if (field.key === "email") return "visitor@example.com";
  if (field.key === "phone") return "0999999999";

  return field.labelAr || field.labelEn || field.key;
}

function isQrField(field: BadgeAvailableField) {
  return field.key === "qrCode" || field.type === "QR";
}

function isBaseField(field: BadgeAvailableField) {
  return field.key === "fullName" || field.key === "qrCode";
}

function isCustomField(field: BadgeAvailableField) {
  return String(field.source).toUpperCase() === "CUSTOM";
}

function getDefaultLayout(field: BadgeAvailableField, index = 0) {
  if (isQrField(field)) {
    return {
      x: 58,
      y: 78,
      width: 26,
      height: 26,
    };
  }

  if (field.key === "fullName") {
    return {
      x: 10,
      y: 20,
      width: 70,
      height: 13,
      fontSize: 18,
      textAlign: "right" as const,
      verticalAlign: "center" as const,
    };
  }

  return {
    x: 10,
    y: 34 + index * 10,
    width: 70,
    height: 10,
    fontSize: 12,
    textAlign: "right" as const,
    verticalAlign: "center" as const,
  };
}

function getDefaultTextHeightMm(fieldKey: string) {
  return fieldKey === "fullName" ? 13 : 10;
}

function createBadgeGroupId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `badge-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function setLayoutValue({
  fieldKey,
  layout,
  setLayout,
  patch,
}: {
  fieldKey: string;
  layout: BadgeFieldLayoutMap;
  setLayout: (value: BadgeFieldLayoutMap) => void;
  patch: Partial<BadgeFieldLayoutValue>;
}) {
  setLayout({
    ...layout,
    [fieldKey]: {
      ...(layout[fieldKey] ?? { x: 10, y: 10 }),
      ...patch,
    },
  });
}

export function EventBadgeSection({
  badge,
  availableFields,
  isSubmitting,
  onImageChange,
  onImageRemove,
}: {
  badge: BadgeState;
  availableFields: BadgeAvailableField[];
  isSubmitting: boolean;
  onImageChange: ImageChangeHandler;
  onImageRemove: ImageRemoveHandler;
}) {
  const baseFields = availableFields.filter(isBaseField);
  const customFields = availableFields.filter(
    (field) => !isBaseField(field) && isCustomField(field),
  );

  const fields = [...baseFields, ...customFields];
  const textFields = fields.filter((field) => !isQrField(field));
  const visibleTextFields = textFields.filter((field) =>
    Boolean(badge.visibleFields[field.key]),
  );

  function toggleFieldVisibility(field: BadgeAvailableField, index: number) {
    const checked = Boolean(badge.visibleFields[field.key]);
    const nextChecked = !checked;

    badge.setVisibleFields({
      ...badge.visibleFields,
      [field.key]: nextChecked,
    });

    badge.setFieldLayout({
      ...badge.fieldLayout,
      [field.key]:
        badge.fieldLayout[field.key] ?? getDefaultLayout(field, index),
    });

    if (!nextChecked) {
      badge.setAutoLayoutGroups(
        badge.autoLayoutGroups.map((group) => ({
          ...group,
          fieldKeys: group.fieldKeys.filter((key) => key !== field.key),
        })),
      );
    }
  }

  function patchAutoLayoutGroup(
    groupId: string,
    patch: Partial<BadgeAutoLayoutGroup>,
  ) {
    badge.setAutoLayoutGroups(
      badge.autoLayoutGroups.map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
    );
  }

  function addAutoLayoutGroup() {
    const alreadyGrouped = getGroupedBadgeFieldKeys(badge.autoLayoutGroups);
    const suggestedFieldObjects = visibleTextFields
      .filter((field) => !alreadyGrouped.has(field.key))
      .sort((first, second) => {
        const firstY =
          badge.fieldLayout[first.key]?.y ??
          getDefaultLayout(first, fields.indexOf(first)).y;
        const secondY =
          badge.fieldLayout[second.key]?.y ??
          getDefaultLayout(second, fields.indexOf(second)).y;

        return firstY - secondY;
      })
      .slice(0, 3);

    const suggestedFields = suggestedFieldObjects.map((field) => field.key);
    const suggestedRects = suggestedFieldObjects.map((field) => {
      const current =
        badge.fieldLayout[field.key] ??
        getDefaultLayout(field, fields.indexOf(field));

      return {
        x: current.x,
        y: current.y,
        width: current.width ?? 70,
        height: current.height ?? getDefaultTextHeightMm(field.key),
      };
    });

    const groupNumber = badge.autoLayoutGroups.length + 1;
    const badgeWidth = toNumber(badge.badgeWidthMm, 90);
    const badgeHeight = toNumber(badge.badgeHeightMm, 120);

    const suggestedX = suggestedRects.length
      ? Math.min(...suggestedRects.map((rect) => rect.x))
      : 8;
    const suggestedY = suggestedRects.length
      ? Math.min(...suggestedRects.map((rect) => rect.y))
      : Math.max(5, badgeHeight * 0.25);
    const suggestedRight = suggestedRects.length
      ? Math.max(...suggestedRects.map((rect) => rect.x + rect.width))
      : Math.min(badgeWidth - 8, suggestedX + 65);
    const suggestedBottom = suggestedRects.length
      ? Math.max(...suggestedRects.map((rect) => rect.y + rect.height))
      : Math.min(badgeHeight - 5, suggestedY + 35);

    badge.setAutoLayoutGroups([
      ...badge.autoLayoutGroups,
      {
        id: createBadgeGroupId(),
        name: `مجموعة ذكية ${groupNumber}`,
        fieldKeys: suggestedFields,
        x: suggestedX,
        y: suggestedY,
        width: Math.max(20, suggestedRight - suggestedX),
        height: Math.max(20, Math.min(badgeHeight - suggestedY, suggestedBottom - suggestedY + 4)),
        gap: 2,
        horizontalAlign: "right",
        verticalAlign: "center",
        collapseEmpty: true,
      },
    ]);
  }

  function toggleGroupField(groupId: string, fieldKey: string) {
    const group = badge.autoLayoutGroups.find((item) => item.id === groupId);

    if (!group) return;

    const isSelected = group.fieldKeys.includes(fieldKey);

    badge.setAutoLayoutGroups(
      badge.autoLayoutGroups.map((item) => {
        if (item.id === groupId) {
          return {
            ...item,
            fieldKeys: isSelected
              ? item.fieldKeys.filter((key) => key !== fieldKey)
              : [...item.fieldKeys, fieldKey],
          };
        }

        if (!isSelected && item.fieldKeys.includes(fieldKey)) {
          return {
            ...item,
            fieldKeys: item.fieldKeys.filter((key) => key !== fieldKey),
          };
        }

        return item;
      }),
    );
  }


  function moveGroupField(
    groupId: string,
    fieldKey: string,
    direction: -1 | 1,
  ) {
    const group = badge.autoLayoutGroups.find((item) => item.id === groupId);

    if (!group) return;

    const currentIndex = group.fieldKeys.indexOf(fieldKey);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= group.fieldKeys.length) {
      return;
    }

    const nextKeys = [...group.fieldKeys];
    [nextKeys[currentIndex], nextKeys[nextIndex]] = [
      nextKeys[nextIndex],
      nextKeys[currentIndex],
    ];

    patchAutoLayoutGroup(groupId, { fieldKeys: nextKeys });
  }

  return (
    <section className="h-full min-h-0 overflow-hidden" dir="ltr">
      <div
        className="h-full min-h-0 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 390px",
          gap: "14px",
        }}
      >
        <main
          className="min-h-0 min-w-0 overflow-hidden rounded-3xl border border-black/10 bg-white"
          dir="rtl"
        >
          <div className="flex h-full min-h-0 items-center justify-center overflow-hidden p-4">
            <BadgePreview
              enabled={badge.badgeEnabled}
              fields={fields}
              visibleFields={badge.visibleFields}
              widthMm={toNumber(badge.badgeWidthMm, 90)}
              heightMm={toNumber(badge.badgeHeightMm, 120)}
              backgroundColor={badge.badgeBackgroundColor}
              textColor={badge.badgeTextColor}
              backgroundImageUrl={badge.badgeBackgroundPreview}
              layout={badge.fieldLayout}
              autoLayoutGroups={badge.autoLayoutGroups}
            />
          </div>
        </main>

        <aside
          className="custom-scrollbar min-h-0 min-w-0 overflow-y-auto overflow-x-hidden rounded-3xl border border-black/10 bg-[#F8F8FF] p-3"
          dir="rtl"
        >
          <div className="space-y-3">
            <ControlCard title="الحقول على البادج">
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-[11px] font-black text-[#4B4B4B]/45">
                    الحقول الأساسية
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {baseFields.map((field, index) => {
                      const checked = Boolean(badge.visibleFields[field.key]);

                      return (
                        <FieldToggle
                          key={field.key}
                          label={getFieldLabel(field)}
                          checked={checked}
                          disabled={isSubmitting}
                          onClick={() =>
                            toggleFieldVisibility(field, index)
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-black text-[#4B4B4B]/45">
                    الحقول الإضافية Custom
                  </p>

                  {customFields.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {customFields.map((field, index) => {
                        const fieldIndex = baseFields.length + index;
                        const checked = Boolean(badge.visibleFields[field.key]);

                        return (
                          <FieldToggle
                            key={field.key}
                            label={getFieldLabel(field)}
                            checked={checked}
                            disabled={isSubmitting}
                            onClick={() =>
                              toggleFieldVisibility(field, fieldIndex)
                            }
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-[#F8F8FF] px-3 py-3 text-xs font-bold leading-6 text-[#4B4B4B]/45">
                      لا يوجد حقول Custom مرجعة من API البادج.
                    </div>
                  )}
                </div>
              </div>
            </ControlCard>

            <ControlCard title="المجموعات الذكية Auto Layout">
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#A88042]/15 bg-[#A88042]/5 p-3 text-xs font-bold leading-6 text-[#4B4B4B]/60">
                  اجمع الاسم والشركة والمسمى الوظيفي أو أي حقول نصية ضمن مساحة واحدة.
                  عند الطباعة يتم حذف القيم الفارغة وإعادة توسيط وترتيب الباقي تلقائيًا.
                </div>

                <button
                  type="button"
                  onClick={addAutoLayoutGroup}
                  disabled={isSubmitting || visibleTextFields.length === 0}
                  className="h-10 w-full rounded-2xl bg-[#A88042] px-3 text-xs font-black text-white transition hover:bg-[#8F6D37] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  + إضافة مجموعة ذكية
                </button>

                {badge.autoLayoutGroups.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-[#F8F8FF] px-3 py-3 text-center text-xs font-bold leading-6 text-[#4B4B4B]/45">
                    لا توجد مجموعة ذكية حالياً. الحقول تبقى مستقلة بإحداثياتها المعتادة.
                  </div>
                ) : (
                  badge.autoLayoutGroups.map((group, groupIndex) => (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-black/10 bg-white p-3"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <TextInput
                            label={`اسم المجموعة ${groupIndex + 1}`}
                            value={group.name || `مجموعة ${groupIndex + 1}`}
                            onChange={(value) =>
                              patchAutoLayoutGroup(group.id, { name: value })
                            }
                            disabled={isSubmitting}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            badge.setAutoLayoutGroups(
                              badge.autoLayoutGroups.filter(
                                (item) => item.id !== group.id,
                              ),
                            )
                          }
                          disabled={isSubmitting}
                          className="mt-5 h-9 shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 text-[11px] font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          حذف
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2" dir="ltr">
                        <MetricInput
                          label="X"
                          suffix="mm"
                          value={String(group.x)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            patchAutoLayoutGroup(group.id, {
                              x: toNumber(value, group.x),
                            })
                          }
                        />
                        <MetricInput
                          label="Y"
                          suffix="mm"
                          value={String(group.y)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            patchAutoLayoutGroup(group.id, {
                              y: toNumber(value, group.y),
                            })
                          }
                        />
                        <MetricInput
                          label="Width"
                          suffix="mm"
                          value={String(group.width)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            patchAutoLayoutGroup(group.id, {
                              width: Math.max(1, toNumber(value, group.width)),
                            })
                          }
                        />
                        <MetricInput
                          label="Height"
                          suffix="mm"
                          value={String(group.height)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            patchAutoLayoutGroup(group.id, {
                              height: Math.max(1, toNumber(value, group.height)),
                            })
                          }
                        />
                        <MetricInput
                          label="Gap"
                          suffix="mm"
                          value={String(group.gap ?? 2)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            patchAutoLayoutGroup(group.id, {
                              gap: Math.max(0, toNumber(value, 2)),
                            })
                          }
                        />
                      </div>

                      {group.fieldKeys.reduce((total, fieldKey) =>
                        total + (badge.fieldLayout[fieldKey]?.height ?? getDefaultTextHeightMm(fieldKey)), 0,
                      ) > group.height ? (
                        <p className="mt-3 rounded-xl bg-amber-50 p-2 text-[11px] font-bold leading-5 text-amber-900">
                          ارتفاع الأسطر أكبر من مساحة المجموعة: سيتم تقليصها لتجنّب التداخل، وقد يصغر الخط كثيراً. يُفضّل زيادة Height للمجموعة.
                        </p>
                      ) : null}
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <AlignmentButtons
                          label="المحاذاة الأفقية للمجموعة"
                          value={normalizeBadgeHorizontalAlign(
                            group.horizontalAlign,
                          )}
                          options={[
                            { value: "right", label: "يمين" },
                            { value: "center", label: "وسط" },
                            { value: "left", label: "يسار" },
                          ]}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            patchAutoLayoutGroup(group.id, {
                              horizontalAlign: value as BadgeHorizontalAlign,
                            })
                          }
                        />

                        <AlignmentButtons
                          label="المحاذاة العمودية للمجموعة"
                          value={normalizeBadgeVerticalAlign(
                            group.verticalAlign,
                          )}
                          options={[
                            { value: "top", label: "أعلى" },
                            { value: "center", label: "وسط" },
                            { value: "bottom", label: "أسفل" },
                          ]}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            patchAutoLayoutGroup(group.id, {
                              verticalAlign: value as BadgeVerticalAlign,
                            })
                          }
                        />
                      </div>

                      <label className="mt-3 flex items-center justify-between rounded-xl border border-black/10 bg-[#F8F8FF] px-3 py-2">
                        <span className="text-[11px] font-black text-[#4B4B4B]">
                          إخفاء الفراغات وإعادة توزيع العناصر
                        </span>
                        <input
                          type="checkbox"
                          checked={group.collapseEmpty !== false}
                          disabled={isSubmitting}
                          onChange={(event) =>
                            patchAutoLayoutGroup(group.id, {
                              collapseEmpty: event.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-[#A88042]"
                        />
                      </label>

                      <div className="mt-3">
                        <p className="mb-2 text-[11px] font-black text-[#4B4B4B]/50">
                          الحقول ضمن المجموعة
                        </p>

                        {visibleTextFields.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {visibleTextFields.map((field) => {
                              const selected = group.fieldKeys.includes(
                                field.key,
                              );

                              return (
                                <FieldToggle
                                  key={field.key}
                                  label={getFieldLabel(field)}
                                  checked={selected}
                                  disabled={isSubmitting}
                                  onClick={() =>
                                    toggleGroupField(group.id, field.key)
                                  }
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <p className="rounded-xl bg-[#F8F8FF] p-3 text-xs font-bold text-[#4B4B4B]/45">
                            فعّل حقولاً نصية أولاً ثم أضفها للمجموعة.
                          </p>
                        )}

                        {group.fieldKeys.length > 0 ? (
                          <div className="mt-3 rounded-xl border border-black/10 bg-[#F8F8FF] p-2">
                            <p className="mb-2 text-[10px] font-black text-[#4B4B4B]/45">
                              ترتيب الأسطر من الأعلى للأسفل
                            </p>
                            <div className="space-y-1">
                              {group.fieldKeys.map((fieldKey, fieldIndex) => {
                                const field = textFields.find(
                                  (item) => item.key === fieldKey,
                                );

                                if (!field) return null;

                                return (
                                  <div
                                    key={fieldKey}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5"
                                  >
                                    <span className="min-w-0 truncate text-[11px] font-black text-[#4B4B4B]">
                                      {fieldIndex + 1}. {getFieldLabel(field)}
                                    </span>
                                    <div className="flex shrink-0 gap-1" dir="ltr">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          moveGroupField(
                                            group.id,
                                            fieldKey,
                                            -1,
                                          )
                                        }
                                        disabled={
                                          isSubmitting || fieldIndex === 0
                                        }
                                        className="h-7 w-7 rounded-lg border border-black/10 bg-white text-xs font-black text-[#4B4B4B] disabled:opacity-30"
                                        title="تحريك للأعلى"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          moveGroupField(
                                            group.id,
                                            fieldKey,
                                            1,
                                          )
                                        }
                                        disabled={
                                          isSubmitting ||
                                          fieldIndex ===
                                            group.fieldKeys.length - 1
                                        }
                                        className="h-7 w-7 rounded-lg border border-black/10 bg-white text-xs font-black text-[#4B4B4B] disabled:opacity-30"
                                        title="تحريك للأسفل"
                                      >
                                        ↓
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ControlCard>

            <ControlCard title="الألوان">
              <div className="grid grid-cols-2 gap-2">
                <ColorInput
                  label="لون النص"
                  value={badge.badgeTextColor}
                  onChange={badge.setBadgeTextColor}
                  disabled={isSubmitting}
                />

                <ColorInput
                  label="لون الخلفية"
                  value={badge.badgeBackgroundColor}
                  onChange={badge.setBadgeBackgroundColor}
                  disabled={isSubmitting}
                />

                <ColorInput
                  label="اللون الأساسي"
                  value={badge.badgePrimaryColor}
                  onChange={badge.setBadgePrimaryColor}
                  disabled={isSubmitting}
                  className="col-span-2"
                />
              </div>
            </ControlCard>

            <ControlCard title="إعدادات القالب">
              <div className="grid grid-cols-2 gap-2">
                <label className="col-span-2 flex h-10 items-center justify-between rounded-2xl border border-black/10 bg-white px-3">
                  <span className="text-xs font-black text-[#4B4B4B]">
                    تفعيل القالب
                  </span>

                  <input
                    type="checkbox"
                    checked={badge.badgeEnabled}
                    onChange={(event) =>
                      badge.setBadgeEnabled(event.target.checked)
                    }
                    disabled={isSubmitting}
                    className="h-4 w-4 accent-[#A88042]"
                  />
                </label>

                <TextInput
                  label="اسم القالب"
                  value={badge.badgeName}
                  onChange={badge.setBadgeName}
                  disabled={isSubmitting}
                  className="col-span-2"
                />

                <TextInput
                  label="العرض mm"
                  value={badge.badgeWidthMm}
                  onChange={badge.setBadgeWidthMm}
                  disabled={isSubmitting}
                  type="number"
                />

                <TextInput
                  label="الارتفاع mm"
                  value={badge.badgeHeightMm}
                  onChange={badge.setBadgeHeightMm}
                  disabled={isSubmitting}
                  type="number"
                />
              </div>
            </ControlCard>

            <ControlCard title="التحريك والمقاسات">
              <div className="space-y-2">
                {fields.map((field, index) => {
                  if (!badge.visibleFields[field.key]) return null;

                  const current =
                    badge.fieldLayout[field.key] ??
                    getDefaultLayout(field, index);

                  const qr = isQrField(field);
                  const fieldGroup = badge.autoLayoutGroups.find((group) =>
                    group.fieldKeys.includes(field.key),
                  );

                  return (
                    <div
                      key={field.key}
                      className="rounded-2xl border border-black/10 bg-white p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-right">
                          <p className="text-sm font-black text-[#4B4B4B]">
                            {getFieldLabel(field)}
                          </p>

                          <p className="mt-0.5 text-[10px] font-bold text-[#4B4B4B]/40">
                            القيم بالـ mm والخط بالـ pt
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="rounded-full bg-[#A88042]/10 px-2.5 py-1 text-[10px] font-black text-[#A88042]">
                            {isBaseField(field) ? "أساسي" : "Custom"}
                          </span>
                          {fieldGroup ? (
                            <span className="max-w-[150px] truncate rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                              ضمن: {fieldGroup.name || "مجموعة ذكية"}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2" dir="ltr">
                        <MetricInput
                          label="X"
                          suffix="mm"
                          value={String(current.x ?? 10)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            setLayoutValue({
                              fieldKey: field.key,
                              layout: badge.fieldLayout,
                              setLayout: badge.setFieldLayout,
                              patch: { x: toNumber(value, 10) },
                            })
                          }
                        />

                        <MetricInput
                          label="Y"
                          suffix="mm"
                          value={String(current.y ?? 10)}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            setLayoutValue({
                              fieldKey: field.key,
                              layout: badge.fieldLayout,
                              setLayout: badge.setFieldLayout,
                              patch: { y: toNumber(value, 10) },
                            })
                          }
                        />

                        <MetricInput
                          label={qr ? "W" : "Width"}
                          suffix="mm"
                          value={String(current.width ?? (qr ? 26 : 70))}
                          disabled={isSubmitting}
                          onChange={(value) =>
                            setLayoutValue({
                              fieldKey: field.key,
                              layout: badge.fieldLayout,
                              setLayout: badge.setFieldLayout,
                              patch: {
                                width: toNumber(value, qr ? 26 : 70),
                              },
                            })
                          }
                        />

                        {qr ? (
                          <MetricInput
                            label="H"
                            suffix="mm"
                            value={String(current.height ?? 26)}
                            disabled={isSubmitting}
                            onChange={(value) =>
                              setLayoutValue({
                                fieldKey: field.key,
                                layout: badge.fieldLayout,
                                setLayout: badge.setFieldLayout,
                                patch: { height: toNumber(value, 26) },
                              })
                            }
                          />
                        ) : (
                          <>
                            <MetricInput
                              label="H"
                              suffix="mm"
                              value={String(
                                current.height ??
                                  getDefaultTextHeightMm(field.key),
                              )}
                              disabled={isSubmitting}
                              onChange={(value) =>
                                setLayoutValue({
                                  fieldKey: field.key,
                                  layout: badge.fieldLayout,
                                  setLayout: badge.setFieldLayout,
                                  patch: {
                                    height: Math.max(
                                      1,
                                      toNumber(
                                        value,
                                        getDefaultTextHeightMm(field.key),
                                      ),
                                    ),
                                  },
                                })
                              }
                            />

                            <MetricInput
                              label="Font"
                              suffix="pt"
                              value={String(current.fontSize ?? 18)}
                              disabled={isSubmitting}
                              onChange={(value) =>
                                setLayoutValue({
                                  fieldKey: field.key,
                                  layout: badge.fieldLayout,
                                  setLayout: badge.setFieldLayout,
                                  patch: { fontSize: toNumber(value, 18) },
                                })
                              }
                            />
                          </>
                        )}
                      </div>

                      {!qr ? (
                        <div className="mt-3 space-y-3">
                          <AlignmentButtons
                            label="محاذاة النص أفقياً"
                            value={normalizeBadgeHorizontalAlign(
                              current.textAlign,
                            )}
                            options={[
                              { value: "right", label: "يمين" },
                              { value: "center", label: "وسط" },
                              { value: "left", label: "يسار" },
                            ]}
                            disabled={isSubmitting}
                            onChange={(value) =>
                              setLayoutValue({
                                fieldKey: field.key,
                                layout: badge.fieldLayout,
                                setLayout: badge.setFieldLayout,
                                patch: {
                                  textAlign: value as BadgeHorizontalAlign,
                                },
                              })
                            }
                          />

                          <AlignmentButtons
                            label="محاذاة النص عمودياً"
                            value={normalizeBadgeVerticalAlign(
                              current.verticalAlign,
                            )}
                            options={[
                              { value: "top", label: "أعلى" },
                              { value: "center", label: "وسط" },
                              { value: "bottom", label: "أسفل" },
                            ]}
                            disabled={isSubmitting}
                            onChange={(value) =>
                              setLayoutValue({
                                fieldKey: field.key,
                                layout: badge.fieldLayout,
                                setLayout: badge.setFieldLayout,
                                patch: {
                                  verticalAlign: value as BadgeVerticalAlign,
                                },
                              })
                            }
                          />

                          <AlignmentButtons
                            label="اتجاه النص (مستقل عن المحاذاة)"
                            value={normalizeBadgeTextDirection(current.textDirection)}
                            options={[
                              { value: "auto", label: "تلقائي" },
                              { value: "rtl", label: "RTL عربي" },
                              { value: "ltr", label: "LTR English" },
                            ]}
                            disabled={isSubmitting}
                            onChange={(value) =>
                              setLayoutValue({
                                fieldKey: field.key,
                                layout: badge.fieldLayout,
                                setLayout: badge.setFieldLayout,
                                patch: { textDirection: value as BadgeTextDirection },
                              })
                            }
                          />
                          {fieldGroup ? (
                            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-bold leading-5 text-emerald-700">
                              X و Y و Width لهذا الحقل لا تستخدم أثناء وجوده داخل المجموعة؛
                              موضعه وعرضه يأتيان من مساحة المجموعة، بينما يبقى حجم الخط وارتفاع السطر محفوظين للحقل.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </ControlCard>

            <ControlCard title="خلفية البادج">
              <SmallImageUpload
                preview={badge.badgeBackgroundPreview}
                onRemove={() => onImageRemove("badgeBackground")}
                onChange={(event) => onImageChange(event, "badgeBackground")}
                disabled={isSubmitting}
              />
            </ControlCard>
          </div>
        </aside>
      </div>
    </section>
  );
}

function BadgePreview({
  enabled,
  fields,
  visibleFields,
  widthMm,
  heightMm,
  backgroundColor,
  textColor,
  backgroundImageUrl,
  layout,
  autoLayoutGroups,
}: {
  enabled: boolean;
  fields: BadgeAvailableField[];
  visibleFields: BadgeVisibleMap;
  widthMm: number;
  heightMm: number;
  backgroundColor: string;
  textColor: string;
  backgroundImageUrl: string;
  layout: BadgeFieldLayoutMap;
  autoLayoutGroups: BadgeAutoLayoutGroup[];
}) {
  const fieldByKey = new Map(fields.map((field) => [field.key, field]));
  const groupedFieldKeys = getGroupedBadgeFieldKeys(autoLayoutGroups);

  function renderPreviewText({
    field,
    fieldLayout,
    leftMm,
    topMm,
    width,
    height,
    textAlign,
    verticalAlign,
    keySuffix = "",
  }: {
    field: BadgeAvailableField;
    fieldLayout: BadgeFieldLayoutValue;
    leftMm: number;
    topMm: number;
    width: number;
    height: number;
    textAlign: BadgeHorizontalAlign;
    verticalAlign: BadgeVerticalAlign;
    keySuffix?: string;
  }) {
    return (
      <div
        key={`${field.key}${keySuffix}`}
        className="absolute z-10 flex overflow-hidden font-black leading-tight"
        style={{
          left: `${leftMm}mm`,
          top: `${topMm}mm`,
          width: `${width}mm`,
          height: `${height}mm`,
          color: fieldLayout.textColor || textColor,
          fontWeight: fieldLayout.bold === false ? 400 : fieldLayout.bold ? 900 : 700,
          textAlign,
          alignItems: badgeVerticalAlignToFlex(verticalAlign),
          direction: resolveBadgeTextDirection(getPreviewText(field), fieldLayout.textDirection),
        }}
      >
        <span
          className="block w-full overflow-hidden break-words"
          style={{
            fontSize: `${fieldLayout.fontSize ?? 14}pt`,
            lineHeight: 1.15,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            textWrap: "balance",
          }}
          title={getPreviewText(field)}
        >
          {getPreviewText(field)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex max-h-full max-w-full items-center justify-center overflow-auto rounded-3xl bg-[#F8F8FF] p-3">
      <div
        className="relative shrink-0 overflow-hidden border border-black/20 bg-white shadow-sm"
        style={{
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          backgroundColor,
          opacity: enabled ? 1 : 0.45,
        }}
      >
        {backgroundImageUrl ? (
          <img
            src={resolveAssetUrl(backgroundImageUrl)}
            alt="Badge background"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        {autoLayoutGroups.map((group) => {
          const activeFieldKeys = group.fieldKeys.filter((fieldKey) => {
            const field = fieldByKey.get(fieldKey);
            return Boolean(field && !isQrField(field) && visibleFields[fieldKey]);
          });

          if (activeFieldKeys.length === 0) return null;

          const items = computeBadgeAutoLayoutItems({
            group,
            fieldKeys: activeFieldKeys,
            getHeightMm: (fieldKey) => {
              const current = layout[fieldKey];
              return current?.height ?? getDefaultTextHeightMm(fieldKey);
            },
          });

          const horizontalAlign = normalizeBadgeHorizontalAlign(
            group.horizontalAlign,
          );

          return (
            <div key={group.id}>
              <div
                className="pointer-events-none absolute z-[5] rounded-[2mm] border border-dashed border-[#A88042]/45 bg-[#A88042]/[0.025]"
                style={{
                  left: `${group.x}mm`,
                  top: `${group.y}mm`,
                  width: `${group.width}mm`,
                  height: `${group.height}mm`,
                }}
                title={group.name || "مجموعة ذكية"}
              />

              {items.map((item) => {
                const field = fieldByKey.get(item.fieldKey);
                if (!field) return null;

                const fieldLayout =
                  layout[item.fieldKey] ?? getDefaultLayout(field);

                return renderPreviewText({
                  field,
                  fieldLayout,
                  leftMm: group.x,
                  topMm: item.yMm,
                  width: group.width,
                  height: item.heightMm,
                  textAlign: horizontalAlign,
                  verticalAlign: normalizeBadgeVerticalAlign(
                    fieldLayout.verticalAlign,
                  ),
                  keySuffix: `-${group.id}`,
                });
              })}
            </div>
          );
        })}

        {fields.map((field, index) => {
          if (!visibleFields[field.key]) return null;

          const current = layout[field.key] ?? getDefaultLayout(field, index);

          if (isQrField(field)) {
            return (
              <div
                key={field.key}
                className="absolute z-10 grid place-items-center bg-white p-[1mm]"
                style={{
                  left: `${current.x}mm`,
                  top: `${current.y}mm`,
                  width: `${current.width ?? 26}mm`,
                  height: `${current.height ?? 26}mm`,
                }}
              >
                <QRCodeSVG
                  value="BADGE-PREVIEW-QR"
                  width="100%"
                  height="100%"
                />
              </div>
            );
          }

          if (groupedFieldKeys.has(field.key)) {
            return null;
          }

          return renderPreviewText({
            field,
            fieldLayout: current,
            leftMm: current.x,
            topMm: current.y,
            width: current.width ?? 70,
            height: current.height ?? getDefaultTextHeightMm(field.key),
            textAlign: normalizeBadgeHorizontalAlign(current.textAlign),
            verticalAlign: normalizeBadgeVerticalAlign(current.verticalAlign),
          });
        })}
      </div>
    </div>
  );
}

function FieldToggle({
  label,
  checked,
  disabled,
  onClick,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 items-center justify-between gap-2 rounded-2xl border px-3 text-right transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-[#A88042]/40 bg-[#A88042]/10"
          : "border-black/10 bg-white hover:bg-[#F8F8FF]"
      }`}
    >
      <span className="truncate text-xs font-black text-[#4B4B4B]">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        readOnly
        className="h-4 w-4 shrink-0 accent-[#A88042]"
      />
    </button>
  );
}

function AlignmentButtons({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-black text-[#4B4B4B]/50">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-black/10 bg-[#F8F8FF] p-1">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`h-8 rounded-xl px-2 text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "bg-[#A88042] text-white shadow-sm"
                  : "bg-white text-[#4B4B4B]/65 hover:bg-[#A88042]/10"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ControlCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-black text-[#4B4B4B]">{title}</h4>
        <span className="h-2 w-2 rounded-full bg-[#A88042]" />
      </div>

      {children}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: "text" | "number";
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 block text-right text-[11px] font-black text-[#4B4B4B]/50">
        {label}
      </span>

      <input
        type={type}
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-2xl border border-black/10 bg-[#F8F8FF] px-3 text-left text-sm font-bold text-[#4B4B4B] outline-none transition focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10 disabled:opacity-50"
      />
    </label>
  );
}

function MetricInput({
  label,
  suffix,
  value,
  onChange,
  disabled,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block min-w-0 rounded-2xl border border-black/10 bg-[#F8F8FF] p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wide text-[#4B4B4B]/45">
          {label}
        </span>

        <span className="text-[10px] font-black text-[#A88042]/70">
          {suffix}
        </span>
      </div>

      <input
        type="number"
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full min-w-0 rounded-2xl border border-black/10 bg-white px-2 text-center text-sm font-black text-[#4B4B4B] outline-none transition focus:border-[#A88042] focus:ring-4 focus:ring-[#A88042]/10 disabled:opacity-50"
      />
    </label>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  disabled,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const colorId = useId();

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 ${className}`}
      dir="ltr"
    >
      <div className="mb-2 flex items-center justify-between gap-2" dir="rtl">
        <span className="truncate text-[11px] font-black text-[#4B4B4B]/55">
          {label}
        </span>

        <label
          htmlFor={colorId}
          className="relative h-6 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-black/15 shadow-sm"
          style={{ backgroundColor: value || "#000000" }}
        >
          <input
            id={colorId}
            type="color"
            value={value || "#000000"}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <input
        type="text"
        dir="ltr"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#000000"
        className="h-9 w-full min-w-0 rounded-xl border border-black/10 bg-[#F8F8FF] px-3 text-left font-mono text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/30 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function SmallImageUpload({
  preview,
  onChange,
  onRemove,
  disabled,
}: {
  preview: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-black/15 bg-[#F8F8FF] p-2">
      {preview ? (
        <div className="mb-2 overflow-hidden rounded-2xl border border-black/10 bg-white">
          <img
            src={resolveAssetUrl(preview)}
            alt="Badge background"
            className="h-20 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex h-9 cursor-pointer items-center justify-center rounded-2xl bg-[#A88042] px-3 text-xs font-black text-white transition hover:bg-[#8F6D37]">
          رفع خلفية
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={onChange}
          />
        </label>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || !preview}
          className="h-9 rounded-2xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          حذف
        </button>
      </div>
    </div>
  );
}
