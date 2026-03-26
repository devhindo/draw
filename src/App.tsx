import { useState, useEffect, useCallback } from 'react'
import { Tldraw, Editor, getSnapshot } from 'tldraw'
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
  const [snapshot, setSnapshot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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

  // Initial load
  useEffect(() => {
    loadFiles().then(fileList => {
      const urlParams = new URLSearchParams(window.location.search)
      const fileFromUrl = urlParams.get('file')
      if (fileFromUrl) {
        loadFile(fileFromUrl)
      } else if (fileList.length > 0) {
        loadFile(fileList[0])
      } else {
        createNewFile('Untitled')
      }
    })
  }, [])

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
    } catch (err) {
      setSnapshot(null)
    }
    setLoading(false)
  }

  const createNewFile = async (name: string) => {
    setLoading(true)
    setActiveFile(name)
    setSnapshot(null)
    setLoading(false)
  }

  const handleMount = useCallback((editor: Editor) => {
    let timeout: any;
    const handleChange = () => {
      clearTimeout(timeout)
      timeout = setTimeout(async () => {
        if (!activeFile) return;
        const currentSnapshot = getSnapshot(editor.store)
        try {
          await fetch(`/api/save/${encodeURIComponent(activeFile)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentSnapshot)
          })
          loadFiles() // Refresh file list in case it's a new file
        } catch (e) {
          console.error("Failed to save", e)
        }
      }, 1000)
    }
    
    // Listen to changes in the document (shapes, etc.)
    const unsubscribe = editor.store.listen(handleChange, { scope: 'document', source: 'user' })
    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [activeFile])

  return (
    <div className="app-container">
      {isSidebarOpen && (
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>drawcli</h2>
          </div>
          <div className="sidebar-content">
            <button 
              className="new-btn"
              onClick={() => {
                const name = prompt("Enter new drawing name:", "Untitled")
                if (name) createNewFile(name)
              }}
            >
              + New Drawing
            </button>
            
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
        <button 
          className="toggle-sidebar" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Toggle Sidebar"
        >
          ☰
        </button>
        {!loading && (
          <div className="tldraw-wrapper">
            <Tldraw 
              key={activeFile} 
              assetUrls={assetUrls} 
              {...(snapshot ? { snapshot } : {})}
              onMount={handleMount} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
