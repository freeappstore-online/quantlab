import { initApp } from '@freeappstore/sdk'
import { BuildInfo, NavBar, type NavItem, Shell } from '@freeappstore/sdk/ui'
import { About } from './components/About'
import { AssessHistory } from './components/assess/AssessHistory'
import { AssessHub } from './components/assess/AssessHub'
import { AssessPlay } from './components/assess/AssessPlay'
import { FullAssessment } from './components/assess/FullAssessment'
import { gameById } from './components/assess/registry'
import { Drill } from './components/Drill'
import { History } from './components/History'
import { Home } from './components/Home'
import { SettingsView } from './components/SettingsView'
import { useAssessStore } from './hooks/useAssessStore'
import { go, useRoute } from './hooks/useRoute'
import { useStore } from './hooks/useStore'
import { MODES } from './services/modes'

const fas = initApp({ appId: 'quantlab' })

// One entry per screen. Drills (/play/:mode) and assessment games (/assess/play/:game) are reached from their hubs.
const NAV: NavItem[] = [
  { label: 'Train', href: '/', title: 'QuantLab: free quant interview prep' },
  { label: 'Assess', href: '/assess', title: 'Game-Based Assessment Trainer — QuantLab' },
  { label: 'History', href: '/history', title: 'History — QuantLab' },
  { label: 'Settings', href: '/settings', title: 'Settings — QuantLab' },
  { label: 'About', href: '/about', title: 'About — QuantLab' },
]

export default function App() {
  const route = useRoute()
  const store = useStore()
  const assess = useAssessStore()
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
    case 'assess':
      page = <AssessHub store={assess} />
      break
    case 'assessPlay':
      page = <AssessPlay key={route.game} def={gameById(route.game)} store={assess} />
      break
    case 'assessFull':
      page = <FullAssessment store={assess} />
      break
    case 'assessHistory':
      page = <AssessHistory store={assess} game={route.game} />
      break
    case 'settings':
      page = <SettingsView store={store} assess={assess} />
      break
    case 'about':
      page = <About />
      break
    default:
      page = <Home sessions={sessions} />
  }

  const focused = route.name === 'play' || route.name === 'assessPlay' || route.name === 'assessFull'

  return (
    <Shell
      app={fas}
      appName="QuantLab"
      nav={NAV}
      onNavigate={go}
      renderNav={({ items, currentPath, onNavigate }) => (
        <div className="flex min-w-0 flex-1 items-center">
          <NavBar items={items} currentPath={currentPath} onNavigate={onNavigate} />
          <a href="https://freeappstore.online" className="exit-link" aria-label="Exit QuantLab to the app store">
            Exit
          </a>
        </div>
      )}
    >
      {store.saveFailed && (
        <div role="alert" className="bg-danger-soft px-4 py-2 text-center text-sm text-danger">
          This browser is blocking storage, so your history will not be saved after you close the tab.
        </div>
      )}
      {page}
      {!focused && <BuildInfo />}
    </Shell>
  )
}
