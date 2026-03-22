import { useState, useEffect } from "react";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./styles/Career.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface CareerData {
  _id?: string;
  title: string;
  company: string;
  dateRange: string;
  description: string;
}

const Career = ({ previewData }: { previewData?: CareerData[] }) => {
  const [careers, setCareers] = useState<CareerData[]>([]);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth <= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (previewData) {
      setCareers(previewData);
      return;
    }
    const fetchCareers = async () => {
      try {
        const res = await axios.get("https://mehedi-portfolio-server-phi.vercel.app/api/career");
        setCareers(res.data);
      } catch (err) {
        console.error("Error fetching career history:", err);
      }
    };
    fetchCareers();
  }, [previewData]);

  useGSAP(() => {
    if (careers.length === 0) return;

    const careerBoxes = document.querySelectorAll(".career-info-box");
    const timeline = document.querySelector(".career-timeline");

    if (!careerBoxes.length || !timeline) return;

    // On mobile: keep career section static and readable without scroll animation.
    if (isMobileView) {
      gsap.set(careerBoxes, { opacity: 1, y: 0, clearProps: "opacity,transform" });
      gsap.set(timeline, { maxHeight: "100%" });
      return;
    }

    const scrollDistance = Math.max(780, careers.length * 430);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".career-section",
        start: "top top",
        end: `+=${scrollDistance}`,
        scrub: 0.55,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    gsap.set(careerBoxes, { opacity: 0, y: 28 });
    gsap.set(timeline, { maxHeight: "0%" });

    // Animate timeline growth
    tl.to(timeline, { maxHeight: "100%", duration: 1.1 }, 0);

    // Reveal items sequentially and keep them visible
    careerBoxes.forEach((box, index) => {
      tl.fromTo(
        box,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.35 },
        index * 0.36
      );
    });

    return () => {
      tl.kill();
    };
  }, [careers.length, isMobileView]);

  return (
    <div className="career-section section-container" id="career">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          
          {careers.map((job, index) => (
            <div className="career-info-box" key={job._id ?? `${job.title}-${index}`}>
              <div className="career-info-in">
                <div className="career-role">
                  <h4>{job.title}</h4>
                  <h5>{job.company}</h5>
                </div>
                <h3>{job.dateRange}</h3>
              </div>
              <p>{job.description}</p>
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
};

export default Career;
