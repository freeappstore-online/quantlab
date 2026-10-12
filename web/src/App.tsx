import { initApp } from '@freeappstore/sdk'
import { BuildInfo, type NavItem, Shell } from '@freeappstore/sdk/ui'
import { About } from './components/About'
import { Drill } from './components/Drill'
import { History } from './components/History'
import { Home } from './components/Home'
import { SettingsView } from './components/SettingsView'
import { go, useRoute } from './hooks/useRoute'
import { useStore } from './hooks/useStore'
import { MODES } from './services/modes'

const fas = initApp({ appId: 'quantlab' })

// One entry per screen. Drills (/play/:mode) are reached from Train and have no entry of their own.
const NAV: NavItem[] = [
  { label: 'Train', href: '/', title: 'QuantLab: free quant interview prep' },
  { label: 'History', href: '/history', title: 'History — QuantLab' },
  { label: 'Settings', href: '/settings', title: 'Settings — QuantLab' },
  { label: 'About', href: '/about', title: 'About — QuantLab' },
]

export default function App() {
  const route = useRoute()
  const store = useStore()
  const { sessions, settings, updateSettings, addSession } = store

  let page
  switch (route.name) {
    case 'play': {
      const mode = MODES[route.mode]
      page = (
        <Drill
          key={mode.id}
          mode={mode}
          settings={settings}
          sessions={sessions}
          onDifficulty={(d) => updateSettings({ lastDifficulty: { ...settings.lastDifficulty, [mode.id]: d } })}
          onSave={addSession}
        />
      )
      break
    }
    case 'history':
      page = <History sessions={sessions} mode={route.mode} />
      break
    case 'settings':
      page = <SettingsView store={store} />
      break
    case 'about':
      page = <About />
      break
    default:
      page = <Home sessions={sessions} />
  }

  return (
    <Shell app={fas} appName="QuantLab" nav={NAV} onNavigate={go}>
      {store.saveFailed && (
        <div role="alert" className="bg-danger-soft px-4 py-2 text-center text-sm text-danger">
          This browser is blocking storage, so your history will not be saved after you close the tab.
        </div>
      )}
      {page}
      {route.name !== 'play' && <BuildInfo />}
    </Shell>
  )
}
