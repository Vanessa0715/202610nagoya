// 每天的日期／地區標籤（固定不變，跟哪家飯店無關）
// 飯店名稱等會變動的住宿資訊一律從 Firebase itinerary/day{n} 的「住宿」標籤項目即時讀取，
// 不要在這裡或任何元件裡另外硬編一份，避免兩邊資料兜不起來。
export const DAY_INFO = [
  { date: '10/01', city: '名古屋' },
  { date: '10/02', city: '松本' },
  { date: '10/03', city: '高山' },
  { date: '10/04', city: '高山' },
  { date: '10/05', city: '名古屋' },
  { date: '10/06', city: '名古屋' },
]
