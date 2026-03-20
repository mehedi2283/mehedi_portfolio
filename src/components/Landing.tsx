import { PropsWithChildren, useState, useEffect } from "react";
import axios from "axios";
import "./styles/Landing.css";

interface LandingData {
  firstName: string;
  lastName: string;
  role1: string;
  role2: string;
}

const Landing = ({ children, previewData }: PropsWithChildren<{ previewData?: LandingData }>) => {
  const [data, setData] = useState<LandingData>({
    firstName: 'MEHEDI',
    lastName: 'HASAN',
    role1: 'Specialist',
    role2: 'Engineer',
  });

  useEffect(() => {
    if (previewData) {
      setData(previewData);
      return;
    }
    axios.get('http://localhost:5000/api/landing')
      .then(res => { if (res.data?.firstName) setData(res.data); })
      .catch(() => {});
  }, [previewData]);

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              {data.firstName}
              <br />
              <span>{data.lastName}</span>
            </h1>
          </div>
          <div className="landing-info">
            <h3>An AI Automation</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">{data.role1}</div>
              <div className="landing-h2-2">{data.role2}</div>
            </h2>
            <h2>
              <div className="landing-h2-info">{data.role2}</div>
              <div className="landing-h2-info-1">{data.role1}</div>
            </h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;

