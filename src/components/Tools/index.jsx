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
            { date: '10/05', city: '名古屋', name: '（住宿待確認）' },
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
