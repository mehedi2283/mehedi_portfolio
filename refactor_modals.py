import re

with open('g:/3D_Portfolio/3D_Portfolio_Fronend/src/components/Admin/Dashboard.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

panels = ["ProjectsPanel", "CareerPanel", "WhatIDoPanel", "TechStackPanel"]
endpoints = ["projects", "career", "whatido", "techstack"]

for panel, endpoint in zip(panels, endpoints):
    start = code.find(f"function {panel}")
    end = code.find("    </div>\n  );", start)
    
    if start == -1 or end == -1: continue
    panel_code = code[start:end]
    
    # Switch showForm back to false since it's a modal now
    panel_code = panel_code.replace("const [showForm, setShowForm] = useState(true);", "const [showForm, setShowForm] = useState(false);")
    
    # 1. Add deleteId state
    if "const [deleteId, setDeleteId]" not in panel_code:
        panel_code = panel_code.replace("const [subTab,", "const [deleteId, setDeleteId] = useState<string | null>(null);\n  const [subTab,")
    
    # 2. Add confirmDelete method right before return (
    if "const confirmDelete =" not in panel_code:
        confirm_fn = f"""  const confirmDelete = async () => {{
    if (!deleteId) return;
    await axios.delete(`${{API}}/{endpoint}/${{deleteId}}`); showToast('Deleted!'); refresh();
    setDeleteId(null);
  }};"""
        panel_code = panel_code.replace("  return (", confirm_fn + "\n  return (")

    # 3. Modify del method
    del_match = re.search(r'const del\s*=\s*async\s*\([^)]*\)\s*=>\s*\{[^}]+\};', panel_code)
    if del_match:
        new_del = f"const del = (id: string) => setDeleteId(id);"
        panel_code = panel_code.replace(del_match.group(0), new_del)
        
    # 4. Modify 'showForm' block
    form_match = re.search(r'\{showForm && \(\s*(?:<>|)\s*<form[\s\S]*?</form>\s*(?:</>|)\s*\)\}', panel_code)
    if form_match:
        form_inner = re.search(r'<form[\s\S]*?</form>', form_match.group(0)).group(0)
        # remove cancel button from form_actions
        form_inner = re.sub(r'<button type="button" className="btn-cancel"[^>]*>Cancel</button>', '', form_inner)
        
        capitalized_endpoint = 'Project' if endpoint == 'projects' else \
                               'Career Entry' if endpoint == 'career' else \
                               'Tech Item' if endpoint == 'techstack' else \
                               'Service Card' if endpoint == 'whatido' else endpoint.title()
        
        modal_html = f"""{{showForm && (
        <div className="modal-overlay" onClick={{() => setShowForm(false)}}>
          <div className="modal-content" onClick={{e => e.stopPropagation()}}>
            <div className="modal-header">
              <h3 className="modal-title">{{editId ? 'Edit {capitalized_endpoint}' : 'Add {capitalized_endpoint}'}}</h3>
              <button className="modal-close" onClick={{() => setShowForm(false)}}>×</button>
            </div>
            <div className="modal-body">
              {form_inner}
            </div>
          </div>
        </div>
      )}}"""
        panel_code = panel_code.replace(form_match.group(0), modal_html)
        
    # 5. Add delete confirmation modal at the end of panel_code
    delete_modal = f"""
      {{deleteId && (
        <div className="modal-overlay" onClick={{() => setDeleteId(null)}}>
          <div className="modal-content delete-modal" onClick={{e => e.stopPropagation()}}>
            <div className="modal-body delete-body">
              <div className="delete-icon">🗑️</div>
              <h3 className="modal-title" style={{marginBottom: '12px'}}>Delete Item?</h3>
              <p className="delete-text">Are you sure you want to permanently delete this item? This action cannot be undone.</p>
              <div className="form-actions" style={{justifyContent: 'center', marginTop: 0}}>
                <button type="button" className="btn-cancel" onClick={{() => setDeleteId(null)}}>Cancel</button>
                <button type="button" className="btn-save" style={{background: 'var(--red)'}} onClick={{confirmDelete}}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}}"""
    
    if "delete-modal" not in panel_code:
        # insert right before the closing <> if manage tab is used, else at the end
        # Since it's inside conditional {subTab === 'manage' && (<> ... </>)}
        # We can just append it right before "    </>\n      )}"
        idx = panel_code.find("</>\n      )}")
        if idx != -1:
             panel_code = panel_code[:idx] + delete_modal + "\n        " + panel_code[idx:]
        else:
             panel_code += delete_modal
    
    code = code[:start] + panel_code + code[end:]

with open('g:/3D_Portfolio/3D_Portfolio_Fronend/src/components/Admin/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Modals injected successfully!")
