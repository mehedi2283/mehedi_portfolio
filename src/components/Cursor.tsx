import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let hover = false;
    let mergeTimer: ReturnType<typeof setTimeout> | null = null;
    const cursor = cursorRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    document.addEventListener("mousemove", (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    });
    requestAnimationFrame(function loop() {
      if (!hover) {
        const delay = 6;
        cursorPos.x += (mousePos.x - cursorPos.x) / delay;
        cursorPos.y += (mousePos.y - cursorPos.y) / delay;
        gsap.to(cursor, { x: cursorPos.x, y: cursorPos.y, duration: 0.1 });
        // cursor.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px)`;
      }
      requestAnimationFrame(loop);
    });
    document.querySelectorAll("[data-cursor]").forEach((item) => {
      const element = item as HTMLElement;
      element.addEventListener("mouseenter", (e: MouseEvent) => {
        const target = element;
        const rect = target.getBoundingClientRect();

        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons", "cursor-merge");
          if (mergeTimer) clearTimeout(mergeTimer);
          mergeTimer = setTimeout(() => {
            cursor.classList.remove("cursor-merge");
          }, 260);

          // Start from the real entry point, then expand/move to the full icons rail.
          gsap.set(cursor, { x: e.clientX, y: e.clientY });
          cursor.style.setProperty("--cursorH", `0px`);
          requestAnimationFrame(() => {
            gsap.to(cursor, {
              x: rect.left,
              y: rect.top,
              duration: 0.35,
              ease: "power2.out",
            });
            cursor.style.setProperty("--cursorH", `${rect.height}px`);
          });
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      });
      element.addEventListener("mouseleave", () => {
        if (mergeTimer) clearTimeout(mergeTimer);
        cursor.classList.remove("cursor-disable", "cursor-icons", "cursor-merge");
        hover = false;
      });
    });

    return () => {
      if (mergeTimer) clearTimeout(mergeTimer);
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
