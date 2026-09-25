// 詳細內文：所見即所得。單換行＝同段換行，空一行＝新段落。
// 「-----」分隔線顯示成細線；「3. 標題」這類短行（不以句號結尾）加粗當小標題；
// 「- 項目」「• 項目」開頭的行加圓點（不加粗）；「【重點】」連框框一起加粗。
const SEPARATOR = /^[-–—=_─＝]{3,}$/
const BULLET = /^(?:[-*]\s+|[•・]\s*)(\S.*)$/
const HEADING =/^\d+[.、）)]\s*[^。]{1,30}$/

// 行內的「【重點】」連框框一起加粗
function renderInline(line) {
  return line.split(/(【[^】]*】)/).map((part, i) =>
    part.startsWith('【') && part.endsWith('】')
      ? <strong key={i} className="font-bold text-[#43473F]">{part}</strong>
      : part
  )
}

export default function DetailsText({ text, className = '' }) {
  if (!text) return null
  const lines = text.split('\n').map(l => l.trim())
  // 頭尾空行不需要
  while (lines.length && !lines[0]) lines.shift()
  while (lines.length && !lines[lines.length - 1]) lines.pop()

  const nodes = []
  let prevBlank = false
  lines.forEach((line, idx) => {
    if (!line) {
      prevBlank = true
      return
    }
    const gap = prevBlank ? 'mt-4' : ''
    prevBlank = false
    if (SEPARATOR.test(line)) {
      nodes.push(<hr key={idx} className="my-4 border-0 border-t border-[#DDD6C8]" />)
    } else if (BULLET.test(line)) {
      nodes.push(
        <div key={idx} className={`flex gap-2 ${gap || 'mt-2'}`}>
          <span className="mt-[0.6em] w-1.5 h-1.5 shrink-0 rounded-full bg-[#C4BCAC]" />
          <span>{renderInline(line.match(BULLET)[1])}</span>
        </div>
      )
    } else if (HEADING.test(line)) {
      nodes.push(
        <div key={idx} className={`font-bold text-[#43473F] ${gap || 'mt-2'}`}>{line}</div>
      )
    } else {
      nodes.push(<div key={idx} className={gap}>{renderInline(line)}</div>)
    }
  })

  return (
    <div className={`text-[0.9rem] text-gray-600 leading-relaxed break-words ${className}`}>
      {nodes}
    </div>
  )
}
