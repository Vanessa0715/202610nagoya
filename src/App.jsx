import { useState } from 'react'
import { CalendarDays, Wallet, Luggage, Sparkles, Settings } from 'lucide-react'
import Itinerary from './components/Itinerary'
import Budget from './components/Budget'
import Packing from './components/Packing'
import Spots from './components/Spots'
import Tools from './components/Tools'

const TABS = [
  { id: 'itinerary', label: '行程', Icon: CalendarDays },
  { id: 'budget',    label: '預算', Icon: Wallet },
  { id: 'packing',   label: '行李', Icon: Luggage },
  { id: 'spots',     label: '願望', Icon: Sparkles },
  { id: 'tools',     label: '工具', Icon: Settings },
]

export default function App() {
  const [tab, setTab] = useState('itinerary')

  return (
    <div
      className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto min-h-screen text-ink"
      style={{
        background:
          'radial-gradient(120% 40% at 80% -5%, rgba(111,129,114,0.10), rgba(111,129,114,0) 55%), #E9E5DE',
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm px-5 pt-6 pb-3 flex flex-col items-center md:h-[72px] md:flex-row md:justify-between md:items-center md:px-8 md:pt-0 md:pb-0 md:border-b md:border-[#D6D0C4]">
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-3">
          <span className="text-[0.5rem] tracking-[0.3em] text-latte font-bold md:hidden">CHUBU · JAPAN</span>
          <h1 className="font-serif text-[1.3rem] font-bold tracking-widest text-[#43473F]">
            🏔️ 10月中部旅行
          </h1>
          <span className="mt-1 md:mt-0 border border-[#D6D0C4] bg-oat rounded-full px-2.5 py-0.5 text-[0.55rem] text-[#918A7C] tracking-widest shadow-sm">
            2026/10/01–10/06 · 七人同行
          </span>
        </div>
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`text-xs tracking-widest uppercase transition-all relative pb-1 ${
                tab === id ? 'text-[#43473F] font-bold' : 'text-[#A8A296] hover:text-[#6B685C]'
              }`}
            >
              {label}
              {tab === id && (
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-1 h-1 bg-sage rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main>
        {tab === 'itinerary' && <Itinerary />}
        {tab === 'budget'    && <Budget />}
        {tab === 'packing'   && <Packing />}
        {tab === 'spots'     && <Spots />}
        {tab === 'tools'     && <Tools />}
      </main>

      {/* Bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-oat/95 backdrop-blur-md border-t border-[#DED9CF] shadow-[0_-6px_16px_-12px_rgba(80,70,45,0.4)] px-2 pt-2 flex items-stretch gap-1 z-30"
        style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  active ? 'bg-sage text-oat shadow-[0_4px_10px_-4px_rgba(111,129,114,0.6)]' : 'text-[#A8A296]'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span
                className={`text-[0.62rem] tracking-widest transition-colors ${
                  active ? 'text-sage font-bold' : 'text-[#A8A296]'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
