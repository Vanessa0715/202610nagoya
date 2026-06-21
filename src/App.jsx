import { useState } from 'react'
import { Calendar, Wallet, Package, MapPin } from 'lucide-react'
import Itinerary from './components/Itinerary'
import Budget from './components/Budget'
import Packing from './components/Packing'
import Spots from './components/Spots'

const TABS = [
  { id: 'itinerary', label: '行程', icon: Calendar },
  { id: 'budget', label: '預算', icon: Wallet },
  { id: 'packing', label: '打包', icon: Package },
  { id: 'spots', label: '景點', icon: MapPin },
]

export default function App() {
  const [tab, setTab] = useState('itinerary')

  return (
    <div className="min-h-screen bg-cream flex flex-col max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-nagoya-red text-white px-4 pt-4 pb-3 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-wide">名古屋・高山</h1>
            <p className="text-xs text-red-200 mt-0.5">10/01–10/06 · 2026 · 五人同行</p>
          </div>
          <span className="text-2xl mt-0.5">🍁</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'itinerary' && <Itinerary />}
        {tab === 'budget' && <Budget />}
        {tab === 'packing' && <Packing />}
        {tab === 'spots' && <Spots />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-stone-100 flex shadow-lg">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              tab === id ? 'text-nagoya-red' : 'text-stone-400'
            }`}
          >
            <Icon size={20} strokeWidth={tab === id ? 2.5 : 1.75} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
