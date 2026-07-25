import { Outlet } from 'react-router-dom'
import { IrisProvider } from './components/IrisTransition.jsx'
import BootReveal from './components/BootReveal.jsx'

// Layout route: the chrome that outlives any single page. Pages render through
// the Outlet — see router.jsx for the table.
//
// .device-frame wraps everything — including the iris overlay IrisProvider
// renders — so that on desktop the whole app is pinned inside a 375x812 phone
// frame and every `position: fixed` descendant resolves to it. Below the phone
// breakpoint the frame is inert and the app is full-bleed. See the device-frame
// block in index.css.
//
// The frame is the containing block (via transform) but must NOT be the scroll
// container too: a `position: fixed` child of a scrolling transformed box scrolls
// away with the content instead of staying pinned. So the content scrolls inside
// .device-frame__scroll — which has no transform, so fixed chrome (the All Meals
// FAB and A–Z index) still resolves to the frame and stays locked while the list
// scrolls underneath.
function App() {
  return (
    <div className="device-frame">
      <div className="device-frame__scroll">
        <IrisProvider>
          <BootReveal />
          <Outlet />
        </IrisProvider>
      </div>
    </div>
  )
}

export default App
