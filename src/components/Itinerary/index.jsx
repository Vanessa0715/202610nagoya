import { useState, useEffect } from 'react'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { db } from '../../firebase'

const DAY_DATA = [
  { week: 'THU', date: '10/01', subtitle: '名古屋', desc: '開啟自駕的序幕',
    image: `${import.meta.env.BASE_URL}images/day1.jpg` },
  { week: 'FRI', date: '10/02', subtitle: '馬籠宿・高山', desc: '走進江戶時代',
    image: `${import.meta.env.BASE_URL}images/day2.jpg` },
  { week: 'SAT', date: '10/03', subtitle: '上高地・新穗高', desc: '神明降臨的阿爾卑斯',
    image: `${import.meta.env.BASE_URL}images/day3.jpg` },
  { week: 'SUN', date: '10/04', subtitle: '白川鄉・高山', desc: '探訪合掌村',
    image: `${import.meta.env.BASE_URL}images/day4.jpg` },
  { week: 'MON', date: '10/05', subtitle: '金澤', desc: '加賀百萬石榮華',
    image: `${import.meta.env.BASE_URL}images/day5.jpg` },
  { week: 'TUE', date: '10/06', subtitle: '返家之旅', desc: '滿載回憶',
    image: `${import.meta.env.BASE_URL}images/day6.jpg` },
]

const CN_NUMS = ['一', '二', '三', '四', '五', '六']

const TAGS = ['景點', '交通', '早餐', '午餐', '晚餐', '點心', '備案', '裝備出租', '教練', '票券', '住宿']

const getTagStyle = (tag) => {
  const map = {
    景點:     'text-[#879782] border-[#879782]/40 bg-[#879782]/5',
    交通:     'text-[#7A8B99] border-[#7A8B99]/40 bg-[#7A8B99]/5',
    早餐:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    午餐:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    晚餐:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    點心:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    住宿:     'text-[#B29D82] border-[#B29D82]/40 bg-[#B29D82]/5',
    票券:     'text-[#8A819C] border-[#8A819C]/40 bg-[#8A819C]/5',
    裝備出租: 'text-[#7A9999] border-[#7A9999]/40 bg-[#7A9999]/5',
    教練:     'text-[#7A9999] border-[#7A9999]/40 bg-[#7A9999]/5',
    備案:     'text-[#999] border-[#999]/40 bg-[#999]/5',
  }
  return map[tag] || 'text-gray-400 border-gray-200 bg-gray-50'
}

const EMPTY_FORM = {
  time: '12:00', title: '', tag: '景點', notes: '',
  mapUrl: '', address: '', phone: '', website: '', reservationNo: '', details: '',
}

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
        setItems(
          data
            ? Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
            : []
        )
        setLoading(false)
      }, () => setLoading(false))
      return unsub
    } catch {
      setLoading(false)
    }
  }, [day])

  return {
    items, loading,
    add:    (item) => push(ref(db, `itinerary/day${day}`), item),
    update: (id, item) => set(ref(db, `itinerary/day${day}/${id}`), item),
    del:    (id) => remove(ref(db, `itinerary/day${day}/${id}`)),
  }
}

function itemToForm(item) {
  return {
    time: item.time || '', title: item.title || '', tag: item.tag || '景點',
    notes: item.notes || '', mapUrl: item.mapUrl || '', address: item.address || '',
    phone: item.phone || '', website: item.website || '',
    reservationNo: item.reservationNo || '', details: item.details || '',
  }
}

