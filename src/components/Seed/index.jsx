import { useState } from 'react'
import { ref, set, get } from 'firebase/database'
import { db } from '../../firebase'

const TRIP_DATA = {
  day1: {
    e1: { time: '14:55', title: '出發 (JX838)', tag: '交通',
      notes: '搭乘星宇航空 JX838 班機，從台北桃園 (TPE) 直飛中部國際機場 (NGO)。',
      address: '桃園第一航廈', reservationNo: 'JX-838-TPE', phone: '02-2791-1199',
      website: 'https://www.starlux-airlines.com/', mapUrl: '',
      details: '【啟程資訊】搭乘星宇航空 JX838 班機。\n【報到提醒】請於起飛前 2.5 小時抵達機場。' },
    e2: { time: '19:59', title: '領取租車', tag: '交通',
      notes: '抵達機場後前往租車櫃檯，請備妥駕照與日文譯本。',
      address: '愛知県常滑市セントレア1-1', reservationNo: 'TR-7729-4281', phone: '056-232-0100',
      website: '', mapUrl: '',
      details: '【接駁位置】領完行李後往左手邊走，尋找 Rent a Car 綜合櫃檯。' },
    e3: { time: '23:00', title: '入住 ixyz杜', tag: '住宿',
      notes: '名古屋市區特色民宿，好好休息。',
      address: '名古屋市內', reservationNo: '', phone: '',
      website: '', mapUrl: 'https://maps.app.goo.gl/fh9j5LXZ4BdukY2i6',
      details: '【民宿特色】隱身於市區的日式摩登民宿。\n【入住須知】採用自助 Check-in。' },
  },
  day2: {
    e1: { time: '10:00', title: '漫步馬籠宿', tag: '景點',
      notes: '充滿江戶風情的古老驛站，保留了完整的石板路與木造建築。',
      address: '岐阜県中津川市馬籠', reservationNo: '', phone: '0573-69-2336',
      website: '', mapUrl: '',
      details: '【景點特色】中山道第43號宿場。\n【必嚐美食】別忘了買一支熱騰騰的「五平餅」，刷上甜鹹核桃味噌醬汁。' },
    e2: { time: '23:00', title: '入住 Tabino Hotel lit', tag: '住宿',
      notes: '含白樺溫泉，若無車位可停隔壁 Alpico Kotsu。',
      address: '長野県松本市深志1-4-5', reservationNo: '', phone: '0263-39-5050',
      website: 'https://matsumoto.tabino-hotel.jp/', mapUrl: '',
      details: '【設施】一樓設有白樺溫泉，泡個湯最舒服了。' },
  },
  day3: {
    e1: { time: '06:30', title: '澤渡大橋停車場', tag: '交通',
      notes: '轉乘巴士前往上高地，來回票 2,800 日元。',
      address: '', reservationNo: '', phone: '',
      website: '', mapUrl: 'https://maps.app.goo.gl/SsyoESuzaBY5Vv959',
      details: '【停車須知】自駕車輛禁止進入上高地，必須在此停車轉乘。' },
    e2: { time: '07:30', title: '上高地健行', tag: '景點',
      notes: '絕美大正池至河童橋，山區氣溫低，請採用洋蔥式穿法。',
      address: '', reservationNo: '', phone: '',
      website: '', mapUrl: '',
      details: '【推薦美食】河童橋旁的 TROIS CINQ，信州蘋果派外酥內軟。' },
    e3: { time: '14:00', title: '新穗高纜車', tag: '景點',
      notes: '雙層纜車欣賞北阿爾卑斯山壯麗絕景。',
      address: '', reservationNo: '', phone: '',
      website: '', mapUrl: 'https://maps.app.goo.gl/cmh9HVzbUzJmSbSg7',
      details: '【設施特色】日本唯一的雙層纜車！直達海拔 2156 公尺。' },
    e4: { time: '22:00', title: '高山 東急ステイ', tag: '住宿',
      notes: '飛驒高山 結の湯，今日起連住兩晚。',
      address: '岐阜県高山市花里町4-1', reservationNo: '', phone: '0577-33-0109',
      website: '', mapUrl: '',
      details: '【飯店特色】客房內備有洗衣烘乾機。' },
  },
  day4: {
    e1: { time: '09:00', title: '漫步白川鄉', tag: '景點',
      notes: '尋找經典的三間小屋與展望台。',
      address: '', reservationNo: '', phone: '',
      website: '', mapUrl: '',
      details: '【拍照熱點】搭乘接駁車前往「城山展望台」俯瞰全貌。' },
    e2: { time: '16:00', title: '晚餐：味藏天國', tag: '晚餐',
      notes: '高山最強燒肉！建議提早現場抽號碼牌。',
      address: '岐阜県高山市花里町4-308', reservationNo: '', phone: '',
      website: '', mapUrl: '',
      details: '【點餐攻略】推薦點「飛驒牛拼盤」，A5等級油脂豐富。' },
  },
  day5: {
    e1: { time: '13:00', title: '兼六園', tag: '景點',
      notes: '欣賞日式庭園極致之美。',
      address: '', reservationNo: '', phone: '',
      website: '', mapUrl: '',
      details: '【名園之首】與水戶偕樂園、岡山後樂園並稱日本三大名園。' },
    e2: { time: '22:00', title: '御宿野乃 金澤', tag: '住宿',
      notes: '榻榻米飯店，享受市區溫泉。',
      address: '', reservationNo: '', phone: '',
      website: '', mapUrl: '',
      details: '【免費宵夜】晚上 21:30 提供免費醬油拉麵。' },
  },
  day6: {
    e1: { time: '10:30', title: '機場還車', tag: '交通',
      notes: '記得加滿油再還車喔！',
      address: '', reservationNo: '', phone: '',
      website: '', mapUrl: '',
      details: '【還車須知】請務必在機場附近加油站「加滿油 (満タン)」再還車。' },
    e2: { time: '19:55', title: 'NGO → 桃園 (JX839)', tag: '交通',
      notes: '星宇航空返家，預計 23:00 抵達台北桃園機場。',
      address: '中部國際機場', reservationNo: '', phone: '',
      website: 'https://www.starlux-airlines.com/', mapUrl: '',
      details: '【必買伴手禮】機場內「えびせんべいの里」蝦餅便宜大包。' },
  },
}

