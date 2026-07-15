import { useState, useEffect } from 'react'
import { ref, onValue, push, set, remove } from 'firebase/database'
import { db } from '../../firebase'
import { Plus, X, Check } from 'lucide-react'

const DEFAULT_CATEGORIES = ['衣物', '盥洗', '電子', '證件', '藥品', '其他']

const EMPTY_FORM = { category: '衣物', name: '' }

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

  const addItem = (item) => push(ref(db, 'packing'), item)
  const toggleItem = (id, checked) => set(ref(db, `packing/${id}/checked`), checked)
  const deleteItem = (id) => remove(ref(db, `packing/${id}`))

  return { items, loading, addItem, toggleItem, deleteItem }
}

export default function Packing() {
  const { items, loading, addItem, toggleItem, deleteItem } = usePacking()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const checkedCount = items.filter(i => i.checked).length
  const total = items.length
  const progress = total > 0 ? (checkedCount / total) * 100 : 0
  const allDone = total > 0 && checkedCount === total

  const grouped = DEFAULT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat)
    return acc
  }, {})
  const extraCats = [...new Set(items.map(i => i.category))].filter(c => !DEFAULT_CATEGORIES.includes(c))
  extraCats.forEach(cat => { grouped[cat] = items.filter(i => i.category === cat) })
  const allCats = [...DEFAULT_CATEGORIES, ...extraCats]

  const handleSave = async () => {
    if (!form.name.trim()) return
    await addItem({ ...form, checked: false })
    setModal(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="pb-6">
      {/* Progress Card */}
      <div className="mx-4 md:mx-8 mt-4 md:mt-6 bg-white rounded-3xl px-5 py-4 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold text-stone-700">打包進度</span>
          <span className={`text-sm font-bold ${allDone ? 'text-matcha' : 'text-stone-500'}`}>
            {checkedCount} / {total}
          </span>
        </div>
        <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-matcha' : 'bg-autumn'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {allDone && total > 0 && (
          <p className="text-center text-xs text-matcha mt-2.5 font-semibold">✓ 全部打包完成，出發囉！</p>
        )}
        {total === 0 && !loading && (
          <p className="text-center text-xs text-stone-300 mt-2">新增物品後即可開始追蹤</p>
        )}
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
            <p className="text-sm">還沒有打包清單</p>
            <p className="text-xs mt-1">點右下角 ＋ 開始新增</p>
          </div>
        ) : (
          allCats.map(cat =>
            grouped[cat]?.length > 0 ? (
              <div key={cat} className="md:mb-6 md:break-inside-avoid">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{cat}</span>
                  <span className="text-[10px] text-stone-300">
                    {grouped[cat].filter(i => i.checked).length}/{grouped[cat].length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {grouped[cat].map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 shadow-sm border border-stone-100"
                    >
                      <button
                        onClick={() => toggleItem(item.id, !item.checked)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                          item.checked ? 'bg-matcha border-matcha' : 'border-stone-300'
                        }`}
                      >
                        {item.checked && <Check size={11} className="text-white" strokeWidth={3} />}
                      </button>
                      <span className={`flex-1 text-sm transition-colors ${
                        item.checked ? 'line-through text-stone-300' : 'text-stone-700'
                      }`}>
                        {item.name}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="flex-shrink-0 text-stone-200 hover:text-red-400 active:scale-90 transition-transform"
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

      {/* FAB */}
      <button
        onClick={() => setModal(true)}
        className="fixed right-4 bottom-20 md:bottom-10 md:right-[calc(50%-24rem+2rem)] lg:right-[calc(50%-32rem+2rem)] bg-matcha text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ width: 52, height: 52 }}
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-t-3xl md:rounded-3xl md:w-full md:max-w-md px-5 pt-5 pb-8">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800">新增物品</h3>
              <button onClick={() => setModal(false)} className="text-stone-300 hover:text-stone-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-stone-400 mb-1 block">分類</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-matcha"
                >
                  {DEFAULT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1 block">物品名稱 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="如：換洗衣物×5套"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-matcha"
                  autoFocus
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="w-full mt-5 bg-matcha text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
            >
              新增
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
