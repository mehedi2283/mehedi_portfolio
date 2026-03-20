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

  const setHoverOrigin = (event: React.MouseEvent<HTMLSpanElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    target.style.setProperty("--hover-x", `${x}px`);
    target.style.setProperty("--hover-y", `${y}px`);
  };

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
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span onMouseEnter={setHoverOrigin} onMouseMove={setHoverOrigin}>
          <a href={socialLinks.github} target="_blank">
            <FaGithub />
          </a>
        </span>
        <span onMouseEnter={setHoverOrigin} onMouseMove={setHoverOrigin}>
          <a href={socialLinks.linkedin} target="_blank">
            <FaLinkedinIn />
          </a>
        </span>
        <span onMouseEnter={setHoverOrigin} onMouseMove={setHoverOrigin}>
          <a href={socialLinks.twitter} target="_blank">
            <FaXTwitter />
          </a>
        </span>
        <span onMouseEnter={setHoverOrigin} onMouseMove={setHoverOrigin}>
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
