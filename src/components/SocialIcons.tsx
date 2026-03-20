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

type SocialLinks = {
  github: string;
  linkedin: string;
  twitter: string;
  instagram: string;
};

const SocialIcons = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    github: "https://github.com/mh-mehedihasan",
    linkedin: "https://www.linkedin.com/in/mehedihasan",
    twitter: "https://x.com/mehedihasan",
    instagram: "#",
  });
  const [resumeUrl, setResumeUrl] = useState("#");

  useEffect(() => {
    let mounted = true;

    axios.get(`${API}/contact`)
      .then(res => {
        if (mounted && res.data) {
          setSocialLinks({
            github: res.data.github || socialLinks.github,
            linkedin: res.data.linkedin || socialLinks.linkedin,
            twitter: res.data.twitter || socialLinks.twitter,
            instagram: res.data.instagram || socialLinks.instagram,
          });
        }
      })
      .catch(() => {});

    axios.get(`${API}/settings`)
      .then(res => {
        if (mounted && res.data?.resumeUrl) {
          setResumeUrl(res.data.resumeUrl);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" aria-label="Social links">
        <a className="social-link" href={socialLinks.github} target="_blank" rel="noopener noreferrer">
          <FaGithub />
        </a>
        <a className="social-link" href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
          <FaLinkedinIn />
        </a>
        <a className="social-link" href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
          <FaXTwitter />
        </a>
        <a className="social-link" href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
          <FaInstagram />
        </a>
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
