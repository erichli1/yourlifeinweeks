import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";

const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 100;

const fontSizeCache = new Map<string, number>();

function useFitText(text: string) {
  const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);
  const textRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resizeText = useCallback(() => {
    if (!textRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const cacheKey = `${text}-${containerWidth}x${containerHeight}`;
    if (fontSizeCache.has(cacheKey)) {
      setFontSize(fontSizeCache.get(cacheKey)!);
      return;
    }

    let low = MIN_FONT_SIZE;
    let high = MAX_FONT_SIZE;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      textRef.current.style.fontSize = `${mid}px`;

      if (
        textRef.current.scrollWidth <= containerWidth &&
        textRef.current.scrollHeight <= containerHeight
      ) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    fontSizeCache.set(cacheKey, high);
    setFontSize(high);
  }, [text]);

  useEffect(() => {
    const debouncedResize = debounce(resizeText, 500);

    debouncedResize();
    window.addEventListener("resize", debouncedResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      debouncedResize.cancel();
    };
  }, [resizeText]);

  return { fontSize, textRef, containerRef };
}

export function FitText({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  const { fontSize, textRef, containerRef } = useFitText(text);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full overflow-hidden", className)}
    >
      <div
        ref={textRef}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
        className="w-full h-full flex items-center justify-center text-center"
      >
        {text}
      </div>
    </div>
  );
}
