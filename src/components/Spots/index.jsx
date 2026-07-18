import { useState, useEffect } from 'react'
import { ref, onValue, push, update as dbUpdate, set, remove } from 'firebase/database'
import { db } from '../../firebase'
import { parseArticles } from '../../utils/articles'
import { Plus, X, MapPin, ExternalLink, CalendarPlus } from 'lucide-react'

const SPOT_TAGS = ['景點', '餐廳', '咖啡', '購物', '溫泉', '文化', '自然']

const TAG_STYLE = {
  景點: 'bg-[#C4B08A]/20 text-[#8A7748]',
  餐廳: 'bg-[#C09B7A]/20 text-[#8A6A4C]',
  咖啡: 'bg-stone-200/60 text-stone-500',
  購物: 'bg-[#C29CA4]/20 text-[#8E6470]',
  溫泉: 'bg-[#93A7B5]/20 text-[#5F7482]',
  文化: 'bg-[#9A8FA8]/20 text-[#6C6180]',
  自然: 'bg-[#7E9384]/20 text-[#54685A]',
}

// 排入行程用的日期選項（對應 itinerary/day{N}）
const DAY_OPTIONS = [
  { day: 1, date: '10/1', place: '名古屋' },
  { day: 2, date: '10/2', place: '馬籠宿・高山' },
  { day: 3, date: '10/3', place: '上高地・新穗高' },
  { day: 4, date: '10/4', place: '白川鄉・高山' },
  { day: 5, date: '10/5', place: '犬山・名古屋' },
  { day: 6, date: '10/6', place: '返家之旅' },
]

const EMPTY_FORM = {
  name: '', address: '', tags: [], notes: '',
  mapUrl: '', phone: '', website: '', articles: '', details: '',
}

function useSpots() {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const r = ref(db, 'spots')
      const unsub = onValue(r, (snap) => {
        const data = snap.val()
        if (data) {
          const list = Object.entries(data).map(([id, val]) => ({ id, ...val }))
          setSpots(list)
        } else {
          setSpots([])
        }
        setLoading(false)
      }, () => setLoading(false))
      return unsub
    } catch {
      setLoading(false)
    }
  }, [])

  return {
    spots, loading,
    addSpot:    (spot) => push(ref(db, 'spots'), spot),
    updateSpot: (id, spot) => set(ref(db, `spots/${id}`), spot),
    patchSpot:  (id, partial) => dbUpdate(ref(db, `spots/${id}`), partial),
    removeSpot: (id) => remove(ref(db, `spots/${id}`)),
  }
}

function spotToForm(spot) {
  return {
    name: spot.name || '', address: spot.address || '', tags: spot.tags || [],
    notes: spot.notes || '', mapUrl: spot.mapUrl || '', phone: spot.phone || '',
    website: spot.website || '', articles: spot.articles || '', details: spot.details || '',
  }
}

