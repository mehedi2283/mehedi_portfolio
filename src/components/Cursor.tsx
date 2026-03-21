import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let hover = false;
    const cursor = cursorRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    let iconRailElement: HTMLElement | null = null;
    let rafId = 0;

    const syncIconRailPosition = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const paddingBottom = parseFloat(style.paddingBottom) || 0;
      const railHeight = Math.max(0, rect.height - paddingTop - paddingBottom);

      cursor.style.setProperty("--cursorH", `${railHeight}px`);
      gsap.set(cursor, {
        x: rect.left + rect.width / 2,
        y: rect.top + paddingTop + cursor.getBoundingClientRect().width / 2,
      });
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };

    const loop = () => {
      if (iconRailElement) {
        syncIconRailPosition(iconRailElement);
      } else if (!hover) {
        const delay = 6;
        cursorPos.x += (mousePos.x - cursorPos.x) / delay;
        cursorPos.y += (mousePos.y - cursorPos.y) / delay;
        gsap.to(cursor, { x: cursorPos.x, y: cursorPos.y, duration: 0.1 });
      }
      rafId = requestAnimationFrame(loop);
    };

    const pointerOverHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const element = target.closest("[data-cursor]") as HTMLElement | null;
      if (!element) return;

      if (element.dataset.cursor === "icons") {
        cursor.classList.add("cursor-icons");
        iconRailElement = element;
        // Lock cursor to rail position so entry point does not affect placement.
        syncIconRailPosition(element);
        hover = true;
      }

      if (element.dataset.cursor === "disable") {
        cursor.classList.add("cursor-disable");
      }
    };

    const pointerOutHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const element = target.closest("[data-cursor]") as HTMLElement | null;
      if (!element) return;

      const related = e.relatedTarget as HTMLElement | null;
      if (related && element.contains(related)) return;

      if (element.dataset.cursor === "icons") {
        iconRailElement = null;
      }

      cursor.classList.remove("cursor-disable", "cursor-icons");
      hover = false;
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseover", pointerOverHandler);
    document.addEventListener("mouseout", pointerOutHandler);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseover", pointerOverHandler);
      document.removeEventListener("mouseout", pointerOutHandler);
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;