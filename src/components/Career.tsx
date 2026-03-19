import { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Career.css";

interface CareerData {
  _id?: string;
  title: string;
  company: string;
  dateRange: string;
  description: string;
}

const Career = ({ previewData }: { previewData?: CareerData[] }) => {
  const [careers, setCareers] = useState<CareerData[]>([]);

  useEffect(() => {
    if (previewData) {
      setCareers(previewData);
      return;
    }
    const fetchCareers = async () => {
      try {
<<<<<<< HEAD
        const res = await axios.get("http://localhost:5000/api/career");
=======
        const res = await axios.get("https://mehedi-portfolio-server-phi.vercel.app/api/career");
>>>>>>> c5d82efbffcf14aae0061f222722e044f14803b9
        setCareers(res.data);
      } catch (err) {
        console.error("Error fetching career history:", err);
      }
    };
    fetchCareers();
  }, [previewData]);

  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          
          {careers.map((job) => (
            <div className="career-info-box" key={job._id}>
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
