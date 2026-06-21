import { useState } from 'react'
import Itinerary from './components/Itinerary'
import Budget from './components/Budget'
import Packing from './components/Packing'
import Spots from './components/Spots'
import Tools from './components/Tools'
import Seed from './components/Seed'

const TABS = [
  { id: 'itinerary', label: '行程' },
  { id: 'budget',    label: '預算' },
  { id: 'packing',   label: '打包' },
  { id: 'spots',     label: '景點' },
  { id: 'tools',     label: '工具' },
  { id: 'seed',      label: '初始化' },
]

export default function App() {
  const [tab, setTab] = useState('itinerary')

  return (
    <div className="max-w-md mx-auto bg-[#FDFCFB] min-h-screen text-[#333]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FDFCFB] px-5 pt-8 pb-3 flex flex-col items-center">
        <h1 className="font-serif text-[1.3rem] font-bold tracking-widest text-[#222]">
          🏔️ 10月中部旅行
        </h1>
        <span className="mt-1 border border-[#E0DCD0] bg-[#F7F5F0] rounded-full px-2.5 py-0.5 text-[0.55rem] text-[#888] tracking-widest shadow-sm">
          2026/10/01–10/06 · 七人同行
        </span>
      </header>

      {/* Main content */}
      <main>
        {tab === 'itinerary' && <Itinerary />}
        {tab === 'budget'    && <Budget />}
        {tab === 'packing'   && <Packing />}
        {tab === 'spots'     && <Spots />}
        {tab === 'tools'     && <Tools />}
        {tab === 'seed'      && <Seed />}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#FDFCFB]/90 backdrop-blur-md border-t border-gray-100 px-8 py-3 flex justify-between items-center z-30"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`text-xs tracking-widest uppercase transition-all ${
              tab === id ? 'text-[#222] font-bold' : 'text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
