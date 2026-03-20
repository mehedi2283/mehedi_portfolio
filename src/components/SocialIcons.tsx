import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect, useState } from "react";
import HoverLinks from "./HoverLinks";
import axios from "axios";

const API = 'https://mehedi-portfolio-server-phi.vercel.app/api';

const SocialIcons = () => {
  const [socialLinks, setSocialLinks] = useState({
    github: "https://github.com/mh-mehedihasan",
    linkedin: "https://www.linkedin.com/in/mehedihasan",
    twitter: "https://x.com/mehedihasan",
    instagram: "#",
  });
  const [resumeUrl, setResumeUrl] = useState("#");

  useEffect(() => {
    axios.get(`${API}/contact`)
      .then(res => {
        if (res.data) {
          setSocialLinks({
            github: res.data.github || socialLinks.github,
            linkedin: res.data.linkedin || socialLinks.linkedin,
            twitter: res.data.twitter || socialLinks.twitter,
            instagram: res.data.instagram || socialLinks.instagram,
          });
        }
      })
      .catch(() => {});

    // Fetch resume URL from settings
    axios.get(`${API}/settings`)
      .then(res => {
        if (res.data?.resumeUrl) {
          setResumeUrl(res.data.resumeUrl);
        }
      })
      .catch(() => {});

    const social = document.getElementById("social") as HTMLElement;

    social.querySelectorAll("span").forEach((item) => {
      const elem = item as HTMLElement;
      const link = elem.querySelector("a") as HTMLElement;

      let rafId = 0;
      const getCenter = () => {
        const rect = elem.getBoundingClientRect();
        return { x: rect.width / 2, y: rect.height / 2 };
      };

      const center = getCenter();
      let mouseX = center.x;
      let mouseY = center.y;
      let currentX = center.x;
      let currentY = center.y;

      link.style.setProperty("--siLeft", `${center.x}px`);
      link.style.setProperty("--siTop", `${center.y}px`);

      const updatePosition = () => {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        link.style.setProperty("--siLeft", `${currentX}px`);
        link.style.setProperty("--siTop", `${currentY}px`);

        rafId = requestAnimationFrame(updatePosition);
      };

      const onMouseMove = (e: MouseEvent) => {
        const rect = elem.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          mouseX = x;
          mouseY = y;
        } else {
          mouseX = rect.width / 2;
          mouseY = rect.height / 2;
        }
      };

      const onMouseEnter = (e: MouseEvent) => {
        const rect = elem.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      };

      const onMouseLeave = () => {
        const nextCenter = getCenter();
        mouseX = nextCenter.x;
        mouseY = nextCenter.y;
      };

      elem.addEventListener("mousemove", onMouseMove);
      elem.addEventListener("mouseenter", onMouseEnter);
      elem.addEventListener("mouseleave", onMouseLeave);

      updatePosition();

      return () => {
        elem.removeEventListener("mousemove", onMouseMove);
        elem.removeEventListener("mouseenter", onMouseEnter);
        elem.removeEventListener("mouseleave", onMouseLeave);
        cancelAnimationFrame(rafId);
      };
    });
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href={socialLinks.github} target="_blank">
            <FaGithub />
          </a>
        </span>
        <span>
          <a href={socialLinks.linkedin} target="_blank">
            <FaLinkedinIn />
          </a>
        </span>
        <span>
          <a href={socialLinks.twitter} target="_blank">
            <FaXTwitter />
          </a>
        </span>
        <span>
          <a href={socialLinks.instagram} target="_blank">
            <FaInstagram />
          </a>
        </span>
      </div>
      <a className="resume-button" href={resumeUrl} target="_blank" rel="noopener noreferrer">
        <HoverLinks text="RESUME" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
