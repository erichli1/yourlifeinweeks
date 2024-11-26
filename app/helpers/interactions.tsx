import { useEffect, useState } from "react";

export const DEFAULT_ZOOM = 1;

export function useDrag(pageRef: React.RefObject<HTMLDivElement>) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!e.altKey) return;

      setIsDragging(true);
      const element = pageRef.current;
      if (!element) return;

      setStartX(e.pageX - element.offsetLeft);
      setStartY(e.pageY - element.offsetTop);
      setScrollLeft(element.scrollLeft);
      setScrollTop(element.scrollTop);
      element.style.cursor = "grabbing";
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const element = pageRef.current;
      if (!element) return;
      element.style.cursor = "default";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !e.altKey) {
        if (isDragging) handleMouseUp();
        return;
      }

      e.preventDefault();
      const element = pageRef.current;
      if (!element) return;

      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;

      element.scrollLeft = scrollLeft - walkX;
      element.scrollTop = scrollTop - walkY;
    };

    const pageElement = pageRef.current;
    if (pageElement) {
      pageElement.addEventListener("mousedown", handleMouseDown);
      pageElement.addEventListener("mouseleave", handleMouseUp);
      pageElement.addEventListener("mouseup", handleMouseUp);
      pageElement.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (pageElement) {
        pageElement.removeEventListener("mousedown", handleMouseDown);
        pageElement.removeEventListener("mouseleave", handleMouseUp);
        pageElement.removeEventListener("mouseup", handleMouseUp);
        pageElement.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [pageRef, isDragging, startX, startY, scrollLeft, scrollTop]);
}

export function useZoom(pageRef: React.RefObject<HTMLDivElement>) {
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);

  const resetZoom = () => setZoom(DEFAULT_ZOOM);

  // Handle zooming in and out
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        setZoom((prevZoom) =>
          Math.min(Math.max(prevZoom * delta, DEFAULT_ZOOM), 10)
        );
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [pageRef]);

  return { zoom, resetZoom };
}
