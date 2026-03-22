import { useState, useEffect } from "react";
import axios from "axios";
import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";

interface ContactData {
  email: string;
  location: string;
  github: string;
  linkedin: string;
  twitter: string;
  instagram: string;
}

const FALLBACK: ContactData = {
  email: "mehedihasan123456789.mh.mh@gmail.com",
  location: "Dhaka, Bangladesh",
  github: "https://github.com/mh-mehedihasan",
  linkedin: "https://www.linkedin.com/in/mehedihasan",
  twitter: "https://x.com/mehedihasan",
  instagram: "#",
};

const Contact = ({ previewData }: { previewData?: ContactData }) => {
  const [data, setData] = useState<ContactData>(FALLBACK);

  useEffect(() => {
    if (previewData) {
      setData(previewData);
      return;
    }
    axios.get('https://mehedi-portfolio-server-phi.vercel.app/api/contact')
      .then(res => {
        if (res.data?.email) {
          setData({
            ...FALLBACK,
            ...res.data,
            // Legacy compatibility for old payloads that still use education.
            location: res.data.location || res.data.education || FALLBACK.location,
          });
        }
      })
      .catch(() => {});
  }, [previewData]);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${data.email}`} data-cursor="disable" className="contact-email-link">
                <span className="contact-email-text">
                  <span className="contact-email-text-in">
                    {data.email}
                    <span aria-hidden="true">{data.email}</span>
                  </span>
                </span>
              </a>
            </p>
            <h4>Location</h4>
            <p>{data.location}</p>
          </div>
          <div className="contact-box contact-social-col">
            <h4>Social</h4>
            <a href={data.github} target="_blank" rel="noreferrer" data-cursor="disable" className="contact-social">
              Github <MdArrowOutward />
            </a>
            <a href={data.linkedin} target="_blank" rel="noreferrer" data-cursor="disable" className="contact-social">
              Linkedin <MdArrowOutward />
            </a>
            <a href={data.twitter} target="_blank" rel="noreferrer" data-cursor="disable" className="contact-social">
              Twitter <MdArrowOutward />
            </a>
            <a href={data.instagram} target="_blank" rel="noreferrer" data-cursor="disable" className="contact-social">
              Instagram <MdArrowOutward />
            </a>
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>Mehedi Hasan</span>
            </h2>
            <h5>
              <MdCopyright /> 2026
              <span className="contact-sep">|</span>
              <a href="/admin" className="contact-admin-link" data-cursor="disable">Admin</a>
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
