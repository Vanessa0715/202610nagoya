import { useState, useEffect, useRef } from 'react'
import { BedDouble } from 'lucide-react'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { db } from '../../firebase'
import { parseArticles } from '../../utils/articles'

const DAY_DATA = [
  { week: 'THU', date: '10/01', subtitle: '名古屋', en: 'NAGOYA', desc: '開啟自駕的序幕',
    image: `${import.meta.env.BASE_URL}images/day1.jpg`,
    lat: 35.1815, lon: 136.9066 },
  { week: 'FRI', date: '10/02', subtitle: '馬籠宿・高山', en: 'MAGOME · TAKAYAMA', desc: '走進江戶時代',
    image: `${import.meta.env.BASE_URL}images/day2.jpg`,
    lat: 36.1408, lon: 137.2523 },
  { week: 'SAT', date: '10/03', subtitle: '上高地・新穗高', en: 'KAMIKOCHI · SHINHOTAKA', desc: '神明降臨的阿爾卑斯',
    image: `${import.meta.env.BASE_URL}images/day3.jpg`,
    lat: 36.2453, lon: 137.6156 },
  { week: 'SUN', date: '10/04', subtitle: '白川鄉・高山', en: 'SHIRAKAWA-GO · TAKAYAMA', desc: '探訪合掌村',
    image: `${import.meta.env.BASE_URL}images/day4.jpg`,
    lat: 36.2575, lon: 136.9062 },
  { week: 'MON', date: '10/05', subtitle: '犬山・名古屋', en: 'INUYAMA · NAGOYA', desc: '木曾川畔的國寶天守',
    image: `${import.meta.env.BASE_URL}images/day5.jpg`,
    lat: 35.3886, lon: 136.9391 },
  { week: 'TUE', date: '10/06', subtitle: '返家之旅', en: 'NAGOYA · HOME', desc: '滿載回憶',
    image: `${import.meta.env.BASE_URL}images/day6.jpg`,
    lat: 35.1815, lon: 136.9066 },
]

const CN_NUMS = ['一', '二', '三', '四', '五', '六']
const WEEK_CN = { THU: '四', FRI: '五', SAT: '六', SUN: '日', MON: '一', TUE: '二' }

// 每晚住宿（index 對應 DAY_DATA），query 用於 Google Maps 導航搜尋
const HOTELS = [
  { name: 'ixyz杜',                    query: 'ixyz杜 名古屋' },
  { name: 'Tabino Hotel lit Matsumoto', query: 'Tabino Hotel lit Matsumoto 松本' },
  { name: '東急ステイ飛驒高山',          query: '東急ステイ飛騨高山' },
  { name: '東急ステイ飛驒高山',          query: '東急ステイ飛騨高山' },
  { name: '大吉屋3号館（日赤館）',       query: '大吉屋3号館 日赤館 名古屋' },
  null, // 10/06 回程日，無住宿
]

