import { useState, useEffect } from 'react'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { db } from '../../firebase'

const DAY_DATA = [
  { week: 'THU', date: '10/01', subtitle: '名古屋', desc: '開啟自駕的序幕',
    image: `${import.meta.env.BASE_URL}images/day1.jpg`,
    lat: 35.1815, lon: 136.9066 },
  { week: 'FRI', date: '10/02', subtitle: '馬籠宿・高山', desc: '走進江戶時代',
    image: `${import.meta.env.BASE_URL}images/day2.jpg`,
    lat: 36.1408, lon: 137.2523 },
  { week: 'SAT', date: '10/03', subtitle: '上高地・新穗高', desc: '神明降臨的阿爾卑斯',
    image: `${import.meta.env.BASE_URL}images/day3.jpg`,
    lat: 36.2453, lon: 137.6156 },
  { week: 'SUN', date: '10/04', subtitle: '白川鄉・高山', desc: '探訪合掌村',
    image: `${import.meta.env.BASE_URL}images/day4.jpg`,
    lat: 36.2575, lon: 136.9062 },
  { week: 'MON', date: '10/05', subtitle: '金澤', desc: '加賀百萬石榮華',
    image: `${import.meta.env.BASE_URL}images/day5.jpg`,
    lat: 36.5944, lon: 136.6256 },
  { week: 'TUE', date: '10/06', subtitle: '返家之旅', desc: '滿載回憶',
    image: `${import.meta.env.BASE_URL}images/day6.jpg`,
    lat: 35.1815, lon: 136.9066 },
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

function getWeatherEmoji(code) {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌧️'
  return '⛈️'
}

function getOutfit(temp) {
  if (temp >= 28) return { icon: '👕', text: '炎熱，短袖輕便出行，做好防曬補水' }
  if (temp >= 24) return { icon: '🧢', text: '微熱舒適，短袖為主，薄外套備用即可' }
  if (temp >= 20) return { icon: '🧥', text: '微涼舒適，建議穿著短袖或薄長袖，搭配輕薄小外套即可' }
  if (temp >= 15) return { icon: '🧥', text: '偏涼，長袖加外套，注意早晚溫差' }
  if (temp >= 10) return { icon: '🧤', text: '頗冷，外套必備，可備毛衣或厚外套' }
  return { icon: '🧣', text: '寒冷！需要厚外套或羽絨衣，別忘圍巾手套' }
}

function useWeather(lat, lon) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,weathercode&current_weather=true` +
      `&timezone=Asia%2FTokyo&forecast_days=2`
    )
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [lat, lon])

  return { data, loading }
}

function WeatherWidget({ lat, lon }) {
  const { data, loading } = useWeather(lat, lon)
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className="mx-5 md:mx-0 mb-4 h-20 bg-[#F7F5F0] rounded-sm animate-pulse" />
    )
  }
  if (!data?.hourly || !data?.current_weather) return null

  // current_weather.time may include minutes ("2026-06-21T18:15"); hourly array is whole-hour only
  const currentHourStr = data.current_weather.time.slice(0, 13) + ':00'
  const startIdx = data.hourly.time.indexOf(currentHourStr)
  if (startIdx < 0) return null

  const slots = Array.from({ length: 5 }, (_, i) => {
    const idx = startIdx + i
    if (idx >= data.hourly.time.length) return null
    const hourStr = data.hourly.time[idx].split('T')[1].slice(0, 5)
    return {
      label: i === 0 ? '現在' : hourStr,
      emoji: getWeatherEmoji(data.hourly.weathercode[idx]),
      temp: Math.round(data.hourly.temperature_2m[idx]),
    }
  }).filter(Boolean)

  const currentTemp = slots[0]?.temp ?? Math.round(data.current_weather.temperature)
  const outfit = getOutfit(currentTemp)

  return (
    <div className="mx-5 md:mx-0 mb-4">
      {/* Hourly strip — always visible, tap to toggle detail */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center px-4 py-3 bg-[#F7F5F0] rounded-sm border border-[#EBE7DF] active:opacity-80 transition-opacity"
      >
        {slots.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={`text-[0.58rem] tracking-wider ${i === 0 ? 'text-[#8B2C2C] font-bold' : 'text-[#A5998A]'}`}>
              {s.label}
            </span>
            <span className="text-xl leading-none">{s.emoji}</span>
            <span className={`text-sm font-bold leading-none ${i === 0 ? 'text-[#222]' : 'text-[#555]'}`}>
              {s.temp}°
            </span>
          </div>
        ))}
        <span className="text-[#C5BAA8] text-xs ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expandable outfit guide */}
      {open && (
        <div className="mt-1.5 flex items-start gap-3 bg-[#F7F5F0] border border-[#EBE7DF] rounded-sm px-4 py-3 animate-fade-in">
          <span className="text-2xl mt-0.5 shrink-0">{outfit.icon}</span>
          <div>
            <p className="text-[0.52rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold mb-1">Outfit Guide</p>
            <p className="text-[0.82rem] text-[#555] leading-relaxed">{outfit.text}</p>
          </div>
        </div>
      )}
    </div>
  )
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
      <div className="sticky top-[90px] md:top-[72px] z-10 bg-[#FDFCFB] flex justify-between md:justify-center md:gap-14 px-6 py-4 border-b border-gray-100">
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

      {/* Desktop: two-column layout (hero + weather | timeline) */}
      <div className="md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10 md:px-8 md:pt-6 md:items-start">
      <div className="md:sticky md:top-[150px]">
      {/* Hero image */}
      <div className="px-5 md:px-0 py-4 md:pt-0 flex gap-4 items-stretch h-52 md:h-80">
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

      {/* Weather widget */}
      <WeatherWidget lat={day.lat} lon={day.lon} />
      </div>

      {/* Timeline */}
      <div className="px-5 md:px-0 pb-44 md:pb-32">
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
      </div>

      {/* Floating bottom card */}
      {!loading && items.length > 0 && (
        <div className="fixed bottom-14 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl px-4 z-20 pointer-events-none">
          <div className="bg-[#FDFCFB]/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-3 flex items-stretch pointer-events-auto">
            {/* GPS OFF */}
            <div className="flex flex-col items-center justify-center px-3 border-r border-gray-200/80 shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A5998A" strokeWidth="1.5" className="mb-1">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="2" x2="2" y2="22" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-[0.5rem] text-[#A5998A] font-bold tracking-widest leading-none mt-0.5 text-center">GPS<br/>OFF</span>
            </div>
            {/* Current event */}
            <div
              className="flex-1 px-4 flex flex-col justify-center min-w-0 cursor-pointer active:opacity-70 transition-opacity"
              onClick={() => openView(items[0])}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif text-xl font-bold text-[#222] leading-none">{items[0].time || '--:--'}</span>
                <span className="text-[0.5rem] border border-gray-300 text-gray-500 px-1.5 py-0.5 rounded tracking-widest shrink-0">行程預覽</span>
              </div>
              <p className="font-serif font-bold text-[#222] text-[0.88rem] truncate mb-0.5">{items[0].title}</p>
              {items[1] && (
                <p className="text-[0.62rem] text-gray-500 truncate flex items-center gap-1">
                  <span className="text-gray-400">→</span> {items[1].title}
                </p>
              )}
            </div>
            {/* Next time */}
            {items[1] && (
              <div
                className="flex flex-col items-center justify-center px-3 border-l border-gray-200/80 shrink-0 min-w-[64px] cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => openView(items[1])}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" className="mb-1">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-serif font-bold text-[#222] text-base leading-none">{items[1].time || '--:--'}</span>
                <span className="text-[0.5rem] text-gray-500 tracking-widest mt-1">下個時間</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal overlay */}
      {viewItem && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-[#FDFCFB] w-full max-w-md md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl relative"
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
                    <div className="border-t border-dashed border-[#EBE7DF] pt-4 mt-4 relative pb-2">
                      <p className="text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">Confirmation No.</p>
                      <p className="font-mono text-xl font-bold text-[#333] tracking-widest">{viewItem.reservationNo}</p>
                      <div className="stamp-tag">訂單代號</div>
                    </div>
                  </div>
                )}

                {viewItem.tag === '住宿' && (
                  <div className="mb-8 bg-white border border-gray-100 p-4 rounded-sm shadow-sm">
                    <p className="text-[0.58rem] text-[#B29D82] tracking-[0.2em] uppercase font-bold mb-3">住宿憑證（Vouchers）</p>
                    <p className="text-[0.78rem] text-gray-400 text-center py-3 italic">尚未上傳憑證</p>
                    <button
                      onClick={() => alert('PDF 上傳功能即將推出，請先將訂房確認信儲存於手機相簿 🙏')}
                      className="w-full mt-1 py-2.5 border border-dashed border-[#D4C8B8] text-[#A5998A] rounded-sm text-[0.75rem] tracking-widest hover:bg-[#F8F7F4] transition-colors"
                    >
                      ＋ 上傳 PDF
                    </button>
                  </div>
                )}

                {(viewItem.phone || viewItem.notes || viewItem.details) && (
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-[#A5998A] text-xs">ⓘ</span>
                    <span className="text-[0.6rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold">關於此處（About）</span>
                    <div className="flex-1 h-[1px] bg-gray-100" />
                  </div>
                )}

                {viewItem.phone && (
                  <div className="mb-6 bg-white border border-gray-100 p-4 rounded-sm shadow-sm flex items-center gap-4">
                    <span className="text-[#A5998A] text-xl">📞</span>
                    <div>
                      <p className="text-[0.55rem] text-[#A5998A] tracking-[0.2em] uppercase mb-0.5 font-bold">Phone / GPS</p>
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