export default function Itinerary() {
  const [activeDay, setActiveDay] = useState(0)
  const { items, loading, add, update, del } = useItems(activeDay + 1)

  const [viewItem, setViewItem]   = useState(null)  // null = modal closed
  const [editMode, setEditMode]   = useState(false)  // true = edit form visible
  const [isNew, setIsNew]         = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)

  const day = DAY_DATA[activeDay]

  const openView  = (item) => { setViewItem(item); setEditMode(false); setIsNew(false) }
  const startEdit = ()     => { setForm(itemToForm(viewItem)); setEditMode(true) }
  const openNew   = ()     => { setViewItem({}); setForm(EMPTY_FORM); setEditMode(true); setIsNew(true) }
  const closeModal = ()    => { setViewItem(null); setEditMode(false); setIsNew(false) }

  const handleSave = async () => {
    if (!form.title.trim()) return
    if (isNew) { await add(form) } else { await update(viewItem.id, form) }
    closeModal()
  }

  const handleDelete = async () => {
    if (!window.confirm('確定要刪除這個行程嗎？')) return
    await del(viewItem.id)
    closeModal()
  }

  const hasNav = viewItem && !editMode && viewItem.id && (viewItem.mapUrl || viewItem.website)

  return (
    <div>
      {/* Day selector */}
      <div className="flex justify-between px-6 py-4 border-b border-gray-100">
        {DAY_DATA.map((d, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className="flex flex-col items-center w-10 relative"
          >
            <span className={`text-[0.62rem] tracking-wider mb-1 transition-colors ${
              activeDay === i ? 'text-[#222] font-semibold' : 'text-gray-400'
            }`}>
              {d.week}
            </span>
            <span className={`text-xl leading-none transition-all ${
              activeDay === i ? 'font-bold text-[#222] scale-110' : 'text-gray-400 font-medium'
            }`}>
              {d.date.split('/')[1]}
            </span>
            {activeDay === i && (
              <div className="absolute -bottom-3 w-1 h-1 bg-[#8B2C2C] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Hero image */}
      <div className="px-5 py-4 flex gap-4 items-stretch" style={{ height: '13rem' }}>
        <div className="flex items-center justify-center w-6 shrink-0">
          <span
            className="font-serif text-[1.1rem] font-bold tracking-widest text-[#222]"
            style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
          >
            第{CN_NUMS[activeDay]}天
          </span>
        </div>
        <div className="relative flex-1 rounded-sm overflow-hidden shadow-sm bg-[#EBE7DF]">
          <img
            src={day.image}
            alt={day.subtitle}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="border border-white/60 px-1.5 py-0.5 text-[0.52rem] tracking-widest bg-black/20">
                DAY {activeDay + 1}
              </span>
              <span className="text-[0.58rem] tracking-widest opacity-90">📍 {day.subtitle}</span>
            </div>
            <h2 className="font-serif text-[1.2rem] font-bold tracking-widest leading-snug">{day.desc}</h2>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pb-44">
        {loading ? (
          <div className="text-center text-gray-300 py-16 text-sm tracking-widest">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-300 py-16">
            <div className="text-4xl mb-3">🍂</div>
            <p className="text-sm tracking-widest">這天還沒有行程</p>
          </div>
        ) : (
          <div className="pt-4">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex relative mb-10 cursor-pointer group"
                onClick={() => openView(item)}
              >
                <div className="w-16 text-right pr-4 pt-1 shrink-0">
                  <span className="text-[1.05rem] font-bold tracking-wider text-[#333]">
                    {item.time || '--:--'}
                  </span>
                </div>
                <div className="relative w-4 flex justify-center shrink-0">
                  {i < items.length - 1 && (
                    <div className="absolute top-3 bottom-[-40px] w-[1px] bg-[#E8E6E1]" />
                  )}
                  <div className="w-[5px] h-[5px] rounded-full bg-[#8B2C2C] mt-[10px] z-10 border border-white shadow-sm group-hover:scale-125 transition-transform" />
                </div>
                <div className="flex-1 pl-4 pb-2">
                  <h4 className="font-serif text-[1.15rem] font-bold text-[#222] leading-tight mb-2 tracking-wide">
                    {item.title}
                  </h4>
                  {item.tag && (
                    <span className={`text-[0.58rem] tracking-[0.18em] px-1.5 py-[1px] rounded-[3px] border ${getTagStyle(item.tag)}`}>
                      {item.tag.toUpperCase()}
                    </span>
                  )}
                  {item.notes && (
                    <p className="text-[0.82rem] text-[#666] mt-2 line-clamp-2">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={openNew}
          className="w-full py-3 border border-dashed border-[#D4C8B8] text-[#A5998A] rounded-sm text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-[#F8F7F4] transition-colors mt-2"
        >
          + 新增行程
        </button>
      </div>

      {/* Floating bottom card */}
      {!loading && items.length > 0 && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20 pointer-events-none">
          <div className="bg-[#FDFCFB]/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-3 flex items-stretch pointer-events-auto">
            <div
              className="flex-1 px-2 cursor-pointer active:opacity-70 transition-opacity"
              onClick={() => openView(items[0])}
            >
              <p className="text-[0.52rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold">Now</p>
              <p className="font-serif font-bold text-[#222] text-sm mt-0.5 truncate">{items[0].title}</p>
              <p className="text-[0.68rem] text-[#999] font-mono mt-0.5">{items[0].time || '--:--'}</p>
            </div>
            {items[1] && (
              <>
                <div className="w-[1px] bg-gray-100 mx-1 self-stretch" />
                <div
                  className="flex-1 px-2 cursor-pointer active:opacity-70 transition-opacity"
                  onClick={() => openView(items[1])}
                >
                  <p className="text-[0.52rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold">Next</p>
                  <p className="font-serif font-bold text-[#222] text-sm mt-0.5 truncate">{items[1].title}</p>
                  <p className="text-[0.68rem] text-[#999] font-mono mt-0.5">{items[1].time || '--:--'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal overlay */}
      {viewItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-[#FDFCFB] w-full max-w-md rounded-t-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl relative"
            style={{ maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100/80 bg-white/50 shrink-0">
              {editMode ? (
                <h3 className="font-serif font-bold text-lg tracking-widest text-[#222]">
                  {isNew ? '新增行程' : '編輯行程'}
                </h3>
              ) : (
                <div className="flex items-center gap-3">
                  {viewItem.tag && (
                    <span className={`border px-2 py-0.5 text-[0.6rem] uppercase tracking-widest ${getTagStyle(viewItem.tag)}`}>
                      {viewItem.tag}
                    </span>
                  )}
                  {viewItem.time && (
                    <span className="text-sm text-gray-500 font-mono tracking-wider">🕒 {viewItem.time}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4">
                {!editMode && viewItem.id && (
                  <>
                    <button onClick={startEdit} className="text-xl text-gray-400 hover:text-[#333] transition-colors" title="編輯">✏️</button>
                    <button onClick={handleDelete} className="text-xl text-gray-400 hover:text-[#8B2C2C] transition-colors" title="刪除">🗑️</button>
                  </>
                )}
                <button onClick={closeModal} className="text-2xl font-light text-gray-400 hover:text-[#333] transition-colors leading-none">×</button>
              </div>
            </div>

            {/* View mode */}
            {!editMode && viewItem.id && (
              <div className={`flex-1 overflow-y-auto hide-scrollbar px-6 py-8 ${hasNav ? 'pb-40' : 'pb-10'}`}>
                <h2 className="font-serif text-[1.6rem] font-bold text-[#222] mb-3 leading-snug">
                  {viewItem.title}
                </h2>

                {viewItem.address && (
                  <p className="text-[0.8rem] text-gray-500 mb-6 flex items-start gap-1.5">
                    <span className="text-xs opacity-60 mt-0.5">📍</span>
                    {viewItem.address}
                  </p>
                )}

                {viewItem.reservationNo && (
                  <div className="mb-8 bg-[#F8F7F4] border border-[#EBE7DF] p-5 rounded-sm shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4C8B8]" />
                    <p className="text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold mb-2">Reservation</p>
                    <p className="font-serif font-bold text-lg text-[#222]">{viewItem.title}</p>
                    <div className="border-t border-dashed border-[#EBE7DF] pt-4 mt-4">
                      <p className="text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">Confirmation No.</p>
                      <p className="font-mono text-xl font-bold text-[#333] tracking-widest">{viewItem.reservationNo}</p>
                    </div>
                  </div>
                )}

                {viewItem.phone && (
                  <div className="mb-6 bg-white border border-gray-100 p-4 rounded-sm shadow-sm flex items-center gap-4">
                    <span className="text-[#A5998A] text-xl">📞</span>
                    <div>
                      <p className="text-[0.55rem] text-[#A5998A] tracking-[0.2em] uppercase mb-0.5 font-bold">Phone</p>
                      <p className="font-mono font-bold text-lg text-[#222] tracking-wider">{viewItem.phone}</p>
                    </div>
                  </div>
                )}

                {viewItem.notes && (
                  <p className="text-[0.9rem] text-[#555] leading-relaxed mb-6">{viewItem.notes}</p>
                )}

                {viewItem.details && (
                  <div className="relative pl-5 space-y-4">
                    <div className="absolute left-0 top-1 bottom-1 w-[1px] bg-gray-200" />
                    {viewItem.details.split('\n').filter(l => l.trim()).map((line, idx) => (
                      <div key={idx} className="relative text-[0.85rem] text-gray-600 leading-relaxed">
                        <div className="absolute left-[-21px] top-2 w-2 h-2 rounded-full bg-[#D4C8B8]" />
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit form */}
            {editMode && (
              <div className="flex-1 overflow-y-auto hide-scrollbar px-6 py-6 space-y-5">
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-[0.58rem] text-[#879782] tracking-[0.2em] uppercase mb-1 font-bold">時間</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] font-mono bg-transparent text-lg transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[0.58rem] text-[#879782] tracking-[0.2em] uppercase mb-1 font-bold">標籤</label>
                    <select
                      value={form.tag}
                      onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] bg-transparent text-base transition-colors"
                    >
                      {TAGS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#879782] tracking-[0.2em] uppercase mb-1 font-bold">標題 *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="例：午餐：飛驒牛炸牛排"
                    autoFocus
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] font-serif bg-transparent text-base transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#879782] tracking-[0.2em] uppercase mb-1 font-bold">列表簡介</label>
                  <input
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="顯示在時間軸上的一行說明"
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] bg-transparent text-sm transition-colors"
                  />
                </div>

                <div className="border-t border-dashed border-gray-200" />

                <div>
                  <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">地址</label>
                  <input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="導航用地址"
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] bg-transparent text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">Google Maps 連結</label>
                  <input
                    value={form.mapUrl}
                    onChange={e => setForm(f => ({ ...f, mapUrl: e.target.value }))}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] bg-transparent text-sm transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">電話</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0577-..."
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] font-mono bg-transparent text-sm transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">預約代號</label>
                    <input
                      value={form.reservationNo}
                      onChange={e => setForm(f => ({ ...f, reservationNo: e.target.value }))}
                      placeholder="無可留空"
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] font-mono bg-transparent text-sm transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">官方網站</label>
                  <input
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#879782] bg-transparent text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">詳細內文（換行自動分段）</label>
                  <textarea
                    rows={4}
                    value={form.details}
                    onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                    placeholder="輸入詳細介紹或筆記..."
                    className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-[#879782] bg-transparent text-sm resize-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* View mode: map/website buttons */}
            {hasNav && (
              <div
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFCFB] via-[#FDFCFB]/90 to-transparent flex flex-col gap-2.5"
                style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
              >
                {viewItem.mapUrl && (
                  <a
                    href={viewItem.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-[#879782] text-white py-3.5 rounded text-center text-sm tracking-widest font-bold shadow-md active:opacity-80 transition-opacity"
                  >
                    🧭 Google Maps 導航
                  </a>
                )}
                {viewItem.website && (
                  <a
                    href={viewItem.website}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-[#B29D82] text-white py-3.5 rounded text-center text-sm tracking-widest font-bold shadow-md active:opacity-80 transition-opacity"
                  >
                    🌐 官方網站
                  </a>
                )}
              </div>
            )}

            {/* Edit mode: save/cancel */}
            {editMode && (
              <div
                className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0"
                style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
              >
                <button
                  onClick={closeModal}
                  className="flex-1 py-3.5 bg-[#F8F7F4] text-gray-500 rounded-sm text-xs tracking-widest font-bold uppercase hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="flex-1 py-3.5 bg-[#879782] text-white rounded-sm text-xs tracking-widest font-bold uppercase disabled:opacity-40 shadow-md active:scale-[0.98] transition-transform"
                >
                  儲存
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