// 每日路線總覽：大點依序排列，方位依真實地理相對關係手繪示意（非精確比例）；
// 每天第一站是前一晚住宿地，Day1 是抵達日故從機場開始
const ROUTES = [
  { dist: '約 40km・45min', w: 600, h: 420, stops: [
    { name: '中部國際機場', x: 190, y: 360 },
    { name: '名古屋',       x: 330, y: 170 },
    { name: 'ixyz杜',       x: 400, y: 90  },
  ]},
  { dist: '約 205km・3h50m', w: 600, h: 680, stops: [
    { name: '名古屋',   x: 70,  y: 620 },
    { name: '馬籠宿',   x: 150, y: 540 },
    { name: '妻籠宿',   x: 210, y: 460 },
    { name: '奈良井宿', x: 310, y: 340 },
    { name: '松本',     x: 380, y: 90  },
  ]},
  { dist: '約 110km・2h50m', w: 600, h: 620, stops: [
    { name: '松本',     x: 560, y: 220 },
    { name: '澤渡',     x: 400, y: 390, anchor: 'start', vAlign: 'below' },
    { name: '上高地',   x: 430, y: 300 },
    { name: '新穗高',   x: 330, y: 150 },
    { name: '高山東急', x: 120, y: 430 },
  ]},
  { dist: '約 100km・1h40m', w: 600, h: 560, stops: [
    { name: '高山東急', x: 400, y: 470, anchor: 'start', vAlign: 'below' },
    { name: '白川鄉',   x: 140, y: 100 },
    { name: '飛驒高山', x: 340, y: 370 },
    { x: 400, y: 470, pathOnly: true }, // 迴圈終點＝出發的高山東急，同一個點不重複畫針
  ]},
  { dist: '約 135km・2h30m', w: 600, h: 460, stops: [
    { name: '高山東急', x: 460, y: 70  },
    { name: '犬山市',   x: 280, y: 260 },
    { name: '大吉屋',   x: 220, y: 400 },
  ]},
  { dist: '約 45km・1h00m', w: 600, h: 460, stops: [
    { name: '大吉屋',       x: 280, y: 150, anchor: 'end', vAlign: 'below' },
    { name: '名古屋',       x: 430, y: 110 },
    { name: '中部國際機場', x: 200, y: 380 },
  ]},
]

// 日本時間，每 30 秒更新一次
function useNowJST() {
  const getJST = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const [now, setNow] = useState(getJST)
  useEffect(() => {
    const t = setInterval(() => setNow(getJST()), 30000)
    return () => clearInterval(t)
  }, [])
  return now
}

const TAGS = ['景點', '交通', '停車', '早餐', '午餐', '晚餐', '點心', '備案', '裝備出租', '教練', '票券', '住宿']

const getTagStyle = (tag) => {
  const map = {
    景點:     'text-[#7E9384] border-[#7E9384]/40 bg-[#7E9384]/5',
    交通:     'text-[#8C99A3] border-[#8C99A3]/40 bg-[#8C99A3]/5',
    停車:     'text-[#96896F] border-[#96896F]/40 bg-[#96896F]/5',
    早餐:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    午餐:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    晚餐:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    點心:     'text-[#B08A8B] border-[#B08A8B]/40 bg-[#B08A8B]/5',
    住宿:     'text-[#AD8B76] border-[#AD8B76]/40 bg-[#AD8B76]/5',
    票券:     'text-[#8A819C] border-[#8A819C]/40 bg-[#8A819C]/5',
    裝備出租: 'text-[#7A9999] border-[#7A9999]/40 bg-[#7A9999]/5',
    教練:     'text-[#7A9999] border-[#7A9999]/40 bg-[#7A9999]/5',
    備案:     'text-[#999] border-[#999]/40 bg-[#999]/5',
  }
  return map[tag] || 'text-gray-400 border-gray-200 bg-gray-50'
}

