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
    let rafId = 0;

    const mouseMoveHandler = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };

    const loop = () => {
      if (!hover) {
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

      const rect = element.getBoundingClientRect();

      if (element.dataset.cursor === "icons") {
        const entryY = Math.min(Math.max(e.clientY, rect.top + 10), rect.bottom - 10);
        cursor.classList.add("cursor-icons");
        gsap.set(cursor, { x: rect.left, y: entryY - 10 });
        gsap.to(cursor, { x: rect.left, y: rect.top, duration: 0.24, ease: "power2.out" });
        cursor.style.setProperty("--cursorH", `${rect.height}px`);
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