import { useState, useEffect } from 'react'
import { ref, onValue, remove } from 'firebase/database'
import { db } from '../../firebase'
import { X, Check, ChevronRight } from 'lucide-react'

const DEFAULT_CATEGORIES = ['證件', '衣物', '盥洗', '電子', '藥品', '其他']

const ESSENTIALS = [
  {
    id: 'esim',
    icon: '📶',
    title: 'eSIM 上網卡',
    tagline: '每人一張，出發前先買好裝好',
    sections: [
      {
        heading: '出發前',
        points: [
          '確認手機支援 eSIM（iPhone XS 之後都支援）；不支援的改買實體 SIM，或到日本跟家人開熱點分享',
          '在台灣先買好並完成安裝——安裝要連 Wi-Fi 掃 QR Code，QR Code 信件先留著不要刪',
          '天數要涵蓋 10/01–10/06，買 6 天以上',
        ],
      },
      {
        heading: '落地後',
        points: [
          '把 eSIM 線路的「數據漫遊」打開才能上網',
          '台灣主門號的漫遊記得關閉，避免收到天價帳單',
        ],
      },
    ],
  },
  {
    id: 'vjw',
    icon: '🛂',
    title: 'Visit Japan Web',
    tagline: '入境線上手續，七人每人都要辦',
    sections: [
      {
        heading: '怎麼辦理',
        points: [
          '註冊 Visit Japan Web 帳號，登錄本人資料（也可由一人註冊後加入同行家人）',
          '填寫「入境審查」與「海關申報」——抵達日 10/01，入境機場選中部國際機場（NGO）',
          '出發前把 QR Code 截圖存到手機相簿，通關時直接出示',
        ],
      },
      {
        heading: '時間',
        points: ['建議出發前 1–2 週完成，最晚出發前一天'],
      },
    ],
    link: { label: '前往 Visit Japan Web →', url: 'https://www.vjw.digital.go.jp/' },
  },
]

const CHECKED_KEY = 'luggage-checked'

function loadChecked() {
  try {
    return JSON.parse(localStorage.getItem(CHECKED_KEY)) || {}
  } catch {
    return {}
  }
}

function usePacking() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const r = ref(db, 'packing')
      const unsub = onValue(r, (snap) => {
        const data = snap.val()
        if (data) {
          const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
          setItems(list)
        } else {
          setItems([])
        }
        setLoading(false)
      }, () => setLoading(false))
      return unsub
    } catch {
      setLoading(false)
    }
  }, [])

  const deleteItem = (id) => remove(ref(db, `packing/${id}`))

  return { items, loading, deleteItem }
}

export default function Packing() {
  const { items, loading, deleteItem } = usePacking()
  const [checked, setChecked] = useState(loadChecked)
  const [detail, setDetail] = useState(null)

  const total = items.length

  // 勾選狀態只存在自己的手機（localStorage），每個人各勾各的，不同步
  const toggleItem = (id) => {
    setChecked(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = true
      localStorage.setItem(CHECKED_KEY, JSON.stringify(next))
      return next
    })
  }

  const grouped = DEFAULT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat)
    return acc
  }, {})
  const extraCats = [...new Set(items.map(i => i.category))].filter(c => !DEFAULT_CATEGORIES.includes(c))
  extraCats.forEach(cat => { grouped[cat] = items.filter(i => i.category === cat) })
  const allCats = [...DEFAULT_CATEGORIES, ...extraCats]

  return (
    <div className="pb-28 md:pb-10">
      {/* Essentials */}
      <div className="mx-4 md:mx-8 mt-4 md:mt-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-[#6F8172] uppercase tracking-widest">✦ 重要準備</span>
        </div>
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {ESSENTIALS.map(item => (
            <button
              key={item.id}
              onClick={() => setDetail(item)}
              className="w-full flex items-center gap-3 bg-oat rounded-2xl px-4 py-3.5 shadow-sm border border-[#6F8172]/30 text-left active:scale-[0.98] transition-transform"
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-stone-700">{item.title}</span>
                <span className="block text-xs text-stone-400 mt-0.5">{item.tagline}</span>
              </span>
              <ChevronRight size={16} className="text-[#6F8172] flex-shrink-0" />
            </button>
          ))}
        </div>
        <p className="text-[0.65rem] text-stone-400 mt-2 px-1">
          下方清單為大家共用的提醒；勾選只存在自己的手機，各勾各的不會互相影響。
        </p>
      </div>

      {/* Checklist Groups */}
      <div className={`px-4 md:px-8 mt-4 md:mt-6 space-y-5 pb-4 ${
        !loading && total > 0 ? 'md:space-y-0 md:columns-2 md:gap-x-8' : ''
      }`}>
        {loading ? (
          <p className="text-center text-stone-300 text-sm py-10">載入中⋯</p>
        ) : total === 0 ? (
          <div className="text-center text-stone-300 py-12">
            <div className="text-4xl mb-3">🎒</div>
            <p className="text-sm">還沒有行李提醒</p>
          </div>
        ) : (
          allCats.map(cat =>
            grouped[cat]?.length > 0 ? (
              <div key={cat} className="md:mb-6 md:break-inside-avoid">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{cat}</span>
                </div>
                <div className="space-y-1.5">
                  {grouped[cat].map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-oat rounded-2xl px-3.5 py-3 shadow-sm border border-[#E2DCD1]"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                          checked[item.id] ? 'bg-sage border-sage' : 'border-stone-300'
                        }`}
                      >
                        {checked[item.id] && <Check size={11} className="text-white" strokeWidth={3} />}
                      </button>
                      <span className={`flex-1 text-sm transition-colors ${
                        checked[item.id] ? 'line-through text-stone-300' : 'text-stone-700'
                      }`}>
                        {item.name}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 text-stone-200 hover:text-[#B08A8B] active:scale-90 transition-transform"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </div>

      {/* Essential Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail(null)} />
          <div className="relative bg-oat rounded-t-3xl md:rounded-3xl md:w-full md:max-w-md px-5 pt-5 pb-8 max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                <span className="text-xl">{detail.icon}</span>
                {detail.title}
              </h3>
              <button onClick={() => setDetail(null)} className="text-stone-300 hover:text-stone-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {detail.sections.map(sec => (
                <div key={sec.heading}>
                  <p className="text-xs font-semibold text-[#6F8172] uppercase tracking-widest mb-2">{sec.heading}</p>
                  <ul className="space-y-2">
                    {sec.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0 mt-[0.45rem]" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {detail.link && (
              <a
                href={detail.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-sage text-oat font-bold tracking-widest text-xs rounded-xl py-3 mt-5 shadow-[0_4px_10px_-4px_rgba(111,129,114,0.6)] active:scale-95 transition-transform"
              >
                {detail.link.label}
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
