import re

try:
    with open('g:/3D_Portfolio/3D_Portfolio_Fronend/src/components/Admin/Dashboard.tsx', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update PreviewShell to remove custom scrollbar scaling and fixed sizes
    preview_shell_old = """      <div className="custom-scrollbar" style={{ 
          transform: 'scale(0.35)', 
          transformOrigin: 'top left', 
          width: '285.7%', 
          height: '285.7%', 
          position: 'absolute',
          top: 0, left: 0,
          pointerEvents: 'none',
          backgroundColor: '#0a0a0f',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {children}
        </div>"""
            
    preview_shell_new = """      <div className="custom-scrollbar" style={{ 
          width: '100%', 
          height: '100%', 
          minHeight: '600px',
          overflowY: 'auto',
          backgroundColor: '#0a0a0f'
        }}>
        <div style={{ pointerEvents: 'none', minHeight: '100%' }}>
          {children}
        </div>
      </div>"""

    code = code.replace(preview_shell_old, preview_shell_new)

    code = code.replace(
        """<div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px', overflow: 'hidden' }}>""",
        """<div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '600px', overflow: 'hidden' }}>"""
    )

    panels = [
        ("ProjectsPanel", r'<SectionHeader title="Projects"[^>]+/>', True, "projects"),
        ("CareerPanel", r'<SectionHeader title="Career History"[^>]+/>', True, "careers"),
        ("AboutPanel", r'<SectionHeader title="About Me"[^>]+/>', False, ""),
        ("LandingPanel", r'<SectionHeader title="Landing Page"[^>]+/>', False, ""),
        ("WhatIDoPanel", r'<SectionHeader title="What I Do"[^>]+/>', True, "items"),
        ("TechStackPanel", r'<SectionHeader title="Tech Stack"[^>]+/>', False, ""),
        ("ContactPanel", r'<SectionHeader title="Contact Info"[^>]+/>', False, "")
    ]

    for name, title_regex, add_items, items_var in panels:
        start_idx = code.find(f"function {name}")
        if start_idx == -1:
            print(f"Panel {name} not found")
            continue
            
        insert_point = code.find("const submit = async", start_idx)
        if insert_point != -1:
            code = code[:insert_point] + "const [subTab, setSubTab] = useState<'manage'|'preview'>('manage');\n  " + code[insert_point:]
            
        title_match = re.search(title_regex, code[start_idx:])
        if not title_match:
            print(f"Title regex not found for {name}")
            continue
            
        replace_str = title_match.group(0) + """
      <div className="panel-tabs">
        <button type="button" className={`panel-tab ${subTab==='manage'?'active':''}`} onClick={()=>setSubTab('manage')}>Manage Data</button>
        <button type="button" className={`panel-tab ${subTab==='preview'?'active':''}`} onClick={()=>setSubTab('preview')}>Live Preview</button>
      </div>
      {subTab === 'manage' && (
        <React.Fragment>"""
            
        rel_start = code.find(title_match.group(0), start_idx)
        code = code[:rel_start] + replace_str + code[rel_start + len(title_match.group(0)):]
        
        # After modification, re-find end_idx to inject preview tab
        # We find the end of the panel's div
        end_idx = code.find("    </div>\n  );", start_idx)
        if end_idx == -1:
            print(f"End not found for {name}")
            continue
            
        # find the <Preview tag first
        preview_match = re.search(r'<[A-Za-z]+Preview [^>]+ />', code[start_idx:end_idx])
        if preview_match:
            preview_tag = preview_match.group(0)
            
            # Remove from original spot
            code = code[:start_idx] + code[start_idx:end_idx].replace(preview_tag, "") + code[end_idx:]
            
            # We need to re-find end_idx because lengths changed
            end_idx = code.find("    </div>\n  );", start_idx)
            
            if add_items and "items=" not in preview_tag:
                preview_tag = preview_tag.replace(" />", f" items={{{items_var}}} />")
                
            preview_block = """
        </React.Fragment>
      )}
      {subTab === 'preview' && (
        <div className="preview-tab-content">
          PREVIEW_TAG_HERE
        </div>
      )}
""".replace("PREVIEW_TAG_HERE", preview_tag)

            code = code[:end_idx] + preview_block + code[end_idx:]

    code = code.replace("<React.Fragment>", "<>")
    code = code.replace("</React.Fragment>", "</>")

    code = re.sub(r'<div className="form-preview-layout[^"]*">\s*<form className="dash-form"', '<form className="dash-form" style={{marginBottom: 24}} ', code)
    code = re.sub(r'</form>\s*</div>', '</form>', code)

    with open('g:/3D_Portfolio/3D_Portfolio_Fronend/src/components/Admin/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
        
    print("Done refactoring Dashboard.tsx UI components!")
except Exception as e:
    import traceback
    traceback.print_exc()
