import { useState, useEffect } from "react";
import axios from "axios";
import "./styles/About.css";

const FALLBACK_BIO = "AI Automation Specialist focused on building intelligent automation systems and workflow integrations. Experienced in designing and deploying automation solutions using platforms such as n8n, Zapier, and Make.com to connect multiple applications and streamline business processes. Skilled in CRM automation, AI voice agents, and API integrations using tools like GoHighLevel, Vapi, and Retell. Passionate about leveraging automation technologies to improve operational efficiency and reduce manual work.";

const About = ({ previewBio }: { previewBio?: string }) => {
  const [bio, setBio] = useState(FALLBACK_BIO);

  useEffect(() => {
    if (previewBio !== undefined) {
      setBio(previewBio);
      return;
    }
<<<<<<< HEAD
    axios.get('http://localhost:5000/api/about')
      .then(res => { if (res.data?.bio) setBio(res.data.bio); })
      .catch(() => {});
  }, [previewBio]);
=======
    axios.get('https://mehedi-portfolio-server-phi.vercel.app/api/about')
      .then(res => { if (res.data?.bio) setBio(res.data.bio); })
      .catch(() => {});
  }, []);
>>>>>>> c5d82efbffcf14aae0061f222722e044f14803b9

  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">About Me</h3>
        <p className="para">{bio}</p>
      </div>
    </div>
  );
};

export default About;

