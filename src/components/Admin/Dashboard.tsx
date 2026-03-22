import { useState, useEffect, useRef, useLayoutEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import { MdHome, MdMenu, MdChevronLeft, MdChevronRight, MdSettings } from 'react-icons/md';
import { FiGrid, FiFolder, FiBriefcase, FiUser, FiHome, FiTrendingUp, FiTool, FiMail, FiFileText, FiLogOut } from 'react-icons/fi';
import './Admin.css';
import ConfirmModal from './ConfirmModal';
import Landing from '../Landing';
import About from '../About';
import Contact from '../Contact';
import Career from '../Career';
import WhatIDo from '../WhatIDo';
import { SingleTechBall } from '../SingleTechBall';
import Work from '../Work';

const TechStackPreview = lazy(() => import('../TechStack'));

const API = 'https://mehedi-portfolio-server-phi.vercel.app/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Career   { _id?: string; title: string; company: string; dateRange: string; description: string; order: number; }
interface Project  { _id?: string; title: string; category: string; tools: string; image: string; order: number; }
interface WhatIDo  { _id?: string; title: string; subtitle: string; description: string; tags: string; order: number; }
interface TechItem { _id?: string; name: string; imageUrl: string; category: 'automation' | 'extra'; highlighted?: boolean; }
interface LandingData { firstName: string; lastName: string; role1: string; role2: string; }
type AboutCategory = 'headline' | 'body' | 'note';
interface AboutBlock { category: AboutCategory; text: string; }
interface AboutData   { bio: string; aboutBlocks: AboutBlock[]; }
interface ContactData { email: string; location: string; github: string; linkedin: string; twitter: string; instagram: string; }
interface SecurityData { passkey1: string; passkey2: string; }

async function processImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const outW = 2048;
        const outH = 1024;
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));

        ctx.clearRect(0, 0, outW, outH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Most logos have light backgrounds. Fill first to avoid transparent seams on sphere poles.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);

        const srcRatio = img.width / img.height;

        if (srcRatio >= 1.25) {
          // Wide input (like two logos side-by-side): map each half to opposite sides of the sphere.
          const halfW = Math.floor(img.width / 2);
          const logoBox = Math.floor(outH * 0.62);

          const drawHalfCentered = (sx: number, centerX: number) => {
            const scale = Math.min(logoBox / halfW, logoBox / img.height);
            const dw = halfW * scale;
            const dh = img.height * scale;
            const dx = centerX - dw / 2;
            const dy = outH / 2 - dh / 2;
            ctx.drawImage(img, sx, 0, halfW, img.height, dx, dy, dw, dh);
          };

          // Quarter and three-quarter x positions become opposite longitudes on the sphere.
          drawHalfCentered(0, outW * 0.25);
          drawHalfCentered(halfW, outW * 0.75);
        } else {
          // Fallback: single logo/image -> cover-fit panoramic texture.
          const scale = Math.max(outW / img.width, outH / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (outW - w) / 2;
          const y = (outH - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        }

        canvas.toBlob(b => b ? resolve(b) : reject('Blob error'), 'image/png');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Section = 'overview' | 'projects' | 'career' | 'about' | 'landing' | 'whatido' | 'techstack' | 'contact' | 'resumes' | 'security' | 'settings';

const NAV: { id: Section; label: string; iconId: string }[] = [
  { id: 'overview',  label: 'Overview',   iconId: 'dashboard'  },
  { id: 'projects',  label: 'Projects',   iconId: 'projects'  },
  { id: 'career',    label: 'Career',     iconId: 'career'  },
  { id: 'about',     label: 'About',      iconId: 'about'  },
  { id: 'landing',   label: 'Landing',    iconId: 'landing'  },
  { id: 'whatido',   label: 'What I Do',  iconId: 'whatido'  },
  { id: 'techstack', label: 'Tech Stack', iconId: 'techstack'  },
  { id: 'contact',   label: 'Contact',    iconId: 'contact'  },
  { id: 'resumes',   label: 'Resumes',    iconId: 'resumes'  },
  { id: 'settings',  label: 'Settings',   iconId: 'settings'  },
];

// Helper function to render icons
function renderNavIcon(iconId: string) {
  const iconProps = { size: 20, strokeWidth: 1.5 };
  switch(iconId) {
    case 'dashboard': return <FiGrid {...iconProps} />;
    case 'projects': return <FiFolder {...iconProps} />;
    case 'career': return <FiBriefcase {...iconProps} />;
    case 'about': return <FiUser {...iconProps} />;
    case 'landing': return <FiHome {...iconProps} />;
    case 'whatido': return <FiTrendingUp {...iconProps} />;
    case 'techstack': return <FiTool {...iconProps} />;
    case 'contact': return <FiMail {...iconProps} />;
    case 'resumes': return <FiFileText {...iconProps} />;
    case 'settings': return <MdSettings size={20} />;
    default: return <FiGrid {...iconProps} />;
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useList<T>(url: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = () => {
    setLoading(true);
    axios.get(url).then(r => { setItems(r.data); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);
  return { items, loading, refresh: fetch };
}

function useSingle<T>(url: string, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const refresh = () => axios.get(url).then(r => setData({ ...fallback, ...r.data })).catch(() => {});
  useEffect(() => { refresh(); }, []);
  return { data, setData, refresh };
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const show = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="panel-header">
      <h2 className="panel-title">{title}</h2>
      <p className="panel-sub">{subtitle}</p>
    </div>
  );
}

function StatCard({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div className="stat-card" style={{ '--accent': color } as React.CSSProperties}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <div className="stat-count">{count}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function PreviewShell({ children, label = 'Live Preview' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="preview-shell">
      <div className="preview-shell-header">
        <span className="preview-dot red" /><span className="preview-dot amber" /><span className="preview-dot green" />
        <span className="preview-shell-label">{label}</span>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '600px', overflow: 'hidden' }}>
        <div className="custom-scrollbar" style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '600px',
          overflowY: 'auto',
          overflowX: 'auto',
          backgroundColor: '#0a0a0f'
        }}>
        <div style={{ minHeight: '100%' }}>
          {children}
        </div>
      </div>
      </div>
    </div>
  );
}

function FrontendSectionPreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="frontend-section-preview container-main">
      <div id="smooth-wrapper">
        <div id="smooth-content">
          {children}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewPanel() {
  const { items: projects } = useList<Project>(`${API}/projects`);
  const { items: careers  } = useList<Career>(`${API}/career`);
  const { items: tech     } = useList<TechItem>(`${API}/techstack`);
  const { items: services } = useList<WhatIDo>(`${API}/whatido`);
  return (
    <div className="panel">
      <SectionHeader title="Dashboard Overview" subtitle="Quick stats on your portfolio content" />
      <div className="stats-grid">
        <StatCard icon="🗂" label="Projects"       count={projects.length} color="#7c3aed" />
        <StatCard icon="💼" label="Career Entries" count={careers.length}  color="#0ea5e9" />
        <StatCard icon="🔧" label="Tech Items"     count={tech.length}     color="#10b981" />
        <StatCard icon="⚙️" label="Services"       count={services.length} color="#f59e0b" />
      </div>
      <div className="overview-tip">
        <span>👈</span> Use the sidebar to manage each section of your portfolio. Every form has a <strong>live preview</strong> so you can see exactly how it looks before saving.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SETTINGS & THEME
// ═══════════════════════════════════════════════════════════════════════════════
interface ResumeFile { id: string; name: string; webViewLink: string; createdTime: string; }

// ═══════════════════════════════════════════════════════════════════════════════
//  RESUMES
// ═══════════════════════════════════════════════════════════════════════════════
function ResumesPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { items: resumes, refresh: refreshResumes, loading } = useList<ResumeFile>(`${API}/settings/resumes`);
  const { data: settings, setData: setSettings, refresh: refreshSettings } = useSingle<{ resumeUrl: string }>(`${API}/settings`, { resumeUrl: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewResume, setPreviewResume] = useState<ResumeFile | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; url: string; isDeleting: boolean }>({ isOpen: false, id: '', url: '', isDeleting: false });

  const uploadResume = async () => {
    if (!resumeFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      await axios.post(`${API}/settings/resume/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Resume uploaded to Google Drive!');
      setResumeFile(null);
      refreshResumes();
      refreshSettings();
    } catch (error: unknown) {
      let serverMessage = 'Error uploading resume';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        serverMessage = axiosError.response?.data?.message || serverMessage;
      }
      showToast(serverMessage, 'error');
    }
    setIsUploading(false);
  };

  const setActive = async (url: string) => {
    try {
      await axios.put(`${API}/settings`, { resumeUrl: url });
      setSettings({ ...settings, resumeUrl: url });
      showToast('Active resume updated!');
    } catch {
      showToast('Error updating active resume', 'error');
    }
  };

  const deleteResume = (id: string, url: string) => {
    setDeleteModal({ isOpen: true, id, url, isDeleting: false });
  };

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      if (previewResume?.webViewLink === deleteModal.url) setPreviewResume(null);
      await axios.delete(`${API}/settings/resumes/${deleteModal.id}`);
      showToast('Resume deleted successfully!');
      refreshResumes();
      if (settings.resumeUrl === deleteModal.url) {
        setSettings({ ...settings, resumeUrl: '' });
      }
      setDeleteModal({ isOpen: false, id: '', url: '', isDeleting: false });
    } catch {
      showToast('Error deleting resume', 'error');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SectionHeader title="Resume Management" subtitle="Upload and manage resumes stored in Google Drive" />
      
      <div className="resume-split-layout">
        {/* Left Side: Upload & List */}
        <div className={`resume-manage-side custom-scrollbar ${previewResume ? 'has-preview' : ''}`}>
          
          <div className="item-card padded-card">
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '24px', fontSize: '18px' }}>Upload New Resume</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <div style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  border: '2px dashed rgba(255,255,255,0.15)', 
                  textAlign: 'center',
                  transition: '0.2s',
                  background: resumeFile ? 'rgba(124, 58, 237, 0.1)' : 'transparent'
                }}>
                  <p style={{ margin: '0', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    {resumeFile ? `📄 ${resumeFile.name}` : '📎 Click to select a PDF file'}
                  </p>
                </div>
                <input 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  onChange={e => { if (e.target.files?.[0]) setResumeFile(e.target.files[0]); }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {resumeFile && (
              <button 
                className="btn-save" 
                type="button" 
                onClick={uploadResume} 
                disabled={isUploading}
                style={{ marginTop: '16px', width: '100%' }}
              >
                {isUploading ? 'Uploading to Google Drive...' : 'Upload Resume'}
              </button>
            )}
          </div>

          <div className="item-card padded-card" style={{ flex: 1 }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '24px', fontSize: '18px' }}>All Resumes</h3>
            {loading ? <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading resumes from Google Drive...</p> : resumes.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.5)' }}>No resumes found in Google Drive.</p> : (
              <div className="resume-list-container">
                {resumes.map(r => {
                  const isActive = settings.resumeUrl === r.webViewLink;
                  const isViewing = previewResume?.id === r.id;
                  return (
                    <div key={r.id} className={`resume-item-row ${isViewing ? 'viewing' : ''}`} style={{ border: `1px solid ${isActive ? '#7c3aed' : 'rgba(255,255,255,0.1)'}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</strong>
                          {isActive && <span style={{ background: '#7c3aed', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Active</span>}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px' }}>
                          Uploaded: {new Date(r.createdTime).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="resume-actions-row">
                        <button className="btn-save" style={{ background: isViewing ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setPreviewResume(isViewing ? null : r)}>{isViewing ? 'Close' : 'Preview'}</button>
                        {!isActive && <button className="btn-save" onClick={() => setActive(r.webViewLink)}>Set Active</button>}
                        <button className="btn-cancel" style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => deleteResume(r.id, r.webViewLink)}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side / Modal Base: PDF Preview */}
        {previewResume && (
          <>
            <div className="resume-preview-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Live Preview</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <a href={previewResume.webViewLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accentColor)', fontSize: '12px', textDecoration: 'none' }}>Open in Drive ↗</a>
                  <button onClick={() => setPreviewResume(null)} className="close-preview-mobile" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '24px', lineHeight: 1, padding: '4px 8px' }}>&times;</button>
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>Loading Document...</div>
                <iframe src={`${API}/settings/resumes/${previewResume.id}/preview`} style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 1 }} allow="autoplay" />
              </div>
            </div>
            {/* Modal Overlay for Mobile */}
            <div className="resume-preview-overlay" onClick={() => setPreviewResume(null)} />
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Resume?"
        message="Are you sure you want to permanently delete this resume from Google Drive? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: '', url: '', isDeleting: false })}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteModal.isDeleting}
        isDangerous={true}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SETTINGS & THEME
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { data, setData, refresh } = useSingle<SecurityData & { themeColor: string }>(`${API}/settings`, { passkey1: '', passkey2: '', themeColor: '#5eead4' });
  const [isSaving, setIsSaving] = useState(false);

  const applyTheme = (color: string) => {
    document.documentElement.style.setProperty('--accentColor', color);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put(`${API}/settings`, data);
      showToast('Settings updated successfully!');
      applyTheme(data.themeColor);
      refresh();
    } catch {
      showToast('Error updating settings', 'error');
    }
    setIsSaving(false);
  };

  return (
    <div className="panel">
      <SectionHeader title="Dashboard Settings" subtitle="Manage your dashboard security and global theme" />
      <div className="item-card padded-card" style={{ maxWidth: '600px' }}>
        <form className="dash-form" onSubmit={save}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '24px', fontSize: '18px' }}>Security Passkeys</h3>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
            <label>First Passkey<input type="text" value={data.passkey1} onChange={e => setData({...data, passkey1: e.target.value})} placeholder="e.g. 1358549" /></label>
            <label>Second Passkey<input type="text" value={data.passkey2} onChange={e => setData({...data, passkey2: e.target.value})} placeholder="e.g. 2283" /></label>
          </div>
          
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', margin: '32px 0 24px', fontSize: '18px' }}>Global Theme</h3>
          <div className="form-grid">
            <label>
              Primary Accent Color
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <input 
                  type="color" 
                  value={data.themeColor} 
                  onChange={e => setData({...data, themeColor: e.target.value})} 
                  style={{ width: '60px', height: '40px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <input 
                  type="text" 
                  value={data.themeColor} 
                  onChange={e => setData({...data, themeColor: e.target.value})} 
                  style={{ flex: 1, letterSpacing: '1px', textTransform: 'uppercase' }}
                />
              </div>
            </label>
          </div>

          <button className="btn-save" type="submit" disabled={isSaving} style={{ marginTop: '32px', width: '100%' }}>
            {isSaving ? 'Updating...' : 'Save All Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [stage, setStage] = useState<1 | 2>(1);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    try {
      const res = await axios.post(`${API}/settings/verify/${stage}`, { passkey: input });
      if (res.data.success) {
        if (stage === 1) {
          setStage(2);
          setInput('');
        } else {
          onAuth();
        }
      }
    } catch {
      setError('Invalid passkey. Please try again.');
      setInput('');
    }
    setIsVerifying(false);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ position: 'relative' }}>
        <button 
          title="Back to Home"
          onClick={() => window.location.href = '/'}
          style={{ 
            position: 'absolute', 
            top: '24px', 
            left: '24px', 
            background: 'none', 
            border: 'none', 
            color: 'rgba(255,255,255,0.4)', 
            fontSize: '24px', 
            cursor: 'pointer',
            transition: 'color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={e => e.currentTarget.style.color = '#fff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <MdHome />
        </button>
        <span className="auth-icon">{stage === 1 ? '🔐' : '🔑'}</span>
        <h2 className="auth-title">{stage === 1 ? 'First Passkey' : 'Final Step'}</h2>
        <p className="auth-desc">
          {stage === 1 
            ? 'Enter your primary security code to begin.' 
            : 'Almost there! Enter your secondary security code.'}
        </p>
        <form onSubmit={handleVerify}>
          <div className="passkey-field">
            <input 
              type="password" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              autoFocus 
              required
              placeholder="••••••"
            />
            {error && <div className="auth-error">{error}</div>}
          </div>
          <button className="btn-auth" type="submit" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectPreview({ form, items }: { form: Project, items: Project[] }) {
  const hasDraft = Boolean(form.title?.trim() || form.category?.trim() || form.tools?.trim() || form.image?.trim());
  const previewItems = hasDraft ? [...items.filter(i => i._id !== form._id), form] : items;
  return (
    <PreviewShell label="Project Carousel Preview">
      <FrontendSectionPreview>
        <Work previewData={previewItems} />
      </FrontendSectionPreview>
    </PreviewShell>
  );
}

function ProjectsPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { items: projects, refresh } = useList<Project>(`${API}/projects`);
  const empty: Project = { title: '', category: '', tools: '', image: '', order: 0 };
  const [form, setForm] = useState<Project>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalImageUrl = form.image;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        const res = await axios.post('https://api.imgbb.com/1/upload?key=0dfba9f982c03fb77410bf4d22445cfd', formData);
        finalImageUrl = res.data.data.url;
      }
      const payload = { ...form, image: finalImageUrl };

      if (editId) await axios.put(`${API}/projects/${editId}`, payload);
      else await axios.post(`${API}/projects`, payload);
      showToast(editId ? 'Project updated!' : 'Project added!');
      setForm(empty); setEditId(null); setShowForm(false); setSelectedFile(null); setLocalPreview(''); refresh();
    } catch { showToast('Error saving project', 'error'); }
    setIsUploading(false);
  };

  const edit = (p: Project) => { setForm({ ...p, _id: undefined }); setEditId(p._id!); setSelectedFile(null); setLocalPreview(''); setShowForm(true); };
  const del = (id: string) => setDeleteId(id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setLocalPreview(URL.createObjectURL(file));
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await axios.delete(`${API}/projects/${deleteId}`); showToast('Deleted!'); refresh();
    setDeleteId(null);
  };
  return (
    <div className="panel">
      <SectionHeader title="Projects" subtitle="Manage portfolio projects displayed in the Work carousel" />
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <>
      <button className="btn-add" onClick={() => { setForm(empty); setEditId(null); setSelectedFile(null); setLocalPreview(''); setShowForm(true); }}>+ Add Project</button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Project' : 'Add Project'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="dash-form" style={{marginBottom: 24}}  onSubmit={submit}>
            <div className="form-grid">
              <label>Title<input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></label>
              <label>Category<input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required /></label>
              <label>Tools / Tech<input value={form.tools} onChange={e => setForm({...form, tools: e.target.value})} required /></label>
              <label>Image Upload<input type="file" accept="image/*" onChange={handleFileChange} /></label>
              <label>Display Order<input type="number" value={form.order} onChange={e => setForm({...form, order: +e.target.value})} /></label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={isUploading}>{isUploading ? 'Uploading...' : editId ? 'Update Project' : 'Add Project'}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      <div className="item-grid">
        {projects.map(p => (
          <div key={p._id} className="item-card">
            {p.image && <div className="item-img-wrap"><img src={p.image} alt={p.title} className="item-img" /></div>}
            <div className="item-body">
              <h4 className="item-title">{p.title}</h4>
              <span className="item-badge">{p.category}</span>
              <p className="item-meta">{p.tools}</p>
            </div>
            <div className="item-actions">
              <button className="btn-edit" onClick={() => edit(p)}>Edit</button>
              <button className="btn-del"  onClick={() => del(p._id!)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

        
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-body delete-body">
              <div className="delete-icon">🗑️</div>
              <h3 className="modal-title" style={{marginBottom: '12px'}}>Delete Item?</h3>
              <p className="delete-text">Are you sure you want to permanently delete this item? This action cannot be undone.</p>
              <div className="form-actions" style={{justifyContent: 'center', marginTop: 0}}>
                <button type="button" className="btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button type="button" className="btn-save" style={{background: 'var(--red)'}} onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content">
          <ProjectPreview form={{ ...form, image: localPreview || form.image }} items={projects} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CAREER
// ═══════════════════════════════════════════════════════════════════════════════
function CareerPreview({ form, items }: { form: Career, items: Career[] }) {
  const hasDraft = Boolean(form.title?.trim() || form.company?.trim() || form.dateRange?.trim() || form.description?.trim());
  const previewItems = hasDraft ? [...items.filter(i => i._id !== form._id), form] : items;
  return (
    <PreviewShell label="Career Timeline Preview">
      <FrontendSectionPreview>
        <Career previewData={previewItems} />
      </FrontendSectionPreview>
    </PreviewShell>
  );
}

function CareerPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { items: careers, refresh } = useList<Career>(`${API}/career`);
  const empty: Career = { title: '', company: '', dateRange: '', description: '', order: 0 };
  const [form, setForm] = useState<Career>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) await axios.put(`${API}/career/${editId}`, form);
      else await axios.post(`${API}/career`, form);
      showToast(editId ? 'Updated!' : 'Added!');
      setForm(empty); setEditId(null); setShowForm(false); refresh();
    } catch { showToast('Error', 'error'); }
  };

  const edit = (c: Career) => { setForm({ ...c, _id: undefined }); setEditId(c._id!); setShowForm(true); };
  const del = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    await axios.delete(`${API}/career/${deleteId}`); showToast('Deleted!'); refresh();
    setDeleteId(null);
  };
  return (
    <div className="panel">
      <SectionHeader title="Career History" subtitle="Your professional timeline shown on the portfolio" />
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <>
      <button className="btn-add" onClick={() => { setForm(empty); setEditId(null); setShowForm(true); }}>+ Add Career Entry</button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Career Entry' : 'Add Career Entry'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="dash-form" style={{marginBottom: 24}}  onSubmit={submit}>
            <div className="form-grid">
              <label>Job Title<input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></label>
              <label>Company<input value={form.company} onChange={e => setForm({...form, company: e.target.value})} required /></label>
              <label>Date Range<input value={form.dateRange} onChange={e => setForm({...form, dateRange: e.target.value})} placeholder="2024 – Present" required /></label>
              <label>Display Order<input type="number" value={form.order} onChange={e => setForm({...form, order: +e.target.value})} /></label>
            </div>
            <label className="full">Description<textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></label>
            <div className="form-actions">
              <button type="submit" className="btn-save">{editId ? 'Update' : 'Add'}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      <div className="timeline">
        {careers.map(c => (
          <div key={c._id} className="timeline-card">
            <div className="timeline-dot" />
            <div className="timeline-body">
              <div className="timeline-head">
                <div><h4>{c.title}</h4><span className="item-badge">{c.company}</span></div>
                <span className="timeline-date">{c.dateRange}</span>
              </div>
              <p className="timeline-desc">{c.description}</p>
              <div className="item-actions">
                <button className="btn-edit" onClick={() => edit(c)}>Edit</button>
                <button className="btn-del"  onClick={() => del(c._id!)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

        
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-body delete-body">
              <div className="delete-icon">🗑️</div>
              <h3 className="modal-title" style={{marginBottom: '12px'}}>Delete Item?</h3>
              <p className="delete-text">Are you sure you want to permanently delete this item? This action cannot be undone.</p>
              <div className="form-actions" style={{justifyContent: 'center', marginTop: 0}}>
                <button type="button" className="btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button type="button" className="btn-save" style={{background: 'var(--red)'}} onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content">
          <CareerPreview form={form} items={careers} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT
// ═══════════════════════════════════════════════════════════════════════════════
const CATEGORY_OPTIONS: { value: AboutCategory; label: string }[] = [
  { value: 'headline', label: 'Headline' },
  { value: 'body', label: 'Body' },
  { value: 'note', label: 'Note' },
];

const createBlock = (category: AboutCategory = 'body', text = ''): AboutBlock => ({ category, text });

const blocksFromBio = (bio: string): AboutBlock[] => {
  const lines = bio
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [createBlock('headline')];
  return lines.map((line, index) => createBlock(index === 0 ? 'headline' : 'body', line));
};

function AboutPreview({ bio, aboutBlocks }: AboutData) {
  return (
    <PreviewShell label="About Section Preview">
      <FrontendSectionPreview>
        <About previewBio={bio} previewBlocks={aboutBlocks} />
      </FrontendSectionPreview>
    </PreviewShell>
  );
}

function AboutPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { data, setData, refresh } = useSingle<AboutData>(`${API}/about`, { bio: '', aboutBlocks: [createBlock('headline')] });
  const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');
  const [openCategoryFor, setOpenCategoryFor] = useState<number | null>(null);
  const dropdownRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if ((!data.aboutBlocks || data.aboutBlocks.length === 0) && data.bio?.trim()) {
      setData({ ...data, aboutBlocks: blocksFromBio(data.bio) });
    }
  }, [data, setData]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (openCategoryFor === null) return;
      const activeRef = dropdownRefs.current[openCategoryFor];
      const target = event.target as Node;
      if (activeRef && !activeRef.contains(target)) {
        setOpenCategoryFor(null);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [openCategoryFor]);

  const getCategoryLabel = (category: AboutCategory) => {
    return CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label || 'Body';
  };

  const setBlock = (index: number, patch: Partial<AboutBlock>) => {
    const next = (data.aboutBlocks || [createBlock('headline')]).map((block, idx) =>
      idx === index ? { ...block, ...patch } : block
    );
    setData({ ...data, aboutBlocks: next });
  };

  const addBlock = () => {
    setData({
      ...data,
      aboutBlocks: [...(data.aboutBlocks || []), createBlock('body')],
    });
  };

  const removeBlock = (index: number) => {
    const next = (data.aboutBlocks || []).filter((_, idx) => idx !== index);
    setOpenCategoryFor(null);
    setData({ ...data, aboutBlocks: next.length ? next : [createBlock('headline')] });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedBlocks = (data.aboutBlocks || [])
      .map((block) => ({ category: block.category, text: block.text.trim() }))
      .filter((block) => block.text);
    const payload: AboutData = {
      bio: normalizedBlocks.map((block) => block.text).join('\n'),
      aboutBlocks: normalizedBlocks,
    };

    try {
      await axios.put(`${API}/about`, payload);
      showToast('About updated!');
      setData(payload);
      refresh();
    }
    catch { showToast('Error', 'error'); }
  };

  const previewPayload: AboutData = {
    bio: data.bio,
    aboutBlocks: data.aboutBlocks?.length ? data.aboutBlocks : blocksFromBio(data.bio),
  };

  return (
    <div className="panel">
      <SectionHeader title="About Me" subtitle="CRM-style content blocks with category-based text styling" />
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <>
      <form className="dash-form about-crm-form" style={{marginBottom: 24}}  onSubmit={submit}>
          <div className="about-crm-blocks">
            {(data.aboutBlocks || [createBlock('headline')]).map((block, index) => (
              <div key={`about-block-${index}`} className={`item-card padded-card about-crm-card about-crm-${block.category} ${openCategoryFor === index ? 'dropdown-open' : ''}`} style={{ padding: '14px' }}>
                <div className="about-crm-grid">
                  <label className="about-crm-field about-crm-category-field">
                    Category
                    <div className="about-custom-select" ref={(el) => { dropdownRefs.current[index] = el; }}>
                      <button
                        type="button"
                        className="about-select-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={openCategoryFor === index}
                        onClick={() => setOpenCategoryFor(openCategoryFor === index ? null : index)}
                      >
                        <span>{getCategoryLabel(block.category)}</span>
                        <span className={`about-select-caret ${openCategoryFor === index ? 'open' : ''}`} />
                      </button>

                      {openCategoryFor === index && (
                        <div className="about-select-menu" role="listbox">
                          {CATEGORY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`about-select-option ${block.category === opt.value ? 'active' : ''}`}
                              onClick={() => {
                                setBlock(index, { category: opt.value as AboutCategory });
                                setOpenCategoryFor(null);
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                  <label className="about-crm-field about-crm-text-field">
                    Text
                    <textarea
                      className="about-textarea"
                      rows={2}
                      value={block.text}
                      onChange={(e) => setBlock(index, { text: e.target.value })}
                      placeholder="Use {{word}} for highlight"
                      required
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-del about-remove-btn"
                    onClick={() => removeBlock(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="form-actions about-crm-actions">
            <button type="button" className="btn-edit" onClick={addBlock}>+ Add Text Block</button>
            <button type="submit" className="btn-save">Save About</button>
          </div>
          <p className="about-crm-tip">
            Tip: choose a category per line. Wrap important words with <code>{'{{double braces}}'}</code> to highlight them.
          </p>
        </form>

        </>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content">
          <AboutPreview bio={previewPayload.bio} aboutBlocks={previewPayload.aboutBlocks} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LANDING
// ═══════════════════════════════════════════════════════════════════════════════
function LandingPreview({ data }: { data: LandingData }) {
  return (
    <PreviewShell label="Landing Hero Preview">
      <FrontendSectionPreview>
        <Landing previewData={data} />
      </FrontendSectionPreview>
    </PreviewShell>
  );
}

function LandingPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { data, setData, refresh } = useSingle<LandingData>(`${API}/landing`, { firstName: 'MEHEDI', lastName: 'HASAN', role1: 'Specialist', role2: 'Engineer' });
  const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await axios.put(`${API}/landing`, data); showToast('Landing updated!'); refresh(); }
    catch { showToast('Error', 'error'); }
  };
  return (
    <div className="panel">
      <SectionHeader title="Landing Page" subtitle="Name and title shown on the hero/landing section" />
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <>
      <form className="dash-form" style={{marginBottom: 24}}  onSubmit={submit}>
          <div className="form-grid">
            <label>First Name<input value={data.firstName} onChange={e => setData({...data, firstName: e.target.value})} required /></label>
            <label>Last Name<input value={data.lastName} onChange={e => setData({...data, lastName: e.target.value})} required /></label>
            <label>Role 1<input value={data.role1} onChange={e => setData({...data, role1: e.target.value})} placeholder="Specialist" required /></label>
            <label>Role 2<input value={data.role2} onChange={e => setData({...data, role2: e.target.value})} placeholder="Engineer" required /></label>
          </div>
          <div className="form-actions"><button type="submit" className="btn-save">Save Landing</button></div>
        </form>

        </>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content">
          <LandingPreview data={data} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  WHAT I DO
// ═══════════════════════════════════════════════════════════════════════════════
function WhatIDoPreview({ form, items }: { form: WhatIDo, items: WhatIDo[] }) {
  const tagsList = typeof form.tags === 'string'
    ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
    : (form.tags as unknown as string[]) || [];

  const previewForm = { ...form, tags: tagsList as string[] };
  const hasDraft = Boolean(form.title?.trim() || form.subtitle?.trim() || form.description?.trim() || tagsList.length > 0);
  const previewItems = hasDraft ? [...items.filter(i => i._id !== form._id), previewForm] : items;

  return (
    <PreviewShell label="Service Card Preview">
      <FrontendSectionPreview>
        <WhatIDo previewData={previewItems} />
      </FrontendSectionPreview>
    </PreviewShell>
  );
}

function WhatIDoPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { items, refresh } = useList<WhatIDo>(`${API}/whatido`);
  const empty: WhatIDo = { title: '', subtitle: '', description: '', tags: '', order: 0 };
  const [form, setForm] = useState<WhatIDo>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, tags: (form.tags as unknown as string).split(',').map((t: string) => t.trim()).filter(Boolean) };
    try {
      if (editId) await axios.put(`${API}/whatido/${editId}`, payload);
      else await axios.post(`${API}/whatido`, payload);
      showToast(editId ? 'Updated!' : 'Added!');
      setForm(empty); setEditId(null); setShowForm(false); refresh();
    } catch { showToast('Error', 'error'); }
  };

  const edit = (item: WhatIDo) => {
    setForm({ ...item, tags: Array.isArray(item.tags) ? (item.tags as unknown as string[]).join(', ') : item.tags, _id: undefined });
    setEditId(item._id!); setShowForm(true);
  };
  const del = (id: string) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    await axios.delete(`${API}/whatido/${deleteId}`); showToast('Deleted!'); refresh();
    setDeleteId(null);
  };
  return (
    <div className="panel">
      <SectionHeader title="What I Do" subtitle="Service cards shown in the What I Do section" />
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <>
      <button className="btn-add" onClick={() => { setForm(empty); setEditId(null); setShowForm(true); }}>+ Add Service Card</button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Service Card' : 'Add Service Card'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="dash-form" style={{marginBottom: 24}}  onSubmit={submit}>
            <div className="form-grid">
              <label>Service Title<input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></label>
              <label>Subtitle<input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} required /></label>
              <label>Display Order<input type="number" value={form.order} onChange={e => setForm({...form, order: +e.target.value})} /></label>
              <label>Tags (comma separated)<input value={form.tags as unknown as string} onChange={e => setForm({...form, tags: e.target.value as unknown as string})} placeholder="n8n, Zapier, OpenAI" /></label>
            </div>
            <label className="full">Description<textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></label>
            <div className="form-actions">
              <button type="submit" className="btn-save">{editId ? 'Update' : 'Add'}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      <div className="item-grid">
        {items.map(item => (
          <div key={item._id} className="item-card">
            <div className="item-body">
              <h4 className="item-title">{item.title}</h4>
              <p className="item-meta">{item.subtitle}</p>
              <p className="item-desc">{item.description}</p>
              <div className="tag-list">
                {(Array.isArray(item.tags) ? item.tags as unknown as string[] : []).map((t: string) => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>
            <div className="item-actions">
              <button className="btn-edit" onClick={() => edit(item)}>Edit</button>
              <button className="btn-del"  onClick={() => del(item._id!)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

        
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-body delete-body">
              <div className="delete-icon">🗑️</div>
              <h3 className="modal-title" style={{marginBottom: '12px'}}>Delete Item?</h3>
              <p className="delete-text">Are you sure you want to permanently delete this item? This action cannot be undone.</p>
              <div className="form-actions" style={{justifyContent: 'center', marginTop: 0}}>
                <button type="button" className="btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button type="button" className="btn-save" style={{background: 'var(--red)'}} onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content">
          <WhatIDoPreview form={form} items={items} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TECH STACK
// ═══════════════════════════════════════════════════════════════════════════════


function TechStackPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const { items, refresh } = useList<TechItem>(`${API}/techstack`);
  const { data: settingsData } = useSingle<{ themeColor?: string }>(`${API}/settings`, { themeColor: '#5eead4' });
  const empty: TechItem = { name: '', imageUrl: '', category: 'automation', highlighted: false };
  const [form, setForm] = useState<TechItem>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [togglingHighlightId, setTogglingHighlightId] = useState<string | null>(null);
  const techCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousPositionsRef = useRef<Map<string, DOMRect>>(new Map());

  const sortTechItems = (list: TechItem[]) => {
    const score = (item: TechItem) => {
      if (item.category === 'automation' && item.highlighted) return 0;
      if (item.category === 'automation') return 1;
      if (item.category === 'extra' && item.highlighted) return 2;
      return 3;
    };

    return [...list].sort((a, b) => {
      const delta = score(a) - score(b);
      if (delta !== 0) return delta;
      return a.name.localeCompare(b.name);
    });
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');
  const sortedItems = sortTechItems(items);

  useLayoutEffect(() => {
    const currentPositions = new Map<string, DOMRect>();
    techCardRefs.current.forEach((el, id) => {
      currentPositions.set(id, el.getBoundingClientRect());
    });

    if (previousPositionsRef.current.size > 0) {
      currentPositions.forEach((currentRect, id) => {
        const previousRect = previousPositionsRef.current.get(id);
        const card = techCardRefs.current.get(id);
        if (!previousRect || !card) return;

        const deltaX = previousRect.left - currentRect.left;
        const deltaY = previousRect.top - currentRect.top;

        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

        card.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: 'translate(0, 0)' },
          ],
          {
            duration: 460,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }
        );
      });
    }

    previousPositionsRef.current = currentPositions;
  }, [sortedItems]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalImageUrl = form.imageUrl;
      if (selectedFile) {
        const processedBlob = await processImage(selectedFile);
        const formData = new FormData();
        formData.append('image', processedBlob, 'processed.png');
        const res = await axios.post('https://api.imgbb.com/1/upload?key=0dfba9f982c03fb77410bf4d22445cfd', formData);
        finalImageUrl = res.data.data.url;
      }
      const payload = {
        name: form.name,
        imageUrl: finalImageUrl,
        category: form.category,
        highlighted: Boolean(form.highlighted),
      };

      if (editId) await axios.put(`${API}/techstack/${editId}`, payload);
      else await axios.post(`${API}/techstack`, payload);
      showToast(editId ? 'Updated!' : 'Added!');
      setForm(empty); setEditId(null); setShowForm(false); setSelectedFile(null); refresh();
    } catch { showToast('Error', 'error'); }
    setIsUploading(false);
  };

  const edit = (item: TechItem) => { setForm({ ...item, highlighted: Boolean(item.highlighted), _id: undefined }); setEditId(item._id!); setSelectedFile(null); setShowForm(true); };
  const del = (id: string) => setDeleteId(id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await axios.delete(`${API}/techstack/${deleteId}`); showToast('Deleted!'); refresh();
    setDeleteId(null);
  };

  const toggleHighlight = async (item: TechItem) => {
    if (!item._id) return;
    setTogglingHighlightId(item._id);
    try {
      await axios.put(`${API}/techstack/${item._id}`, {
        name: item.name,
        imageUrl: item.imageUrl,
        category: item.category,
        highlighted: !item.highlighted,
      });
      showToast(!item.highlighted ? 'Highlighted!' : 'Highlight removed!');
      refresh();
    } catch {
      showToast('Error updating highlight', 'error');
    }
    setTogglingHighlightId(null);
  };

  return (
    <div className="panel">
      <SectionHeader title="Tech Stack" subtitle="Technologies shown as 3D physics balls" />
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <>
      <button className="btn-add" onClick={() => { setForm(empty); setEditId(null); setSelectedFile(null); setShowForm(true); }}>+ Add Tech</button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Tech Item' : 'Add Tech Item'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="dash-form" style={{marginBottom: 24}}  onSubmit={submit}>
            <div className="form-grid">
              <label>Name<input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></label>
              <label>Upload Logo<input type="file" accept="image/*" onChange={handleFileChange} /></label>
              <label>Category
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value as 'automation' | 'extra'})}>
                  <option value="automation">Automation (large sphere)</option>
                  <option value="extra">Extra (small sphere)</option>
                </select>
              </label>
              <label>
                Highlight on Frontend
                <select value={form.highlighted ? 'yes' : 'no'} onChange={e => setForm({...form, highlighted: e.target.value === 'yes'})}>
                  <option value="no">No</option>
                  <option value="yes">Yes (Standout Ball)</option>
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={isUploading}>{isUploading ? 'Uploading...' : editId ? 'Update' : 'Add'}</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
            </div>
          </div>
        </div>
      )}

      <div className="tech-grid">
        {sortedItems.map(item => (
          <div
            key={item._id}
            className="tech-card"
            ref={(el) => {
              if (!item._id) return;
              if (el) techCardRefs.current.set(item._id, el);
              else techCardRefs.current.delete(item._id);
            }}
            style={{ willChange: 'transform' }}
          >
            <div className={`tech-ball-wrap ${item.category === 'extra' ? 'small' : ''}`}>
              <SingleTechBall imageUrl={item.imageUrl} highlighted={Boolean(item.highlighted)} scale={item.category === 'automation' ? 1.2 : 0.8} accentColor={settingsData.themeColor} />
            </div>
            <div className="tech-info">
              <span className="tech-name">{item.name}</span>
              <span className={`tech-cat ${item.category}`}>{item.category}</span>
              {item.highlighted && <span className="tech-cat highlight">highlighted</span>}
            </div>
            <div className="item-actions">
              <button className="btn-edit" onClick={() => edit(item)}>Edit</button>
              <button
                className="btn-save"
                style={{
                  padding: '8px 14px',
                  background: item.highlighted ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: item.highlighted ? '#f59e0b' : '#10b981',
                  border: `1px solid ${item.highlighted ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                disabled={togglingHighlightId === item._id}
                onClick={() => toggleHighlight(item)}
              >
                {togglingHighlightId === item._id ? 'Saving...' : item.highlighted ? 'Unhighlight' : 'Highlight'}
              </button>
              <button className="btn-del"  onClick={() => del(item._id!)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

        
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-body delete-body">
              <div className="delete-icon">🗑️</div>
              <h3 className="modal-title" style={{marginBottom: '12px'}}>Delete Item?</h3>
              <p className="delete-text">Are you sure you want to permanently delete this item? This action cannot be undone.</p>
              <div className="form-actions" style={{justifyContent: 'center', marginTop: 0}}>
                <button type="button" className="btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
                <button type="button" className="btn-save" style={{background: 'var(--red)'}} onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content" style={{ height: '800px', position: 'relative', overflow: 'hidden' }}>
          <PreviewShell label="3D Tech Stack Preview">
            <FrontendSectionPreview>
              <Suspense fallback={<div style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>Loading 3D preview...</div>}>
                <TechStackPreview previewData={
                  (form.name?.trim() || form.imageUrl?.trim())
                    ? sortTechItems([...items.filter(i => i._id !== form._id), form])
                    : sortTechItems(items)
                } />
              </Suspense>
            </FrontendSectionPreview>
          </PreviewShell>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTACT
// ═══════════════════════════════════════════════════════════════════════════════
function ContactPreview({ data }: { data: ContactData }) {
  return (
    <PreviewShell label="Contact Section Preview">
      <FrontendSectionPreview>
        <Contact previewData={data} />
      </FrontendSectionPreview>
    </PreviewShell>
  );
}

function ContactPanel({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const fallback: ContactData = { email: '', location: '', github: '', linkedin: '', twitter: '', instagram: '' };
  const { data, setData, refresh } = useSingle<ContactData>(`${API}/contact`, fallback);
  const normalizedData = {
    ...data,
    // Legacy compatibility for previously saved contact records.
    location: data.location || ((data as unknown as { education?: string }).education ?? ''),
  } as ContactData;
  const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await axios.put(`${API}/contact`, normalizedData); showToast('Contact info saved!'); refresh(); }
    catch { showToast('Error', 'error'); }
  };
  return (
    <div className="panel">
      <SectionHeader title="Contact Info" subtitle="Email, social links and location shown in the footer/contact section" />
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <>
      <form className="dash-form" style={{marginBottom: 24}}  onSubmit={submit}>
          <div className="form-grid">
            <label>Email<input type="email" value={normalizedData.email} onChange={e => setData({...normalizedData, email: e.target.value})} required /></label>
            <label>Location<input value={normalizedData.location} onChange={e => setData({...normalizedData, location: e.target.value})} /></label>
            <label>GitHub URL<input value={normalizedData.github} onChange={e => setData({...normalizedData, github: e.target.value})} /></label>
            <label>LinkedIn URL<input value={normalizedData.linkedin} onChange={e => setData({...normalizedData, linkedin: e.target.value})} /></label>
            <label>Twitter URL<input value={normalizedData.twitter} onChange={e => setData({...normalizedData, twitter: e.target.value})} /></label>
            <label>Instagram URL<input value={normalizedData.instagram} onChange={e => setData({...normalizedData, instagram: e.target.value})} /></label>
          </div>
          <div className="form-actions"><button type="submit" className="btn-save">Save Contact</button></div>
        </form>

        </>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content">
          <ContactPreview data={normalizedData} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [active, setActive] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast, show: showToast } = useToast();

  useEffect(() => {
    const isAuthed = sessionStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(isAuthed);
  }, []);

  const handleAuthSuccess = () => {
    sessionStorage.setItem('adminAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

  const renderPanel = () => {
    switch (active) {
      case 'overview':  return <OverviewPanel />;
      case 'projects':  return <ProjectsPanel  showToast={showToast} />;
      case 'career':    return <CareerPanel    showToast={showToast} />;
      case 'about':     return <AboutPanel     showToast={showToast} />;
      case 'landing':   return <LandingPanel   showToast={showToast} />;
      case 'whatido':   return <WhatIDoPanel   showToast={showToast} />;
      case 'techstack': return <TechStackPanel showToast={showToast} />;
      case 'contact':   return <ContactPanel   showToast={showToast} />;
      case 'resumes':   return <ResumesPanel   showToast={showToast} />;
      case 'settings':  return <SettingsPanel  showToast={showToast} />;
      default: return null;
    }
  };

  if (!isAuthenticated) return <LoginScreen onAuth={handleAuthSuccess} />;

  return (
    <div className="dash-root">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <span className="logo-icon">◈</span>
            {sidebarOpen && <span className="logo-text">Portfolio<strong>CMS</strong></span>}
          </div>
          <div className="sidebar-logo-actions">
            {sidebarOpen && (
              <button
                className="sidebar-icon-btn"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
                type="button"
              >
                <FiLogOut size={15} />
              </button>
            )}
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? 'Collapse' : 'Expand'}>
              {sidebarOpen ? <MdChevronLeft size={18} /> : <MdChevronRight size={18} />}
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button
              key={n.id}
              className={`nav-item ${active === n.id ? 'nav-active' : ''}`}
              onClick={() => {
                setActive(n.id);
                if (window.innerWidth <= 768) setSidebarOpen(false);
              }}
              title={!sidebarOpen ? n.label : undefined}
            >
              <span className="nav-icon">{renderNavIcon(n.iconId)}</span>
              {sidebarOpen && <span className="nav-label">{n.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <header className="dash-topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <MdMenu />
          </button>
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-root">Dashboard</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{NAV.find(n => n.id === active)?.label}</span>
          </div>
          <div className="topbar-right">
            <span className="server-badge">🟢 Server Live</span>
          </div>
        </header>
        <div className="dash-content">{renderPanel()}</div>
      </main>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
};

export default Dashboard;
