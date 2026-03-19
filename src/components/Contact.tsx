import { useState, useEffect } from "react";
import axios from "axios";
import { MdArrowOutward, MdCopyright } from "react-icons/md";
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
<<<<<<< HEAD
    axios.get('http://localhost:5000/api/contact')
      .then(res => { if (res.data?.email) setData({ ...FALLBACK, ...res.data }); })
      .catch(() => {});
  }, [previewData]);
=======
    axios.get('https://mehedi-portfolio-server-phi.vercel.app/api/contact')
      .then(res => { if (res.data?.email) setData({ ...FALLBACK, ...res.data }); })
      .catch(() => {});
  }, []);
>>>>>>> c5d82efbffcf14aae0061f222722e044f14803b9

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>Contact</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${data.email}`} data-cursor="disable">{data.email}</a>
            </p>
            <h4>Education</h4>
            <p>{data.education}</p>
          </div>
          <div className="contact-box">
            <h4>Social</h4>
            <a href={data.github} target="_blank" data-cursor="disable" className="contact-social">
              Github <MdArrowOutward />
            </a>
            <a href={data.linkedin} target="_blank" data-cursor="disable" className="contact-social">
              Linkedin <MdArrowOutward />
            </a>
            <a href={data.twitter} target="_blank" data-cursor="disable" className="contact-social">
              Twitter <MdArrowOutward />
            </a>
            <a href={data.instagram} target="_blank" data-cursor="disable" className="contact-social">
              Instagram <MdArrowOutward />
            </a>
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>Mehedi Hasan</span>
            </h2>
            <h5>
              <MdCopyright /> 2026
<<<<<<< HEAD
              <span className="contact-sep">|</span>
              <a href="/admin" className="contact-admin-link" data-cursor="disable">
                Admin
              </a>
=======
>>>>>>> c5d82efbffcf14aae0061f222722e044f14803b9
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
