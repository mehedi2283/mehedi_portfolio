import { useState, useEffect } from "react";
import axios from "axios";
import "./styles/About.css";

const FALLBACK_BIO = "AI Automation Specialist focused on building intelligent automation systems and workflow integrations. Experienced in designing and deploying automation solutions using platforms such as n8n, Zapier, and Make.com to connect multiple applications and streamline business processes. Skilled in CRM automation, AI voice agents, and API integrations using tools like GoHighLevel, Vapi, and Retell. Passionate about leveraging automation technologies to improve operational efficiency and reduce manual work.";

type AboutCategory = "headline" | "body" | "note";

type AboutBlock = {
  category: AboutCategory;
  text: string;
};

type AboutPayload = {
  bio: string;
  aboutBlocks: AboutBlock[];
};

const parseBioLines = (text: string) => {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return { lead: "", rest: [] as string[] };

  const manualLines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // If user did not provide manual line breaks, keep old behavior for readability.
  if (manualLines.length <= 1) {
    const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length > 1) {
      return { lead: sentences[0], rest: sentences.slice(1) };
    }
  }

  return {
    lead: manualLines[0] || "",
    rest: manualLines.slice(1),
  };
};

const renderHighlightedText = (text: string) => {
  const chunks = text.split(/(\{\{.*?\}\})/g).filter(Boolean);
  return chunks.map((chunk, index) => {
    const match = chunk.match(/^\{\{(.*?)\}\}$/);
    if (match) {
      return (
        <span key={`hl-${index}`} className="about-highlight">
          {match[1]}
        </span>
      );
    }
    return <span key={`txt-${index}`}>{chunk}</span>;
  });
};

const blocksFromBio = (text: string): AboutBlock[] => {
  const { lead, rest } = parseBioLines(text);
  const blocks: AboutBlock[] = [];
  if (lead) blocks.push({ category: "headline", text: lead });
  rest.forEach((line) => blocks.push({ category: "body", text: line }));
  return blocks;
};

const About = ({ previewBio, previewBlocks }: { previewBio?: string; previewBlocks?: AboutBlock[] }) => {
  const [content, setContent] = useState<AboutPayload>({
    bio: FALLBACK_BIO,
    aboutBlocks: blocksFromBio(FALLBACK_BIO),
  });

  useEffect(() => {
    if (previewBio !== undefined || previewBlocks !== undefined) {
      const bio = previewBio ?? "";
      const aboutBlocks = Array.isArray(previewBlocks) ? previewBlocks : blocksFromBio(bio);
      setContent({ bio, aboutBlocks });
      return;
    }
    axios.get('https://mehedi-portfolio-server-phi.vercel.app/api/about')
      .then(res => {
        const bio = res.data?.bio || FALLBACK_BIO;
        const aboutBlocks = Array.isArray(res.data?.aboutBlocks) && res.data.aboutBlocks.length
          ? res.data.aboutBlocks
          : blocksFromBio(bio);
        setContent({ bio, aboutBlocks });
      })
      .catch(() => {});
  }, [previewBio, previewBlocks]);

  const blocksToRender = content.aboutBlocks.length ? content.aboutBlocks : blocksFromBio(content.bio);
  const classByCategory: Record<AboutCategory, string> = {
    headline: "para-lead",
    body: "para-sub",
    note: "para-note",
  };

  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">About Me</h3>
        <div className="about-copy">
          {blocksToRender.map((block, index) => (
            <p className={`para ${classByCategory[block.category] || "para-sub"}`} key={`${block.text.slice(0, 24)}-${index}`}>
              {renderHighlightedText(block.text)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;

