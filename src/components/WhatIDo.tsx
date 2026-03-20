import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<(HTMLDivElement | null)[]>([]);
  const setRef = (el: HTMLDivElement | null, index: number) => {
    containerRef.current[index] = el;
  };
  useEffect(() => {
    if (previewData) {
      setServices(previewData);
      return;
    }
    axios.get("http://localhost:5000/api/whatido")
      .then(res => setServices(res.data))
      .catch(() => {});
  }, [previewData]);

  useEffect(() => {
    if (ScrollTrigger.isTouch) {
      containerRef.current.forEach((container) => {
        if (container) {
          container.classList.remove("what-noTouch");
          container.addEventListener("click", () => handleClick(container));
        }
      });
    }
    return () => {
      containerRef.current.forEach((container) => {
        if (container) {
          container.removeEventListener("click", () => handleClick(container));
        }
      });
    };
  }, [services]);
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
        <div className="what-box-in">
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
            
            return (
              <div
                key={item._id || index}
                className="what-content what-noTouch"
                ref={(el) => setRef(el, index)}
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

function handleClick(container: HTMLDivElement) {
  container.classList.toggle("what-content-active");
  container.classList.remove("what-sibling");
  if (container.parentElement) {
    const siblings = Array.from(container.parentElement.children);

    siblings.forEach((sibling) => {
      if (sibling !== container) {
        sibling.classList.remove("what-content-active");
        sibling.classList.toggle("what-sibling");
      }
    });
  }
}