// 時間軸卡片背景塗鴉：依標籤各配一張手繪扁平風貼紙，位置與角度各自錯開營造手帳感
const STICKER_BASE = `${import.meta.env.BASE_URL}images/stickers/`
const TAG_DECOR = {
  景點:     { src: STICKER_BASE + 'mountain.png',    pos: 'top-[-6px] right-1 rotate-[-6deg]',  size: 100 },
  交通:     { src: STICKER_BASE + 'plane-cloud.png', pos: 'top-[-8px] right-2 rotate-[8deg]',   size: 110 },
  停車:     { src: STICKER_BASE + 'parking.png',     pos: 'top-0 right-4 rotate-[3deg]',        size: 84 },
  早餐:     { src: STICKER_BASE + 'croissant.png',   pos: 'top-[-4px] right-3 rotate-[-8deg]',  size: 92 },
  午餐:     { src: STICKER_BASE + 'onigiri.png',     pos: 'top-1 right-1 rotate-[6deg]',        size: 88 },
  晚餐:     { src: STICKER_BASE + 'sushi.png',       pos: 'top-[-4px] right-2 rotate-[-5deg]',  size: 96 },
  點心:     { src: STICKER_BASE + 'ice-cream.png',   pos: 'top-[-6px] right-5 rotate-[9deg]',   size: 86 },
  備案:     { src: STICKER_BASE + 'dice.png',        pos: 'top-1 right-3 rotate-[-4deg]',       size: 76 },
  裝備出租: { src: STICKER_BASE + 'backpack.png',    pos: 'top-0 right-1 rotate-[5deg]',        size: 92 },
  教練:     { src: STICKER_BASE + 'whistle.png',     pos: 'top-2 right-4 rotate-[-6deg]',       size: 80 },
  票券:     { src: STICKER_BASE + 'ticket.png',      pos: 'top-1 right-0 rotate-[8deg]',        size: 84 },
  住宿:     { src: STICKER_BASE + 'house.png',       pos: 'top-[-4px] right-2 rotate-[-3deg]',  size: 90 },
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
      <div className="mx-5 md:mx-0 mb-4 h-20 bg-[#F4F1EB] rounded-xl animate-pulse" />
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
        className="w-full flex justify-between items-center px-4 py-3 bg-[#F4F1EB] rounded-xl border border-[#DED9CF] active:opacity-80 transition-opacity"
      >
        {slots.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={`text-[0.58rem] tracking-wider ${i === 0 ? 'text-[#6F8172] font-bold' : 'text-[#A5998A]'}`}>
              {s.label}
            </span>
            <span className="text-xl leading-none">{s.emoji}</span>
            <span className={`text-sm font-bold leading-none ${i === 0 ? 'text-[#43473F]' : 'text-[#6B685C]'}`}>
              {s.temp}°
            </span>
          </div>
        ))}
        <span className="text-[#C5BAA8] text-xs ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expandable outfit guide */}
      {open && (
        <div className="mt-1.5 flex items-start gap-3 bg-[#F4F1EB] border border-[#DED9CF] rounded-xl px-4 py-3 animate-fade-in">
          <span className="text-2xl mt-0.5 shrink-0">{outfit.icon}</span>
          <div>
            <p className="text-[0.52rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold mb-1">Outfit Guide</p>
            <p className="text-[0.82rem] text-[#6B685C] leading-relaxed">{outfit.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// 路線地圖標籤寬度用實際文字量測（混合中日文/數字時比固定字元估算準確）
const measureCanvas = document.createElement('canvas')
const measureCtx = measureCanvas.getContext('2d')
function labelWidth(text) {
  measureCtx.font = '700 29px "Noto Sans TC","PingFang TC",sans-serif'
  return measureCtx.measureText(text).width
}

function smoothRoutePath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const cur = pts[i], next = pts[i + 1]
    const midX = (cur.x + next.x) / 2, midY = (cur.y + next.y) / 2
    d += i === 0 ? ` Q ${cur.x} ${cur.y}, ${midX} ${midY}` : ` T ${midX} ${midY}`
  }
  const last = pts[pts.length - 1]
  d += ` T ${last.x} ${last.y}`
  return d
}

// 等高線地形紋理：同心、帶雜訊擾動的封閉曲線模擬地圖等高線，呼應中部山岳地形
function drawRouteTerrain(canvas) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#F4F1EB'
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(111,129,114,0.09)'
  for (let y = 14; y < h; y += 26) {
    for (let x = 14; x < w; x += 26) {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
    }
  }

  const lineColor = 'rgba(111,129,114,0.20)'
  const contourCluster = (cx, cy, baseR, rings, seed) => {
    for (let i = 0; i < rings; i++) {
      const r = baseR + i * 20
      ctx.beginPath()
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.12) {
        const noise = Math.sin(a * 3 + seed + i * 1.3) * 9 + Math.sin(a * 5 + seed * 1.7) * 5
        const rad = r + noise
        const x = cx + Math.cos(a) * rad
        const y = cy + Math.sin(a) * rad * 0.72
        if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1.1
      ctx.stroke()
    }
  }
  const clusters = [[w * 0.22, h * 0.16, 55], [w * 0.80, h * 0.26, 60], [w * 0.72, h * 0.78, 50], [w * 0.20, h * 0.82, 48]]
  clusters.forEach(([x, y, r], i) => contourCluster(x, y, r, 3, i * 1.9))

  const peak = (x, y, s) => {
    ctx.beginPath()
    ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.8, y + s * 0.5); ctx.lineTo(x - s * 0.8, y + s * 0.5)
    ctx.closePath(); ctx.strokeStyle = lineColor; ctx.lineWidth = 1.2; ctx.stroke()
  }
  clusters.forEach(([x, y]) => peak(x, y - 4, 13))
}