export default function Spots() {
  const { spots, loading, addSpot, updateSpot, patchSpot, removeSpot } = useSpots()
  const [filterTag, setFilterTag] = useState('全部')

  const [viewSpot, setViewSpot] = useState(null)   // null = modal closed
  const [editMode, setEditMode] = useState(false)
  const [isNew, setIsNew]       = useState(false)
  const [dayPicker, setDayPicker] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)

  const filtered = filterTag === '全部' ? spots : spots.filter(s => (s.tags || []).includes(filterTag))

  const openView  = (spot) => { setViewSpot(spot); setEditMode(false); setIsNew(false); setDayPicker(false) }
  const startEdit = ()     => { setForm(spotToForm(viewSpot)); setEditMode(true) }
  const openNew   = ()     => { setViewSpot({}); setForm(EMPTY_FORM); setEditMode(true); setIsNew(true); setDayPicker(false) }
  const closeModal = ()    => { setViewSpot(null); setEditMode(false); setIsNew(false); setDayPicker(false) }

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (isNew) {
      await addSpot(form)
    } else {
      // 保留已排入標記等表單以外的欄位
      const { id, ...rest } = viewSpot
      await updateSpot(id, { ...rest, ...form })
    }
    closeModal()
  }

  const handleDelete = async () => {
    if (!window.confirm('確定要刪除這個願望嗎？')) return
    await removeSpot(viewSpot.id)
    closeModal()
  }

  // 一鍵排入行程：複製成該日的行程項目（標籤預設「備案」），並在願望卡標記已排入
  const handleAddToDay = async (day) => {
    const s = viewSpot
    await push(ref(db, `itinerary/day${day}`), {
      time: '12:00',
      title: s.name || '',
      tag: '備案',
      notes: s.notes || '',
      mapUrl: s.mapUrl || '',
      address: s.address || '',
      phone: s.phone || '',
      website: s.website || '',
      articles: s.articles || '',
      reservationNo: '',
      details: s.details || '',
    })
    await patchSpot(s.id, { scheduledDay: day })
    setViewSpot(v => ({ ...v, scheduledDay: day }))
    setDayPicker(false)
  }

  const articleLinks = viewSpot ? parseArticles(viewSpot.articles) : []
  const hasLinks = viewSpot && !editMode && viewSpot.id && (viewSpot.mapUrl || viewSpot.website || articleLinks.length > 0)

  return (
    <div className="pb-28 md:pb-10">
      {/* Filter */}
      <div className="flex gap-2 px-4 md:px-8 py-4 md:py-5 overflow-x-auto no-scrollbar">
        {['全部', ...SPOT_TAGS].map(tag => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
              filterTag === tag ? 'bg-sage text-white' : 'bg-oat text-stone-500 border border-[#E2DCD1]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Wish Grid */}
      <div className="px-4 md:px-8">
        {loading ? (
          <p className="text-center text-stone-300 text-sm py-10">載入中⋯</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-stone-300 py-14">
            <div className="text-4xl mb-3">🎐</div>
            <p className="text-sm">{filterTag === '全部' ? '還沒有願望' : `沒有「${filterTag}」類願望`}</p>
            <p className="text-xs mt-1">點右下角 ＋ 許下第一個想去想吃的地方</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map(spot => (
              <div
                key={spot.id}
                onClick={() => openView(spot)}
                className="bg-oat rounded-2xl p-3.5 shadow-sm border border-[#E2DCD1] relative flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
              >
                {spot.scheduledDay && (
                  <span className="absolute -top-2 left-3 text-[10px] px-2 py-0.5 rounded-full bg-sage text-white font-bold shadow-sm">
                    已排入 10/{spot.scheduledDay}
                  </span>
                )}

                <p className="font-semibold text-stone-800 text-sm pr-1 leading-snug mt-1">{spot.name}</p>

                {spot.address && (
                  <p className="text-[11px] text-stone-400 mt-0.5 truncate">{spot.address}</p>
                )}

                {(spot.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {spot.tags.map(tag => (
                      <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TAG_STYLE[tag] || 'bg-stone-100 text-stone-500'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {spot.notes && (
                  <p className="text-[11px] text-stone-500 mt-2 leading-relaxed line-clamp-3 flex-1">{spot.notes}</p>
                )}

                {spot.mapUrl && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-sage mt-2.5 font-medium">
                    <MapPin size={10} />地圖
                    <ExternalLink size={9} />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed right-4 bottom-20 md:bottom-10 md:right-[calc(50%-24rem+2rem)] lg:right-[calc(50%-32rem+2rem)] bg-sage text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ width: 52, height: 52 }}
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {viewSpot && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-oat w-full max-w-md md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl relative"
            style={{ maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100/80 bg-white/50 shrink-0">
              {editMode ? (
                <h3 className="font-serif font-bold text-lg tracking-widest text-[#43473F]">
                  {isNew ? '新增願望' : '編輯願望'}
                </h3>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {(viewSpot.tags || []).map(tag => (
                    <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TAG_STYLE[tag] || 'bg-stone-100 text-stone-500'}`}>
                      {tag}
                    </span>
                  ))}
                  {viewSpot.scheduledDay && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage text-white font-bold">
                      已排入 10/{viewSpot.scheduledDay}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 shrink-0">
                {!editMode && viewSpot.id && (
                  <>
                    <button onClick={startEdit} className="text-xl text-gray-400 hover:text-[#4A4A43] transition-colors" title="編輯">✏️</button>
                    <button onClick={handleDelete} className="text-xl text-gray-400 hover:text-[#B08A8B] transition-colors" title="刪除">🗑️</button>
                  </>
                )}
                <button onClick={closeModal} className="text-2xl font-light text-gray-400 hover:text-[#4A4A43] transition-colors leading-none">×</button>
              </div>
            </div>

            {/* View mode */}
            {!editMode && viewSpot.id && (
              <>
                <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-7">
                  <h2 className="font-serif text-[1.6rem] font-bold text-[#43473F] mb-3 leading-snug">
                    {viewSpot.name}
                  </h2>

                  {viewSpot.address && (
                    <p className="text-[0.8rem] text-gray-500 mb-6 flex items-start gap-1.5">
                      <span className="text-xs opacity-60 mt-0.5">📍</span>
                      {viewSpot.address}
                    </p>
                  )}

                  {viewSpot.phone && (
                    <div className="mb-6 bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center gap-4">
                      <span className="text-[#A5998A] text-xl">📞</span>
                      <div>
                        <p className="text-[0.55rem] text-[#A5998A] tracking-[0.2em] uppercase mb-0.5 font-bold">Phone / GPS</p>
                        <p className="font-mono font-bold text-lg text-[#43473F] tracking-wider">{viewSpot.phone}</p>
                      </div>
                    </div>
                  )}

                  {viewSpot.notes && (
                    <p className="text-[0.9rem] text-[#6B685C] leading-relaxed mb-6">{viewSpot.notes}</p>
                  )}

                  {viewSpot.details && (
                    <div className="relative pl-5 space-y-4 mb-6">
                      <div className="absolute left-0 top-1 bottom-1 w-[1px] bg-gray-200" />
                      {viewSpot.details.split('\n').filter(l => l.trim()).map((line, idx) => (
                        <div key={idx} className="relative text-[0.85rem] text-gray-600 leading-relaxed">
                          <div className="absolute left-[-21px] top-2 w-2 h-2 rounded-full bg-[#C4BCAC]" />
                          {line}
                        </div>
                      ))}
                    </div>
                  )}

                  {hasLinks && (
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      {viewSpot.mapUrl && (
                        <a
                          href={viewSpot.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-[#6F8172] text-white py-3 rounded-xl text-center text-xs tracking-widest font-bold shadow-md active:opacity-80 transition-opacity"
                        >
                          🧭 地圖導航
                        </a>
                      )}
                      {viewSpot.website && (
                        <a
                          href={viewSpot.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-[#AD8B76] text-white py-3 rounded-xl text-center text-xs tracking-widest font-bold shadow-md active:opacity-80 transition-opacity"
                        >
                          🌐 官方網站
                        </a>
                      )}
                      {articleLinks.map((a, i) => (
                        <a
                          key={i}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="basis-full bg-white border border-[#AD8B76] text-[#8A6A4C] py-3 rounded-xl text-center text-xs font-bold shadow-sm active:opacity-80 transition-opacity truncate px-4"
                        >
                          📖 {a.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schedule footer */}
                <div
                  className="p-4 bg-white border-t border-gray-100 shrink-0"
                  style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                >
                  {dayPicker ? (
                    <div className="animate-fade-in">
                      <p className="text-[0.6rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold mb-2.5 text-center">
                        要排進哪一天？
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {DAY_OPTIONS.map(({ day, date, place }) => (
                          <button
                            key={day}
                            onClick={() => handleAddToDay(day)}
                            className="border border-[#DED9CF] rounded-xl py-2 px-1 text-center hover:bg-[#F4F1EB] active:scale-95 transition-transform"
                          >
                            <span className="block text-sm font-bold text-[#43473F]">{date}</span>
                            <span className="block text-[0.58rem] text-[#A5998A] truncate">{place}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setDayPicker(false)}
                        className="w-full mt-2.5 py-2 text-xs text-gray-400 tracking-widest"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDayPicker(true)}
                      className="w-full bg-sage text-white py-3.5 rounded-xl text-sm tracking-widest font-bold shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <CalendarPlus size={16} />
                      {viewSpot.scheduledDay ? `再排一次（已排入 10/${viewSpot.scheduledDay}）` : '排入行程'}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Edit form */}
            {editMode && (
              <>
                <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-6 space-y-5">
                  <div>
                    <label className="block text-[0.58rem] text-[#6F8172] tracking-[0.2em] uppercase mb-1 font-bold">名稱 *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="例：鰻魚飯三吃 あつた蓬萊軒"
                      autoFocus
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] font-serif bg-transparent text-base transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.58rem] text-[#6F8172] tracking-[0.2em] uppercase mb-2 font-bold">分類（可複選）</label>
                    <div className="flex flex-wrap gap-2">
                      {SPOT_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                            form.tags.includes(tag)
                              ? 'bg-sage text-white border-sage'
                              : 'border-[#DED9CF] text-stone-500 bg-oat'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.58rem] text-[#6F8172] tracking-[0.2em] uppercase mb-1 font-bold">一句話介紹</label>
                    <input
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="為什麼想去？顯示在小卡上"
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] bg-transparent text-sm transition-colors"
                    />
                  </div>

                  <div className="border-t border-dashed border-gray-200" />

                  <div>
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">地址</label>
                    <input
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="導航用地址"
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] bg-transparent text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">Google Maps 連結</label>
                    <input
                      value={form.mapUrl}
                      onChange={e => setForm(f => ({ ...f, mapUrl: e.target.value }))}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] bg-transparent text-sm transition-colors"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">電話</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="052-..."
                        className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] font-mono bg-transparent text-sm transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">官方網站</label>
                      <input
                        value={form.website}
                        onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                        placeholder="https://..."
                        className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] bg-transparent text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">參考文章（一行一篇：標題 | 網址）</label>
                    <textarea
                      rows={3}
                      value={form.articles}
                      onChange={e => setForm(f => ({ ...f, articles: e.target.value }))}
                      placeholder={'高山老街散策攻略 | https://...\n只貼網址也可以'}
                      className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-[#6F8172] bg-transparent text-sm resize-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">詳細內文（換行自動分段）</label>
                    <textarea
                      rows={4}
                      value={form.details}
                      onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                      placeholder="營業時間、想吃的品項、注意事項⋯"
                      className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-[#6F8172] bg-transparent text-sm resize-none transition-colors"
                    />
                  </div>
                </div>

                <div
                  className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0"
                  style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                >
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3.5 bg-[#F4F1EB] text-gray-500 rounded-xl text-xs tracking-widest font-bold uppercase hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.name.trim()}
                    className="flex-1 py-3.5 bg-[#6F8172] text-white rounded-xl text-xs tracking-widest font-bold uppercase disabled:opacity-40 shadow-md active:scale-[0.98] transition-transform"
                  >
                    儲存
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
