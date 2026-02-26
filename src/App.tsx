import { useState } from 'react'
import { AdminPage } from './pages/AdminPage'
import { ConnectPage } from './pages/ConnectPage'
import { needsOnboarding } from './lib/hubStore'

export default function App() {
  const [onboarding] = useState(() => needsOnboarding())

  if (onboarding) {
    return (
      <ConnectPage
        onConnected={() => {
          // Force useSocket to re-read the now-saved address on next mount
          window.location.reload()
        }}
      />
    )
  }

  return <AdminPage />
}
