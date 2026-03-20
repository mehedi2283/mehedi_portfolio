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
      element.addEventListener("mouseenter", () => {

        if (element.dataset.cursor === "icons") {
          const rect = element.getBoundingClientRect();
          cursor.classList.add("cursor-cover");
          cursor.style.setProperty("--coverW", `${rect.width}px`);
          cursor.style.setProperty("--coverH", `${rect.height}px`);
          cursor.style.setProperty("--coverR", "28px");
          gsap.to(cursor, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            duration: 0.28,
            ease: "power2.out",
          });
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      });
      element.addEventListener("mouseleave", () => {
        cursor.classList.remove("cursor-disable", "cursor-icons", "cursor-merge", "cursor-cover");
        cursor.style.removeProperty("--coverW");
        cursor.style.removeProperty("--coverH");
        cursor.style.removeProperty("--coverR");
        hover = false;
      });
    });
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
