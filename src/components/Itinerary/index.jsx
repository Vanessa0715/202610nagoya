import { useState, useEffect } from 'react'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { db } from '../../firebase'
import { Plus, MapPin, Trash2, X } from 'lucide-react'

const DAYS = [
  { label: 'Day 1', date: '10/01', week: '四' },
  { label: 'Day 2', date: '10/02', week: '五' },
  { label: 'Day 3', date: '10/03', week: '六' },
  { label: 'Day 4', date: '10/04', week: '日' },
  { label: 'Day 5', date: '10/05', week: '一' },
  { label: 'Day 6', date: '10/06', week: '二' },
]

const TAGS = ['景點', '交通', '早餐', '午餐', '晚餐', '點心', '備案', '裝備出租', '教練', '票券', '住宿']

const TAG_STYLE = {
  景點: 'bg-amber-100 text-amber-800',
  交通: 'bg-sky-100 text-sky-800',
  早餐: 'bg-orange-100 text-orange-700',
  午餐: 'bg-orange-100 text-orange-700',
  晚餐: 'bg-red-100 text-red-800',
  點心: 'bg-pink-100 text-pink-700',
  備案: 'bg-stone-100 text-stone-500',
  裝備出租: 'bg-teal-100 text-teal-700',
  教練: 'bg-green-100 text-green-800',
  票券: 'bg-purple-100 text-purple-700',
  住宿: 'bg-indigo-100 text-indigo-800',
}

const EMPTY_FORM = { time: '', title: '', tag: '景點', notes: '', mapUrl: '' }

function useItems(day) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setItems([])
    try {
      const r = ref(db, `itinerary/day${day}`)
      const unsub = onValue(r, (snap) => {
        const data = snap.val()
        if (data) {
          const list = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
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
  }, [day])

  const addItem = (item) => push(ref(db, `itinerary/day${day}`), item)
  const updateItem = (id, item) => set(ref(db, `itinerary/day${day}/${id}`), item)
  const deleteItem = (id) => remove(ref(db, `itinerary/day${day}/${id}`))

  return { items, loading, addItem, updateItem, deleteItem }
}

export default function Itinerary() {
  const [activeDay, setActiveDay] = useState(0)
  const { items, loading, addItem, updateItem, deleteItem } = useItems(activeDay + 1)
  const [modal, setModal] = useState({ open: false, item: null })
  const [form, setForm] = useState(EMPTY_FORM)

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setModal({ open: true, item: null })
  }
  const openEdit = (item) => {
    setForm({ time: item.time || '', title: item.title || '', tag: item.tag || '景點', notes: item.notes || '', mapUrl: item.mapUrl || '' })
    setModal({ open: true, item })
  }
  const closeModal = () => setModal({ open: false, item: null })

  const handleSave = async () => {
    if (!form.title.trim()) return
    if (modal.item) {
      await updateItem(modal.item.id, form)
    } else {
      await addItem(form)
    }
    closeModal()
  }

  const handleDelete = async () => {
    if (modal.item) {
      await deleteItem(modal.item.id)
      closeModal()
    }
  }

  return (
    <div>
      {/* Day Tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto no-scrollbar">
        {DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl transition-colors ${
              activeDay === i
                ? 'bg-nagoya-red text-white shadow-sm'
                : 'bg-white text-stone-500 border border-stone-100'
            }`}
          >
            <span className="text-xs font-semibold">{d.label}</span>
            <span className="text-[10px] opacity-75">{d.date}（{d.week}）</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="text-center text-stone-300 py-16 text-sm">載入中⋯</div>
        ) : items.length === 0 ? (
          <div className="text-center text-stone-300 py-16">
            <div className="text-4xl mb-3">🍂</div>
            <p className="text-sm">這天還沒有行程</p>
            <p className="text-xs mt-1">點右下角 ＋ 開始新增</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[3.4rem] top-2 bottom-2 w-px bg-stone-200" />
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openEdit(item)}
                  className="w-full flex gap-3 items-start text-left group"
                >
                  <div className="flex-shrink-0 w-12 pt-3 text-right">
                    <span className="text-[11px] text-stone-400 font-mono">{item.time || '—'}</span>
                  </div>
                  <div className="flex-shrink-0 mt-3.5 w-2.5 h-2.5 rounded-full bg-autumn ring-2 ring-cream relative z-10" />
                  <div className="flex-1 bg-white rounded-2xl px-3 py-2.5 shadow-sm border border-stone-100 group-active:bg-stone-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-stone-800 text-sm leading-snug">{item.title}</p>
                      {item.tag && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${TAG_STYLE[item.tag] || 'bg-stone-100 text-stone-500'}`}>
                          {item.tag}
                        </span>
                      )}
                    </div>
                    {item.notes && <p className="text-xs text-stone-400 mt-1 leading-relaxed">{item.notes}</p>}
                    {item.mapUrl && (
                      <a
                        href={item.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-matcha mt-1.5 font-medium"
                      >
                        <MapPin size={10} />地圖
                      </a>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed right-4 bottom-20 w-13 h-13 bg-nagoya-red text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ width: 52, height: 52 }}
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8 max-h-[88vh] overflow-y-auto">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800">{modal.item ? '編輯行程' : '新增行程'}</h3>
              <button onClick={closeModal} className="text-stone-300 hover:text-stone-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">時間</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-nagoya-red"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">標籤</label>
                  <select
                    value={form.tag}
                    onChange={(e) => setForm(f => ({ ...f, tag: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-nagoya-red bg-white"
                  >
                    {TAGS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1 block">名稱 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="如：名古屋城"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-nagoya-red"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1 block">備註</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="開放時間、集合地點⋯"
                  rows={2}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-nagoya-red"
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1 block">Google Maps 連結</label>
                <input
                  type="url"
                  value={form.mapUrl}
                  onChange={(e) => setForm(f => ({ ...f, mapUrl: e.target.value }))}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-nagoya-red"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              {modal.item && (
                <button
                  onClick={handleDelete}
                  className="px-3.5 py-2.5 border border-red-100 text-red-400 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!form.title.trim()}
                className="flex-1 bg-nagoya-red text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
