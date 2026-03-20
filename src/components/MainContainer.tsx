import { lazy, PropsWithChildren, Suspense, useEffect, useRef, useState } from "react";
import About from "./About";
import Career from "./Career";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import setSplitText from "./utils/splitText";

const TechStack = lazy(() => import("./TechStack"));

const MainContainer = ({ children }: PropsWithChildren) => {
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );
  const [shouldLoadTechStack, setShouldLoadTechStack] = useState(false);
  const techStackTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const resizeHandler = () => {
      setSplitText();
      setIsDesktopView(window.innerWidth > 1024);
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isDesktopView]);

  useEffect(() => {
    if (!isDesktopView) return;
    if (shouldLoadTechStack) return;

    const triggerEl = techStackTriggerRef.current;
    if (!triggerEl || !("IntersectionObserver" in window)) {
      setShouldLoadTechStack(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadTechStack(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin: "650px 0px", threshold: 0.01 }
    );

    observer.observe(triggerEl);
    return () => observer.disconnect();
  }, [isDesktopView, shouldLoadTechStack]);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />
      {isDesktopView && children}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="container-main">
            <Landing>{!isDesktopView && children}</Landing>
            <About />
            <WhatIDo />
            <Career />
            <Work />
            <div ref={techStackTriggerRef} style={{ width: "100%", height: 1 }} />
            {isDesktopView && shouldLoadTechStack && (
              <Suspense fallback={<div>Loading....</div>}>
                <TechStack />
              </Suspense>
            )}
            <Contact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
