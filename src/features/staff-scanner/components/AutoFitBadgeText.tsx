"use client";

import { CSSProperties, useLayoutEffect, useRef, useState } from "react";

type AutoFitBadgeTextProps = {
  text: string;

  /**
   * أكبر حجم خط مسموح به بالبكسل.
   */
  maxFontSize: number;

  /**
   * أصغر حجم يمكن الوصول إليه.
   */
  minFontSize?: number;

  /**
   * أقصى عدد أسطر.
   */
  maxLines?: number;

  /**
   * ارتفاع السطر كنسبة من حجم الخط.
   */
  lineHeight?: number;

  className?: string;
  style?: CSSProperties;
};

export function AutoFitBadgeText({
  text,
  maxFontSize,
  minFontSize,
  maxLines = 2,
  lineHeight = 1.15,
  className,
  style,
}: AutoFitBadgeTextProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  const safeMaxFontSize = Math.max(1, maxFontSize);

  const safeMinFontSize = Math.min(
    safeMaxFontSize,
    Math.max(1, minFontSize ?? safeMaxFontSize * 0.55),
  );

  const [fontSize, setFontSize] = useState(safeMaxFontSize);

  useLayoutEffect(() => {
    let cancelled = false;

    const fitText = () => {
      const container = containerRef.current;
      const textElement = textRef.current;

      if (!container || !textElement || cancelled) {
        return;
      }

      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;

      if (availableWidth <= 0 || availableHeight <= 0) {
        return;
      }

      /*
       * Binary Search:
       * نبحث عن أكبر حجم خط يدخل بالكامل داخل المساحة.
       */
      let minimum = safeMinFontSize;
      let maximum = safeMaxFontSize;
      let bestSize = safeMinFontSize;

      for (let index = 0; index < 14; index += 1) {
        const candidateSize = (minimum + maximum) / 2;

        textElement.style.fontSize = `${candidateSize}px`;
        textElement.style.lineHeight = String(lineHeight);

        /*
         * لا نسمح بأن يتجاوز النص:
         * - ارتفاع الحاوية.
         * - عدد الأسطر المحدد.
         */
        const maximumLinesHeight =
          candidateSize * lineHeight * Math.max(1, maxLines);

        const allowedHeight = Math.min(availableHeight, maximumLinesHeight + 1);

        const fitsWidth = textElement.scrollWidth <= availableWidth + 1;

        const fitsHeight = textElement.scrollHeight <= allowedHeight + 1;

        if (fitsWidth && fitsHeight) {
          bestSize = candidateSize;
          minimum = candidateSize;
        } else {
          maximum = candidateSize;
        }
      }

      if (cancelled) {
        return;
      }

      const roundedSize = Math.floor(bestSize * 4) / 4;

      setFontSize(roundedSize);

      textElement.style.fontSize = `${roundedSize}px`;
      textElement.style.lineHeight = String(lineHeight);
    };

    const runAfterFontsLoad = async () => {
      const fontSet = (
        document as Document & {
          fonts?: FontFaceSet;
        }
      ).fonts;

      if (fontSet) {
        try {
          await fontSet.ready;
        } catch {
          // نكمل بالخط المتوفر حاليًا.
        }
      }

      fitText();
    };

    void runAfterFontsLoad();

    const resizeObserver = new ResizeObserver(() => {
      fitText();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [text, safeMaxFontSize, safeMinFontSize, maxLines, lineHeight]);

  return (
    <div
      ref={containerRef}
      className={className}
      title={text}
      style={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        ref={textRef}
        style={{
          width: "100%",
          maxWidth: "100%",

          fontSize: `${fontSize}px`,
          lineHeight,

          whiteSpace: maxLines === 1 ? "nowrap" : "normal",

          wordBreak: "normal",
          overflowWrap: "anywhere",

          /*
           * لا نضع ellipsis لأن الهدف عرض الاسم كاملًا
           * عبر تصغير الخط.
           */
          overflow: "visible",

          textAlign: "inherit",
          direction: "inherit",
          unicodeBidi: "isolate",
        }}
      >
        {text}
      </div>
    </div>
  );
}
