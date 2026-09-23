:root {
  --bg: #1a1a2e;
  --bg-light: #16213e;
  --bg-ribbon: #0f3460;
  --bg-sidebar: #16213e;
  --border: #1e3a5f;
  --text: #e0e0e0;
  --text-dim: #8899aa;
  --accent: #4fc3f7;
  --accent-hover: #81d4fa;
  --primary: #2196f3;
  --primary-hover: #42a5f5;
  --danger: #ef5350;
  --success: #66bb6a;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
}

/* ─── Top Bar ─────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-light);
  border-bottom: 1px solid var(--border);
  height: 36px;
}

.topbar-left { display: flex; align-items: center; gap: 12px; }
.logo { font-size: 1.1rem; font-weight: 700; color: var(--accent); }
.doc-name { color: var(--text-dim); font-size: 0.8rem; }

.topbar-right { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-dim); }
.sep { opacity: 0.4; }

.icon-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  width: 26px; height: 26px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover { background: var(--border); }

/* ─── Ribbon ──────────────────────────────────────────── */
.ribbon {
  background: var(--bg-ribbon);
  border-bottom: 1px solid var(--border);
  min-height: 90px;
}

.ribbon-tabs { display: flex; gap: 0; padding: 4px 8px 0; }

.tab {
  background: transparent;
  border: none;
  color: var(--text-dim);
  padding: 6px 16px;
  cursor: pointer;
  font-size: 0.8rem;
  border-radius: 4px 4px 0 0;
  transition: all 0.15s;
}
.tab:hover { color: var(--text); background: rgba(255,255,255,0.05); }
.tab.active { color: var(--accent); background: var(--bg-ribbon); border-bottom: 2px solid var(--accent); }

.ribbon-panel {
  display: flex;
  gap: 0;
  padding: 8px 12px 12px;
  align-items: flex-end;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 12px;
  border-right: 1px solid var(--border);
}
.ribbon-group:last-child { border-right: none; }

.ribbon-group-label {
  font-size: 0.65rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.ribbon-group-items { display: flex; gap: 4px; }

.ribbon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  min-width: 52px;
  transition: all 0.15s;
}
.ribbon-btn:hover { background: rgba(255,255,255,0.08); border-color: var(--border); }
.ribbon-btn.active { background: rgba(79,195,247,0.15); border-color: var(--accent); color: var(--accent); }
.ribbon-btn.primary { background: var(--primary); color: white; border-color: var(--primary); }
.ribbon-btn.primary:hover { background: var(--primary-hover); }

.ribbon-icon { font-size: 1.2rem; line-height: 1; }

/* ─── Main Area ───────────────────────────────────────── */
.main-area { flex: 1; display: flex; overflow: hidden; }

/* Sidebar */
.sidebar {
  width: 200px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s;
}
.sidebar.collapsed { width: 0; }

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-dim);
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}

.page-nav { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }

.page-thumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
}
.page-thumb:hover { background: rgba(255,255,255,0.06); }
.page-thumb.active { border-color: var(--accent); background: rgba(79,195,247,0.1); }
.page-thumb-num { font-weight: 600; color: var(--text-dim); min-width: 20px; }
.page-thumb.active .page-thumb-num { color: var(--accent); }

/* Viewer */
.viewer {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  position: relative;
  background: #2a2a3e;
  background-image: radial-gradient(circle at 50% 50%, #333350 0%, #1a1a2e 100%);
}

#canvas-container {
  position: relative;
  display: flex;
  justify-content: center;
}

#canvas-container canvas {
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
  border-radius: 2px;
  max-width: 100%;
  height: auto;
}

#overlay-canvas {
  position: absolute;
  top: 0; left: 0;
  cursor: crosshair;
  z-index: 10;
}

/* ─── Tool Options Bar ────────────────────────────────── */
.tool-options {
  background: var(--bg-light);
  border-top: 1px solid var(--border);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-option-set { display: flex; align-items: center; gap: 8px; }
.tool-option-set input, .tool-option-set select {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}
.tool-option-set input[type="text"] { width: 200px; }
.tool-option-set input[type="number"] { width: 60px; }
.tool-option-set button.primary {
  background: var(--primary);
  color: white;
  border: none;
  padding: 5px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
}
.tool-option-set button.primary:hover { background: var(--primary-hover); }
.tool-option-set span { font-size: 0.8rem; color: var(--text-dim); }

/* ─── Status Bar ──────────────────────────────────────── */
.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 16px;
  background: var(--bg-light);
  border-top: 1px solid var(--border);
  font-size: 0.72rem;
  color: var(--text-dim);
  height: 28px;
}

#tool-indicator { color: var(--accent); font-weight: 600; }

/* ─── Utilities ───────────────────────────────────────── */
.hidden { display: none !important; }   
