import { useState, useEffect } from 'react'
import { ref, onValue, push, remove } from 'firebase/database'
import { db } from '../../firebase'
import { Plus, X, MapPin, ExternalLink } from 'lucide-react'

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

const EMPTY_FORM = { name: '', address: '', tags: [], notes: '', mapUrl: '' }

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

  const addSpot = (spot) => push(ref(db, 'spots'), spot)
  const removeSpot = (id) => remove(ref(db, `spots/${id}`))

  return { spots, loading, addSpot, removeSpot }
}

export default function Spots() {
  const { spots, loading, addSpot, removeSpot } = useSpots()
  const [filterTag, setFilterTag] = useState('全部')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = filterTag === '全部' ? spots : spots.filter(s => (s.tags || []).includes(filterTag))

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    await addSpot(form)
    setModal(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="pb-6">
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

      {/* Spots Grid */}
      <div className="px-4 md:px-8">
        {loading ? (
          <p className="text-center text-stone-300 text-sm py-10">載入中⋯</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-stone-300 py-14">
            <div className="text-4xl mb-3">🗾</div>
            <p className="text-sm">{filterTag === '全部' ? '還沒有收藏景點' : `沒有「${filterTag}」類景點`}</p>
            <p className="text-xs mt-1">點右下角 ＋ 開始收藏</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map(spot => (
              <div key={spot.id} className="bg-oat rounded-2xl p-3.5 shadow-sm border border-[#E2DCD1] relative flex flex-col">
                <button
                  onClick={() => removeSpot(spot.id)}
                  className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center text-stone-200 hover:text-[#B08A8B] active:scale-90 transition-transform"
                >
                  <X size={14} />
                </button>

                <p className="font-semibold text-stone-800 text-sm pr-5 leading-snug">{spot.name}</p>

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
                  <a
                    href={spot.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sage mt-2.5 font-medium"
                  >
                    <MapPin size={10} />地圖
                    <ExternalLink size={9} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setModal(true)}
        className="fixed right-4 bottom-20 md:bottom-10 md:right-[calc(50%-24rem+2rem)] lg:right-[calc(50%-32rem+2rem)] bg-sage text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ width: 52, height: 52 }}
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-oat rounded-t-3xl md:rounded-3xl md:w-full md:max-w-md px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800">新增景點</h3>
              <button onClick={() => setModal(false)} className="text-stone-300 hover:text-stone-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-stone-400 mb-1 block">景點名稱 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="如：名古屋城"
                  className="w-full border border-[#DED9CF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1 block">地址／城市</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="名古屋市中区本丸1-1"
                  className="w-full border border-[#DED9CF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-2 block">標籤</label>
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
                <label className="text-xs text-stone-400 mb-1 block">備註</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="開放時間、票價、注意事項⋯"
                  rows={2}
                  className="w-full border border-[#DED9CF] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-sage"
                />
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1 block">Google Maps 連結</label>
                <input
                  type="url"
                  value={form.mapUrl}
                  onChange={(e) => setForm(f => ({ ...f, mapUrl: e.target.value }))}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full border border-[#DED9CF] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-sage"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="w-full mt-5 bg-sage text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
            >
              儲存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
