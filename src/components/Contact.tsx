import { useState, useEffect } from "react";
import axios from "axios";
import { MdCopyright } from "react-icons/md";
import "./styles/Contact.css";

interface ContactData {
  email: string;
  education: string;
  github: string;
  linkedin: string;
  twitter: string;
  instagram: string;
}

const FALLBACK: ContactData = {
  email: "mehedihasan123456789.mh.mh@gmail.com",
  education: "BSc in Computer Science and Engineering",
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
      .then(res => { if (res.data?.email) setData({ ...FALLBACK, ...res.data }); })
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
            <h4>Education</h4>
            <p>{data.education}</p>
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>Mehedi Hasan</span>
            </h2>
            <h5>
              <MdCopyright /> 2026
              <span className="contact-sep">|</span>
              <a href="/admin" className="contact-admin-link" data-cursor="disable">
                Admin
              </a>
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
