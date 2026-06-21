import { useState, useEffect } from 'react'
import { ref, onValue, push, remove } from 'firebase/database'
import { db } from '../../firebase'
import { Plus, X, Trash2 } from 'lucide-react'

const CATEGORIES = ['交通', '住宿', '餐食', '購物', '票券']
const MEMBERS = ['思菡', '俊毅', '金燕', '國峯', '心慈', '思穎', '渝翔', '公共']
const DATES = Array.from({ length: 6 }, (_, i) => `10/${String(i + 1).padStart(2, '0')}`)

const CAT_STYLE = {
  交通: { dot: 'bg-sky-400', pill: 'bg-sky-100 text-sky-700' },
  住宿: { dot: 'bg-indigo-400', pill: 'bg-indigo-100 text-indigo-700' },
  餐食: { dot: 'bg-orange-400', pill: 'bg-orange-100 text-orange-700' },
  購物: { dot: 'bg-pink-400', pill: 'bg-pink-100 text-pink-700' },
  票券: { dot: 'bg-purple-400', pill: 'bg-purple-100 text-purple-700' },
}

const EMPTY_FORM = { date: '10/01', category: '交通', title: '', amount: '', paidBy: '公共' }

function useBudget() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const r = ref(db, 'budget')
      const unsub = onValue(r, (snap) => {
        const data = snap.val()
        if (data) {
          const list = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
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

  const addItem = (item) => push(ref(db, 'budget'), item)
  const deleteItem = (id) => remove(ref(db, `budget/${id}`))

  return { items, loading, addItem, deleteItem }
}

export default function Budget() {
  const { items, loading, addItem, deleteItem } = useBudget()
  const [filter, setFilter] = useState('全部')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const catTotals = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat).reduce((s, i) => s + (Number(i.amount) || 0), 0)
    return acc
  }, {})
  const filtered = filter === '全部' ? items : items.filter(i => i.category === filter)

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount) return
    await addItem({ ...form, amount: Number(form.amount) })
    setModal(false)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="pb-6">
      {/* Summary Card */}
      <div className="mx-4 mt-4 rounded-3xl bg-nagoya-red text-white px-5 py-5 shadow-lg">
        <p className="text-xs opacity-70 font-medium tracking-wide uppercase">總支出</p>
        <p className="text-4xl font-bold mt-1">¥{total.toLocaleString()}</p>
        <p className="text-xs opacity-60 mt-1">7人均攤 約 ¥{Math.round(total / 7).toLocaleString()} / 人</p>

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {CATEGORIES.map(cat => (
            <div key={cat} className="text-center">
              <p className="text-[10px] opacity-60">{cat}</p>
              <p className="text-xs font-semibold mt-0.5">¥{(catTotals[cat] || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {['全部', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors ${
              filter === cat ? 'bg-autumn text-white' : 'bg-white text-stone-500 border border-stone-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expense List */}
      <div className="px-4 space-y-2">
        {loading ? (
          <p className="text-center text-stone-300 text-sm py-10">載入中⋯</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-stone-300 py-14">
            <div className="text-4xl mb-3">💴</div>
            <p className="text-sm">還沒有支出記錄</p>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-stone-100 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CAT_STYLE[item.category]?.dot || 'bg-stone-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{item.title}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{item.date} · {item.paidBy}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_STYLE[item.category]?.pill || 'bg-stone-100 text-stone-500'}`}>
                {item.category}
              </span>
              <p className="text-sm font-semibold text-stone-800 flex-shrink-0">¥{Number(item.amount).toLocaleString()}</p>
              <button onClick={() => deleteItem(item.id)} className="flex-shrink-0 text-stone-200 hover:text-red-400 active:scale-90 transition-transform">
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setModal(true)}
        className="fixed right-4 bottom-20 bg-autumn text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ width: 52, height: 52 }}
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-t-3xl px-5 pt-5 pb-8">
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-800">新增支出</h3>
              <button onClick={() => setModal(false)} className="text-stone-300 hover:text-stone-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">日期</label>
                  <select
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-autumn"
                  >
                    {DATES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">分類</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-autumn"
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-400 mb-1 block">項目名稱 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="如：新幹線名古屋→岐阜"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-autumn"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">金額（JPY）*</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="3500"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-autumn"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-1 block">付款人</label>
                  <select
                    value={form.paidBy}
                    onChange={(e) => setForm(f => ({ ...f, paidBy: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-autumn"
                  >
                    {MEMBERS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.amount}
              className="w-full mt-5 bg-autumn text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
            >
              儲存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
