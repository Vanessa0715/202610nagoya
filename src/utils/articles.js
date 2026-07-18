// 參考文章欄位：一行一篇，格式「標題 | 網址」；只貼網址時以網域當標題
export function parseArticles(str) {
  if (!str) return []
  return str
    .split('\n')
    .map(line => {
      const sep = line.indexOf('|')
      let title = ''
      let url = line.trim()
      if (sep >= 0) {
        title = line.slice(0, sep).trim()
        url = line.slice(sep + 1).trim()
      }
      if (!/^https?:\/\//.test(url)) return null
      if (!title) {
        try {
          title = new URL(url).hostname.replace(/^www\./, '')
        } catch {
          title = '參考文章'
        }
      }
      return { title, url }
    })
    .filter(Boolean)
}
