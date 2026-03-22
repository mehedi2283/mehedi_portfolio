import { useEffect, useMemo, useRef, useState } from "react";
import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import axios from "axios";

interface Project {
  _id?: string;
  title: string;
  category: string;
  tools: string;
  image: string;
  link?: string;
  video?: string;
  order: number;
}

gsap.registerPlugin(ScrollTrigger, useGSAP);

const Work = ({ previewData }: { previewData?: Project[] }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const workFlexRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (previewData) {
      setProjects(previewData);
      return;
    }
    axios.get('https://mehedi-portfolio-server-phi.vercel.app/api/projects')
      .then(res => setProjects(res.data))
      .catch(() => setProjects([]));
  }, [previewData]);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [projects]
  );

  useGSAP(
    () => {
      if (window.innerWidth <= 1025) return;
      if (sortedProjects.length === 0) return;
      if (!sectionRef.current || !workFlexRef.current) return;

      const box = sectionRef.current.getElementsByClassName("work-box");
      const container = sectionRef.current.querySelector(".work-container");
      if (!box.length || !container) return;

      const calcTranslateX = () => {
        const rectLeft = container.getBoundingClientRect().left;
        const rect = (box[0] as HTMLElement).getBoundingClientRect();
        const parentWidth = (box[0].parentElement as HTMLElement).getBoundingClientRect().width;
        const padding = parseInt(window.getComputedStyle(box[0] as Element).padding, 10) / 2;
        return Math.max(0, rect.width * box.length - (rectLeft + parentWidth) + padding);
      };

      const translateX = calcTranslateX();
      if (translateX <= 0) return;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${translateX}`,
          scrub: true,
          pin: true,
          id: "work",
          invalidateOnRefresh: true,
        },
      });

      timeline.to(workFlexRef.current, {
        x: -translateX,
        ease: "none",
      });

      return () => {
        timeline.kill();
        ScrollTrigger.getById("work")?.kill();
      };
    },
    { dependencies: [sortedProjects.length], scope: sectionRef }
  );


  return (
    <div className="work-section" id="work" ref={sectionRef}>
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex" ref={workFlexRef}>
          {sortedProjects.map((project, index) => (
            <div className="work-box" key={project._id ?? `${project.title}-${index}`}>
              <div className="work-info">
                <div className="work-title">
                  <h3>{String(index + 1).padStart(2, "0")}</h3>

                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.category}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{project.tools}</p>
              </div>
              <WorkImage
                image={project.image}
                alt={project.title}
                link={project.link}
                video={project.video}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Work;
