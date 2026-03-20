import { useEffect, useMemo, useState } from "react";
import "./styles/WhatIDo.css";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import axios from "axios";

export interface WhatIDoItem {
  _id?: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[] | string;
  order?: number;
}

const WhatIDo = ({ previewData }: { previewData?: WhatIDoItem[] }) => {
  const [services, setServices] = useState<WhatIDoItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (previewData) {
      setServices(previewData);
      return;
    }
    axios.get("https://mehedi-portfolio-server-phi.vercel.app/api/whatido")
      .then(res => setServices(res.data))
      .catch(() => {});
  }, [previewData]);

  const isTouch = useMemo(() => ScrollTrigger.isTouch === 1, []);

  useEffect(() => {
    if (!services.length) return;
    // Keep one card expanded by default so the section always has a clear focal point.
    setActiveIndex(0);
  }, [services.length]);

  return (
    <div className="whatIDO">
      <div className="what-box">
        <h2 className="title">
          W<span className="hat-h2">HAT</span>
          <div>
            I<span className="do-h2"> DO</span>
          </div>
        </h2>
      </div>
      <div className="what-box">
        <div
          className="what-box-in"
          onMouseLeave={() => {
            if (!isTouch && services.length > 0) setActiveIndex(0);
          }}
        >
          <div className="what-border2">
            <svg width="100%">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
              <line
                x1="100%"
                y1="0"
                x2="100%"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
            </svg>
          </div>
          {services.map((item: WhatIDoItem, index: number) => {
            const tagsList = typeof item.tags === 'string' 
              ? item.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
              : (item.tags || []);
            const isExpanded = activeIndex === index;
            
            return (
              <div
                key={item._id || index}
                className={`what-content ${isExpanded ? "what-content-expanded" : "what-content-collapsed"}`}
                onMouseEnter={() => {
                  if (!isTouch) setActiveIndex(index);
                }}
                onClick={() => {
                  if (!isTouch) return;
                  setActiveIndex((prev) => (prev === index ? null : index));
                }}
              >
                <div className="what-border1">
                  <svg height="100%">
                    {index === 0 && (
                      <line x1="0" y1="0" x2="100%" y2="0" stroke="white" strokeWidth="2" strokeDasharray="6,6" />
                    )}
                    <line x1="0" y1="100%" x2="100%" y2="100%" stroke="white" strokeWidth="2" strokeDasharray="6,6" />
                  </svg>
                </div>
                <div className="what-corner"></div>

                <div className="what-content-in">
                  <h3>{item.title}</h3>
                  <h4>{item.subtitle}</h4>
                  <p>{item.description}</p>
                  <h5>Skillset & tools</h5>
                  <div className="what-content-flex">
                    {tagsList.map((tag: string) => (
                      <div key={tag} className="what-tags">{tag}</div>
                    ))}
                  </div>
                  <div className="what-arrow"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;
