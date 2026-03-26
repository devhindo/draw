import { Tldraw } from 'tldraw'
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
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw assetUrls={assetUrls} />
    </div>
  )
}

export default App