const ROUTE_PIN_R = 26

function RouteMap({ route }) {
  const canvasRef = useRef(null)
  useEffect(() => { drawRouteTerrain(canvasRef.current) }, [route])

  return (
    <div className="relative rounded-[10px] overflow-hidden">
      <canvas ref={canvasRef} width={route.w} height={route.h} className="block w-full h-auto" />
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${route.w} ${route.h}`} preserveAspectRatio="none">
        <path
          d={smoothRoutePath(route.stops)}
          fill="none" stroke="#6F8172" strokeWidth="4.2" strokeDasharray="11 9"
          strokeLinecap="round" opacity="0.9"
        />
        {(() => {
          let pinNum = 0
          return route.stops.map((s, i) => {
            if (s.pathOnly) return null // 只用來畫路線形狀（例如迴圈終點＝出發點），不重複畫針
            pinNum += 1
            const nearRight = s.x > route.w * 0.62
            const nearTop = s.y < route.h * 0.16
            const anchor = s.anchor || (nearRight ? 'end' : 'start')
            const vAlign = s.vAlign || (nearTop ? 'below' : 'above')
            const dx = anchor === 'end' ? -(ROUTE_PIN_R + 8) : (ROUTE_PIN_R + 8)
            const dy = vAlign === 'below' ? (ROUTE_PIN_R + 22) : -(ROUTE_PIN_R + 8)
            const textX = s.x + dx, textY = s.y + dy
            const estW = labelWidth(s.name) + 26
            const rectX = anchor === 'end' ? textX - estW + 12 : textX - 12
            const rectY = vAlign === 'below' ? textY - 24 : textY - 38
            return (
              <g key={i}>
                <circle cx={s.x} cy={s.y} r={ROUTE_PIN_R} fill="#6F8172" stroke="#fff" strokeWidth="3.5" />
                <text x={s.x} y={s.y + 1} textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="700" fill="#fff">
                  {pinNum}
                </text>
                <rect x={rectX} y={rectY} width={estW} height="50" rx="14" fill="#fff" opacity="0.6" />
                <text x={textX} y={textY} textAnchor={anchor} fontSize="29" fontWeight="700" fill="#4A4A43">
                  {s.name}
                </text>
              </g>
            )
          })
        })()}
      </svg>
    </div>
  )
}

function RouteOverview({ route }) {
  const [open, setOpen] = useState(false)
  if (!route) return null

  return (
    <div className="mx-5 md:mx-0 mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center px-4 py-3 bg-[#F4F1EB] rounded-xl border border-[#DED9CF] active:opacity-80 transition-opacity"
      >
        <span className="text-sm font-bold text-[#43473F] tracking-wide">🧭 今日路線</span>
        <span className="flex items-center gap-2 text-[0.7rem] text-[#A5998A]">
          {route.dist}
          <span className="text-[#C5BAA8]">{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open && (
        <div className="mt-1.5 bg-[#F4F1EB] border border-[#DED9CF] rounded-xl p-3 animate-fade-in">
          <RouteMap route={route} />
        </div>
      )}
    </div>
  )
}

const EMPTY_FORM = {
  time: '12:00', title: '', tag: '景點', notes: '',
  mapUrl: '', address: '', phone: '', website: '', articles: '', reservationNo: '', details: '', image: '',
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
    phone: item.phone || '', website: item.website || '', articles: item.articles || '',
    reservationNo: item.reservationNo || '', details: item.details || '', image: item.image || '',
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

  const articleLinks = viewItem ? parseArticles(viewItem.articles) : []
  const hasNav = viewItem && !editMode && viewItem.id && (viewItem.mapUrl || viewItem.website || articleLinks.length > 0)

  // 浮動卡跟著日本時間走：檢視的分頁是「今天」時，顯示當前／下一筆行程
  const nowJST = useNowJST()
  const hhmm = `${String(nowJST.getHours()).padStart(2, '0')}:${String(nowJST.getMinutes()).padStart(2, '0')}`
  const isToday =
    nowJST.getFullYear() === 2026 && nowJST.getMonth() === 9 && nowJST.getDate() === activeDay + 1
  let curIdx = 0
  if (isToday && items.length > 0) {
    const passed = items.filter(it => (it.time || '00:00') <= hhmm).length
    curIdx = Math.max(0, passed - 1)
  }
  const curItem = items[curIdx]
  const nextItem = items[curIdx + 1]

  // 「今晚住宿」：行程期間以日本日期為準（清晨 6 點前算前一晚），期間外看目前檢視的天
  let hotelIdx = activeDay
  if (nowJST.getFullYear() === 2026 && nowJST.getMonth() === 9) {
    const d = nowJST.getDate() - (nowJST.getHours() < 6 ? 1 : 0)
    if (d >= 1 && d <= 6) hotelIdx = d - 1
  }
  const hotel = HOTELS[hotelIdx]

  return (
    <div>
      {/* Day selector */}
      <div className="sticky top-[94px] md:top-[72px] z-20 bg-cream border-b border-[#D6D0C4]">
        <div className="flex gap-1.5 md:gap-2 md:max-w-lg md:mx-auto px-5 py-3">
          {DAY_DATA.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`flex-1 flex flex-col items-center rounded-xl py-1.5 transition-all active:scale-95 ${
                activeDay === i
                  ? 'bg-sage text-oat shadow-[0_4px_10px_-4px_rgba(111,129,114,0.55)]'
                  : 'text-[#A8A296]'
              }`}
            >
              <span className="text-[0.6rem] tracking-wider leading-tight">{d.date.replace('/0', '/')}</span>
              <span className={`text-sm leading-tight ${activeDay === i ? 'font-bold' : 'font-medium'}`}>
                {WEEK_CN[d.week]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: two-column layout (hero + weather | timeline) */}
      <div className="md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10 md:px-8 md:pt-6 md:items-start">
      <div className="md:sticky md:top-[150px]">
      {/* Hero image */}
      <div className="px-5 md:px-0 py-4 md:pt-0 flex gap-4 items-stretch h-52 md:h-80">
        <div className="flex items-center justify-center w-6 shrink-0">
          <span
            className="font-serif text-[1.1rem] font-bold tracking-widest text-[#43473F]"
            style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}
          >
            第{CN_NUMS[activeDay]}天
          </span>
        </div>
        <div className="relative flex-1 rounded-xl overflow-hidden shadow-sm bg-[#DED9CF]">
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

      {/* Route overview */}
      <RouteOverview route={ROUTES[activeDay]} key={activeDay} />
      </div>

      {/* Timeline */}
      <div className="px-5 md:px-0 pb-44 md:pb-32">
        {/* Section header */}
        <div className="flex items-baseline gap-2.5 pt-4">
          <span className="font-serif text-[0.95rem] font-bold tracking-widest text-[#43473F]">本日行程</span>
          <span className="text-[0.55rem] tracking-[0.25em] text-latte font-bold">{day.en}</span>
          <div className="flex-1 border-t border-[#D8CEB9] self-center" />
        </div>
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
                  <span className="text-[1.05rem] font-bold tracking-wider text-[#4A4A43]">
                    {item.time || '--:--'}
                  </span>
                </div>
                <div className="relative w-4 flex justify-center shrink-0">
                  {i < items.length - 1 && (
                    <div className="absolute top-3 bottom-[-40px] w-0 border-l-2 border-dotted border-[#AEBBAF]" />
                  )}
                  <div className="w-[7px] h-[7px] rounded-full bg-sage mt-[9px] z-10 border-2 border-[#E9E5DE] shadow-[0_0_0_1.5px_#CBD2C9] group-hover:scale-125 transition-transform" />
                </div>
                <div className="flex-1 pl-4 pb-2 relative overflow-hidden">
                  {item.tag && TAG_DECOR[item.tag] && (
                    <img
                      src={TAG_DECOR[item.tag].src}
                      alt=""
                      className={`absolute ${TAG_DECOR[item.tag].pos} pointer-events-none select-none opacity-20 z-0`}
                      style={{ width: TAG_DECOR[item.tag].size }}
                    />
                  )}
                  <div className="relative">
                    <h4 className="font-serif text-[1.15rem] font-bold text-[#43473F] leading-tight mb-2 tracking-wide">
                      {item.title}
                    </h4>
                    {item.tag && (
                      <span className={`text-[0.58rem] tracking-[0.18em] px-1.5 py-[1px] rounded-[3px] border ${getTagStyle(item.tag)}`}>
                        {item.tag.toUpperCase()}
                      </span>
                    )}
                    {item.notes && (
                      <p className="text-[0.82rem] text-[#6B685C] mt-2 whitespace-pre-line">{item.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={openNew}
          className="w-full py-3 border border-dashed border-[#C4BCAC] text-[#A5998A] rounded-xl text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-[#F4F1EB] transition-colors mt-2"
        >
          + 新增行程
        </button>
      </div>
      </div>

      {/* Floating bottom card */}
      {!loading && items.length > 0 && (
        <div className="fixed bottom-[84px] md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl px-4 z-20 pointer-events-none">
          <div className="bg-oat/95 backdrop-blur-md border border-[#D6D0C4] rounded-xl shadow-[0_10px_26px_-10px_rgba(60,50,30,0.4)] p-3 flex items-stretch pointer-events-auto">
            {/* 回宿：一鍵導航到今晚住宿 */}
            {hotel ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.query)}`}
                target="_blank"
                rel="noreferrer"
                title={`導航到 ${hotel.name}`}
                className="flex flex-col items-center justify-center px-3 border-r border-[#DED9CF] shrink-0 active:opacity-70 transition-opacity"
              >
                <BedDouble size={19} strokeWidth={1.8} className="text-sage mb-1" />
                <span className="text-[0.5rem] text-sage font-bold tracking-widest leading-none mt-0.5">回宿</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center px-3 border-r border-[#DED9CF] shrink-0">
                <BedDouble size={19} strokeWidth={1.8} className="text-[#C4BCAC] mb-1" />
                <span className="text-[0.5rem] text-[#C4BCAC] font-bold tracking-widest leading-none mt-0.5">回程</span>
              </div>
            )}
            {/* Current event（今天時跟著日本時間走） */}
            <div
              className="flex-1 px-4 flex flex-col justify-center min-w-0 cursor-pointer active:opacity-70 transition-opacity"
              onClick={() => openView(curItem)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif text-xl font-bold text-[#43473F] leading-none">{curItem.time || '--:--'}</span>
                <span className="text-[0.5rem] border border-[#C4BCAC] text-latte px-1.5 py-0.5 rounded tracking-widest shrink-0">
                  {isToday ? `現在 JST ${hhmm}` : '行程預覽'}
                </span>
              </div>
              <p className="font-serif font-bold text-[#43473F] text-[0.88rem] truncate mb-0.5">{curItem.title}</p>
              {nextItem && (
                <p className="text-[0.62rem] text-gray-500 truncate flex items-center gap-1">
                  <span className="text-gray-400">→</span> {nextItem.title}
                </p>
              )}
            </div>
            {/* Next time */}
            {nextItem && (
              <div
                className="flex flex-col items-center justify-center px-3 border-l border-[#DED9CF] shrink-0 min-w-[64px] cursor-pointer active:opacity-70 transition-opacity"
                onClick={() => openView(nextItem)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B685C" strokeWidth="2" className="mb-1">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-serif font-bold text-[#43473F] text-base leading-none">{nextItem.time || '--:--'}</span>
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
            className="bg-oat w-full max-w-md md:max-w-lg rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl relative"
            style={{ maxHeight: '88vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100/80 bg-white/50 shrink-0">
              {editMode ? (
                <h3 className="font-serif font-bold text-lg tracking-widest text-[#43473F]">
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
                    <button onClick={startEdit} className="text-xl text-gray-400 hover:text-[#4A4A43] transition-colors" title="編輯">✏️</button>
                    <button onClick={handleDelete} className="text-xl text-gray-400 hover:text-[#B08A8B] transition-colors" title="刪除">🗑️</button>
                  </>
                )}
                <button onClick={closeModal} className="text-2xl font-light text-gray-400 hover:text-[#4A4A43] transition-colors leading-none">×</button>
              </div>
            </div>

            {/* View mode */}
            {!editMode && viewItem.id && (
              <div
                className="flex-1 overflow-y-auto hide-scrollbar px-6 py-8"
                style={{
                  paddingBottom: hasNav
                    ? `${((viewItem.mapUrl ? 1 : 0) + (viewItem.website ? 1 : 0) + articleLinks.length) * 3.6 + 3}rem`
                    : '2.5rem',
                }}
              >
                {viewItem.image && (
                  <img
                    src={viewItem.image}
                    alt={viewItem.title}
                    className="-mx-6 -mt-8 mb-6 w-[calc(100%+3rem)] h-44 md:h-52 object-cover"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}
                <h2 className="font-serif text-[1.6rem] font-bold text-[#43473F] mb-3 leading-snug">
                  {viewItem.title}
                </h2>

                {viewItem.address && (
                  <p className="text-[0.8rem] text-gray-500 mb-6 flex items-start gap-1.5">
                    <span className="text-xs opacity-60 mt-0.5">📍</span>
                    {viewItem.address}
                  </p>
                )}

                {viewItem.reservationNo && (
                  <div className="mb-8 bg-[#F4F1EB] border border-[#DED9CF] p-5 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C4BCAC]" />
                    <p className="text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase font-bold mb-2">Reservation</p>
                    <p className="font-serif font-bold text-lg text-[#43473F]">{viewItem.title}</p>
                    <div className="border-t border-dashed border-[#DED9CF] pt-4 mt-4 relative pb-2">
                      <p className="text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">Confirmation No.</p>
                      <p className="font-mono text-xl font-bold text-[#4A4A43] tracking-widest">{viewItem.reservationNo}</p>
                      <div className="stamp-tag">訂單代號</div>
                    </div>
                  </div>
                )}

                {viewItem.tag === '住宿' && (
                  <div className="mb-8 bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                    <p className="text-[0.58rem] text-[#AD8B76] tracking-[0.2em] uppercase font-bold mb-3">住宿憑證（Vouchers）</p>
                    <p className="text-[0.78rem] text-gray-400 text-center py-3 italic">尚未上傳憑證</p>
                    <button
                      onClick={() => alert('PDF 上傳功能即將推出，請先將訂房確認信儲存於手機相簿 🙏')}
                      className="w-full mt-1 py-2.5 border border-dashed border-[#C4BCAC] text-[#A5998A] rounded-xl text-[0.75rem] tracking-widest hover:bg-[#F4F1EB] transition-colors"
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
                  <div className="mb-6 bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center gap-4">
                    <span className="text-[#A5998A] text-xl">📞</span>
                    <div>
                      <p className="text-[0.55rem] text-[#A5998A] tracking-[0.2em] uppercase mb-0.5 font-bold">Phone / GPS</p>
                      <p className="font-mono font-bold text-lg text-[#43473F] tracking-wider">{viewItem.phone}</p>
                    </div>
                  </div>
                )}

                {viewItem.notes && (
                  <p className="text-[0.9rem] text-[#6B685C] leading-relaxed mb-6 whitespace-pre-line">{viewItem.notes}</p>
                )}

                {viewItem.details && (
                  <div className="relative pl-5 space-y-4">
                    <div className="absolute left-0 top-1 bottom-1 w-[1px] bg-gray-200" />
                    {viewItem.details.split('\n').filter(l => l.trim()).map((line, idx) => (
                      <div key={idx} className="relative text-[0.85rem] text-gray-600 leading-relaxed">
                        <div className="absolute left-[-21px] top-2 w-2 h-2 rounded-full bg-[#C4BCAC]" />
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
                    <label className="block text-[0.58rem] text-[#6F8172] tracking-[0.2em] uppercase mb-1 font-bold">時間</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] font-mono bg-transparent text-lg transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[0.58rem] text-[#6F8172] tracking-[0.2em] uppercase mb-1 font-bold">標籤</label>
                    <select
                      value={form.tag}
                      onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] bg-transparent text-base transition-colors"
                    >
                      {TAGS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#6F8172] tracking-[0.2em] uppercase mb-1 font-bold">標題 *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="例：午餐：飛驒牛炸牛排"
                    autoFocus
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] font-serif bg-transparent text-base transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#6F8172] tracking-[0.2em] uppercase mb-1 font-bold">列表簡介（可換行）</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="顯示在時間軸上的說明"
                    className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-[#6F8172] bg-transparent text-sm resize-none transition-colors"
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

                <div>
                  <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">圖片網址（選填）</label>
                  <input
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="貼景點照片網址，顯示在彈窗上方"
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] bg-transparent text-sm transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">電話</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0577-..."
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] font-mono bg-transparent text-sm transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">預約代號</label>
                    <input
                      value={form.reservationNo}
                      onChange={e => setForm(f => ({ ...f, reservationNo: e.target.value }))}
                      placeholder="無可留空"
                      className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] font-mono bg-transparent text-sm transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.58rem] text-[#A5998A] tracking-[0.2em] uppercase mb-1 font-bold">官方網站</label>
                  <input
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border-b border-gray-300 p-2 outline-none focus:border-[#6F8172] bg-transparent text-sm transition-colors"
                  />
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
                    placeholder="輸入詳細介紹或筆記..."
                    className="w-full border border-gray-300 p-3 rounded-md outline-none focus:border-[#6F8172] bg-transparent text-sm resize-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* View mode: map/website buttons */}
            {hasNav && (
              <div
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-oat via-oat/90 to-transparent flex flex-col gap-2.5"
                style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
              >
                {viewItem.mapUrl && (
                  <a
                    href={viewItem.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-[#6F8172] text-white py-3.5 rounded text-center text-sm tracking-widest font-bold shadow-md active:opacity-80 transition-opacity"
                  >
                    🧭 Google Maps 導航
                  </a>
                )}
                {viewItem.website && (
                  <a
                    href={viewItem.website}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-[#AD8B76] text-white py-3.5 rounded text-center text-sm tracking-widest font-bold shadow-md active:opacity-80 transition-opacity"
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
                    className="block w-full bg-white border border-[#AD8B76] text-[#8A6A4C] py-3 rounded text-center text-sm font-bold shadow-sm active:opacity-80 transition-opacity truncate px-4"
                  >
                    📖 {a.title}
                  </a>
                ))}
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
                  className="flex-1 py-3.5 bg-[#F4F1EB] text-gray-500 rounded-xl text-xs tracking-widest font-bold uppercase hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="flex-1 py-3.5 bg-[#6F8172] text-white rounded-xl text-xs tracking-widest font-bold uppercase disabled:opacity-40 shadow-md active:scale-[0.98] transition-transform"
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
