/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { Tldraw, Editor, getSnapshot, DefaultMainMenu, DefaultMainMenuContent, TldrawUiMenuItem } from 'tldraw'
import type { TLStoreSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

const assetUrls = {
  fonts: {
    tldraw_mono: '/fonts/IBMPlexMono-Medium.woff2',
    tldraw_mono_italic: '/fonts/IBMPlexMono-MediumItalic.woff2',
    tldraw_mono_bold: '/fonts/IBMPlexMono-Bold.woff2',
    tldraw_mono_italic_bold: '/fonts/IBMPlexMono-BoldItalic.woff2',
    tldraw_serif: '/fonts/IBMPlexSerif-Medium.woff2',
    tldraw_serif_italic: '/fonts/IBMPlexSerif-MediumItalic.woff2',
    tldraw_serif_bold: '/fonts/IBMPlexSerif-Bold.woff2',
    tldraw_serif_italic_bold: '/fonts/IBMPlexSerif-BoldItalic.woff2',
    tldraw_sans: '/fonts/IBMPlexSans-Medium.woff2',
    tldraw_sans_italic: '/fonts/IBMPlexSans-MediumItalic.woff2',
    tldraw_sans_bold: '/fonts/IBMPlexSans-Bold.woff2',
    tldraw_sans_italic_bold: '/fonts/IBMPlexSans-BoldItalic.woff2',
    tldraw_draw: '/fonts/Shantell_Sans-Informal_Regular.woff2',
    tldraw_draw_italic: '/fonts/Shantell_Sans-Informal_Regular_Italic.woff2',
    tldraw_draw_bold: '/fonts/Shantell_Sans-Informal_Bold.woff2',
    tldraw_draw_italic_bold: '/fonts/Shantell_Sans-Informal_Bold_Italic.woff2'
  }
};

function App() {
  const [files, setFiles] = useState<string[]>([])
  const [activeFile, setActiveFile] = useState<string>('')
  const [snapshot, setSnapshot] = useState<TLStoreSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string>('')

  const loadFiles = async () => {
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      setFiles(data.files || [])
      return data.files || []
    } catch (e) {
      console.error(e)
      return []
    }
  }

  const loadFile = async (filename: string) => {
    setLoading(true)
    setActiveFile(filename)
    try {
      const res = await fetch(`/api/load/${encodeURIComponent(filename)}`)
      if (res.ok) {
        const data = await res.json()
        setSnapshot(data)
      } else {
        setSnapshot(null)
      }
    } catch {
      setSnapshot(null)
    }
    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    const evtSource = new EventSource('/api/keepalive');

    loadFiles().then(() => {
      const urlParams = new URLSearchParams(window.location.search)
      const fileFromUrl = urlParams.get('file') || 'default'
      
      loadFile(fileFromUrl)
    })

    return () => {
      evtSource.close();
    }
  }, [])

  const handleMount = useCallback((editor: Editor) => {
    if (!activeFile) return;

    const saveFile = async () => {
      setSaveStatus('Saving...')
      const currentSnapshot = getSnapshot(editor.store)
      try {
        await fetch(`/api/save/${encodeURIComponent(activeFile)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentSnapshot)
        })
        setSaveStatus('Saved')
        loadFiles() // Refresh list to ensure new files appear
      } catch (e) {
        console.error("Failed to save", e)
        setSaveStatus('Error')
      }
    }

    let timeout: ReturnType<typeof setTimeout>;
    const handleChange = () => {
      clearTimeout(timeout)
      setSaveStatus('Saving...')
      timeout = setTimeout(saveFile, 100)
    }
    
    // Listen to changes in the document (shapes, etc.)
    const unsubscribe = editor.store.listen(handleChange, { scope: 'document', source: 'user' })
    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [activeFile])

  const components = {
    MainMenu: () => (
      <DefaultMainMenu>
        <TldrawUiMenuItem
          id="toggle-sidebar"
          label={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          icon="menu"
          readonlyOk
          onSelect={() => setIsSidebarOpen(o => !o)}
        />
        <DefaultMainMenuContent />
      </DefaultMainMenu>
    )
  }

  return (
    <div className="app-container">
      {isSidebarOpen && (
        <div className="sidebar">
          <div className="sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>drawcli</h2>
              <span className={`save-status ${saveStatus.replace('...', '').toLowerCase()}`}>{saveStatus}</span>
            </div>
            <button className="close-btn" onClick={() => setIsSidebarOpen(false)} title="Close Sidebar">
              ×
            </button>
          </div>
          <div className="sidebar-content">
            <div className="file-list">
              {files.map(f => (
                <div 
                  key={f} 
                  className={`file-item ${f === activeFile ? 'active' : ''}`}
                  onClick={() => loadFile(f)}
                >
                  📄 {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="main-content">
        {!loading && activeFile && (
          <div className="tldraw-wrapper">
            <Tldraw 
              key={activeFile} 
              assetUrls={assetUrls} 
              {...(snapshot ? { snapshot } : {})}
              onMount={handleMount} 
              components={components}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
