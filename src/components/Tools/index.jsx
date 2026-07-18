export default function Tools() {
  return (
    <div className="px-6 py-6 space-y-8 pb-32 font-sans md:px-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-10 md:pb-24 md:items-start">

      {/* Flight Info */}
      <section className="border-t border-[#D6D0C4] pt-6">
        <h3 className="text-sm font-bold text-[#8A819C] tracking-[0.2em] uppercase mb-4 flex items-center gap-1.5">
          ✦ Flight Info
        </h3>
        <div className="space-y-4 text-sm text-[#4A4A43]">
          <div className="flex justify-between items-end border-b border-dashed border-[#D6D0C4] pb-3">
            <div>
              <div className="text-[0.62rem] text-gray-400 mb-0.5">去程 10/01 TPE → NGO</div>
              <div className="font-serif font-bold text-[#43473F] text-base">JX838</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-[#43473F]">14:55 – 18:45</div>
              <div className="text-[0.62rem] text-gray-400 mt-0.5">星宇航空</div>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[0.62rem] text-gray-400 mb-0.5">回程 10/06 NGO → TPE</div>
              <div className="font-serif font-bold text-[#43473F] text-base">JX839</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-[#43473F]">19:55 – 23:00</div>
              <div className="text-[0.62rem] text-gray-400 mt-0.5">星宇航空</div>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodation */}
      <section className="border-t border-[#D6D0C4] pt-6">
        <h3 className="text-sm font-bold text-[#AD8B76] tracking-[0.2em] uppercase mb-4 flex items-center gap-1.5">
          ✦ Accommodation
        </h3>
        <ul className="space-y-4 text-sm">
          {[
            { date: '10/01', city: '名古屋', name: 'ixyz杜' },
            { date: '10/02', city: '松本', name: 'Tabino Hotel lit Matsumoto' },
            { date: '10/03–04', city: '高山', name: '高山 東急ステイ 飛驒高山' },
            { date: '10/05', city: '名古屋', name: '大吉屋3号館（日赤館）' },
          ].map(({ date, city, name }) => (
            <li key={date} className="flex justify-between items-start border-b border-dashed border-gray-100 pb-3 last:border-0 last:pb-0">
              <div>
                <div className="text-[0.62rem] text-gray-400">{date} {city}</div>
                <div className="font-serif font-bold text-[#43473F] mt-0.5">{name}</div>
              </div>
              <span className="text-[0.55rem] border border-[#AD8B76]/50 text-[#AD8B76] px-1.5 py-0.5 rounded-sm tracking-widest shrink-0 ml-2 mt-0.5">宿</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pre-trip: Visit Japan Web */}
      <section className="border-t border-[#D6D0C4] pt-6 md:col-span-2">
        <h3 className="text-sm font-bold text-[#6F8172] tracking-[0.2em] uppercase mb-4 flex items-center gap-1.5">
          ✦ 行前準備 · Visit Japan Web
        </h3>
        <div className="text-sm text-[#4A4A43] space-y-4">
          <p className="text-[0.75rem] text-[#918A7C] leading-relaxed">
            日本入境線上手續，出發前填好可加速通關。<span className="font-bold text-[#6F8172]">七人每人都要各自辦理</span>（也可由一人註冊後加入同行家人）。
          </p>
          <ol className="space-y-3">
            {[
              { step: '1', text: '註冊 Visit Japan Web 帳號，登錄本人與同行家人資料' },
              { step: '2', text: '填寫「入境審查」與「海關申報」（抵達日 10/01，入境機場：中部國際機場 NGO）' },
              { step: '3', text: '出發前把 QR Code 截圖存在手機相簿，通關時直接出示' },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3 border-b border-dashed border-[#D6D0C4] pb-3 last:border-0 last:pb-0">
                <span className="w-5 h-5 rounded-full bg-sage/15 text-[#6F8172] text-[0.62rem] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step}
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
          <a
            href="https://www.vjw.digital.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-sage text-oat font-bold tracking-widest text-xs rounded-xl py-3 shadow-[0_4px_10px_-4px_rgba(111,129,114,0.6)] active:scale-95 transition-transform"
          >
            前往 Visit Japan Web →
          </a>
          <p className="text-[0.62rem] text-gray-400 text-center">建議出發前 1–2 週完成（最晚出發前一天）</p>
        </div>
      </section>

      {/* Bill Bear */}
      <section className="border-t border-[#D6D0C4] pt-6 md:col-span-2">
        <h3 className="text-sm font-bold text-[#B09455] tracking-[0.2em] uppercase mb-4 flex items-center gap-1.5">
          ✦ 記帳分帳 · Bill Bear
        </h3>
        <div className="flex items-center gap-4">
          <img
            src={`${import.meta.env.BASE_URL}images/billbear.png`}
            alt="Bill Bear"
            className="w-14 h-14 rounded-2xl shadow-sm shrink-0 border border-[#D6D0C4]/60"
          />
          <p className="text-[0.75rem] text-[#918A7C] leading-relaxed flex-1">
            旅途中的代墊、共同開銷都記在 <span className="font-bold text-[#4A4A43]">Bill Bear</span> 群組，回台灣一次結清。
            <span className="font-bold text-[#B09455]">付錢當下就記</span>，不要靠回憶！
          </p>
        </div>
      </section>

      {/* Emergency */}
      <section className="border-t border-[#D6D0C4] pt-6 md:col-span-2">
        <h3 className="text-sm font-bold text-[#A56A64] tracking-[0.2em] uppercase mb-4 flex items-center gap-1.5">
          ✦ Emergency
        </h3>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between items-center py-2">
            <span className="text-[#A56A64]">報警</span>
            <a href="tel:110" className="font-mono font-bold text-xl text-[#A56A64] tracking-widest">110</a>
          </li>
          <li className="flex justify-between items-center py-2 border-t border-[#E3D3D0]">
            <span className="text-[#A56A64]">救護車</span>
            <a href="tel:119" className="font-mono font-bold text-xl text-[#A56A64] tracking-widest">119</a>
          </li>
          <li className="flex justify-between items-start py-3 border-t border-[#E3D3D0]">
            <div>
              <div className="text-[#A56A64] text-sm">駐大阪辦事處</div>
              <div className="text-[0.62rem] text-[#A56A64]/70">急難救助</div>
            </div>
            <a href="tel:+819087944568" className="font-mono font-bold text-base text-[#A56A64] underline underline-offset-2">
              +81-90-8794-4568
            </a>
          </li>
        </ul>
      </section>

    </div>
  )
}