export default function Seed() {
  const [status, setStatus] = useState('idle')
  const [log, setLog]       = useState([])
  const [checked, setChecked] = useState(false)
  const [hasData, setHasData] = useState(false)

  const checkData = async () => {
    const snap = await get(ref(db, 'itinerary/day1'))
    setHasData(snap.exists() && snap.val() !== null)
    setChecked(true)
  }

  const seed = async () => {
    setStatus('running')
    setLog([])
    try {
      for (const [day, events] of Object.entries(TRIP_DATA)) {
        await set(ref(db, `itinerary/${day}`), events)
        setLog(l => [...l, `✓ ${day} 寫入完成（${Object.keys(events).length} 筆）`])
      }
      setStatus('done')
    } catch (e) {
      setLog(l => [...l, `✗ 失敗：${e.message}`])
      setStatus('error')
    }
  }

  return (
    <div className="px-6 py-10 pb-32 font-sans">
      <h2 className="font-serif text-xl font-bold text-[#222] mb-1 tracking-widest">初始化行程資料</h2>
      <p className="text-[0.78rem] text-gray-400 mb-8">一鍵將 6 天行程寫入 Firebase，完成後請切換到「行程」頁查看。</p>

      {!checked && (
        <button onClick={checkData}
          className="w-full py-3.5 bg-[#F8F7F4] text-[#666] border border-gray-200 rounded-sm text-sm tracking-widest mb-4 hover:bg-gray-100 transition-colors">
          先確認目前 Firebase 狀態
        </button>
      )}

      {checked && (
        <div className={`mb-6 px-4 py-3 rounded-sm text-sm ${hasData ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {hasData ? '⚠️  Firebase 已有資料，繼續執行會覆蓋現有行程。' : '✓ Firebase 目前是空的，可以安全初始化。'}
        </div>
      )}

      {status === 'idle' && checked && (
        <button onClick={seed}
          className="w-full py-3.5 bg-[#879782] text-white rounded-sm text-sm tracking-widest font-bold shadow-md hover:bg-[#6f7d6a] transition-colors">
          {hasData ? '⚠️  強制覆蓋並初始化' : '🚀  開始初始化 6 天行程'}
        </button>
      )}

      {status === 'running' && (
        <div className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-sm text-sm tracking-widest text-center">寫入中...</div>
      )}

      {log.length > 0 && (
        <div className="mt-6 space-y-2">
          {log.map((l, i) => <p key={i} className="text-[0.82rem] text-gray-600 font-mono">{l}</p>)}
        </div>
      )}

      {status === 'done' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-sm px-4 py-4 text-center">
          <p className="text-green-700 font-bold text-sm mb-1">🎉 初始化完成！</p>
          <p className="text-green-600 text-[0.78rem]">請切換到「行程」頁查看 6 天行程。</p>
        </div>
      )}
    </div>
  )
}
