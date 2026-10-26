// 自主制作の断面模式図。1997年トヨタ公式の断面図・外観写真を参照。
// 部品の位置関係を示すための簡略図で、歯数・寸法・巻線数・油路等は再現しない。
const ink = '#344657';
const caseOutline = 'M635 300 L673 282 L709 260 L785 260 L803 242 L938 242 L964 264 L1075 264 L1101 247 L1275 247 L1319 273 L1359 300 L1381 346 L1374 426 L1339 463 L1258 471 L1226 501 L1067 501 L1037 526 L943 526 L909 499 L797 499 L766 477 L709 477 L674 449 L635 437 Z';

const Bolt = ({x, y, r = 7}: {x: number; y: number; r?: number}) => <g>
  <circle cx={x} cy={y} r={r + 4} fill="#C3CED5" stroke="#687A8A" strokeWidth={2} />
  <path d={`M${x-r} ${y} L${x-r/2} ${y-r*.87} L${x+r/2} ${y-r*.87} L${x+r} ${y} L${x+r/2} ${y+r*.87} L${x-r/2} ${y+r*.87} Z`}
    fill="url(#ths-steel)" stroke={ink} strokeWidth={2} />
  <path d={`M${x-r/2} ${y} H${x+r/2}`} stroke="#637385" strokeWidth={2} />
</g>;

const Callout = ({text, x, y, width, points, anchor, color = ink}: {
  text: string; x: number; y: number; width: number; points: string;
  anchor: [number, number]; color?: string;
}) => <g>
  <polyline points={points} fill="none" stroke={color} strokeWidth={3} />
  <circle cx={anchor[0]} cy={anchor[1]} r={5} fill={color} stroke="#FFF" strokeWidth={2} />
  <rect x={x} y={y} width={width} height={53} rx={10} fill="#FFFEFA" stroke={color} strokeWidth={2} />
  <text x={x + width / 2} y={y + 37} fill={ink} textAnchor="middle" fontSize={32} fontWeight={800}>{text}</text>
</g>;

// 縦断面：上/下が固定子と巻線、中央の積層部が回転子。発電機とモーターは別体。
const ElectricMachine = ({x, width, radius, color}: {x: number; width: number; radius: number; color: string}) => <g>
  <rect x={x} y={390-radius} width={width} height={radius*2} rx={18}
    fill={color} fillOpacity={0.16} stroke={color} strokeWidth={4} />
  {[390-radius+9, 390+radius-39].map((y) => <g key={y}>
    <rect x={x+10} y={y} width={width-20} height={30} rx={10} fill="url(#ths-copper)" stroke="#906038" strokeWidth={2} />
    <rect x={x+16} y={y+4} width={width-32} height={22} rx={7} fill="url(#ths-winding)" />
  </g>)}
  <rect x={x+25} y={355} width={width-50} height={70} rx={7} fill="url(#ths-steel)" stroke={color} strokeWidth={3} />
  <rect x={x+30} y={359} width={width-60} height={62} fill="url(#ths-laminations)" />
  <path d={`M${x-5} 382 H${x+width+7} V398 H${x-5} Z`} fill="url(#ths-shaft)" stroke={ink} strokeWidth={2} />
  {[x+9, x+width-20].map((bx) => <g key={bx}>
    <rect x={bx} y={365} width={11} height={50} rx={3} fill="#E6EDF0" stroke="#586B7A" strokeWidth={2} />
    <path d={`M${bx+2} 371 V409 M${bx+8} 371 V409`} stroke="#99A8B2" strokeWidth={2} />
  </g>)}
</g>;

export const ToyotaTHSCutaway = ({stamp, spacious = false}: {stamp?: string | null; spacious?: boolean}) => <div
  style={{position: 'absolute', left: 120, top: 160, width: 1580, height: 630,
    background: '#FBFCFD', border: `4px solid ${ink}`, borderRadius: 26,
    boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
  <svg width={1580} height={630} viewBox="0 0 1580 630" role="img"
    aria-label="エンジンと、別々の発電機・モーターを備える駆動ユニットの簡略断面模式図">
    <defs>
      <linearGradient id="ths-steel" x2="0.18" y2="1">
        <stop stopColor="#F0F4F6" /><stop offset=".33" stopColor="#B9C5CE" />
        <stop offset=".6" stopColor="#E3EAEE" /><stop offset="1" stopColor="#899BAA" />
      </linearGradient>
      <linearGradient id="ths-casting" x2=".7" y2="1">
        <stop stopColor="#C9D2D8" /><stop offset=".5" stopColor="#9EADB9" /><stop offset="1" stopColor="#627789" />
      </linearGradient>
      <linearGradient id="ths-shaft" x2="0" y2="1">
        <stop stopColor="#6E8190" /><stop offset=".45" stopColor="#E1E7EB" /><stop offset="1" stopColor="#536777" />
      </linearGradient>
      <linearGradient id="ths-copper" x2="0" y2="1">
        <stop stopColor="#E0B77D" /><stop offset=".5" stopColor="#C48F55" /><stop offset="1" stopColor="#946443" />
      </linearGradient>
      <pattern id="ths-winding" width={8} height={12} patternUnits="userSpaceOnUse">
        <path d="M2 0 V12" stroke="#805437" strokeWidth={2} opacity={.58} />
      </pattern>
      <pattern id="ths-laminations" width={7} height={9} patternUnits="userSpaceOnUse">
        <path d="M1 0 V9" stroke="#6B7D89" strokeWidth={1.4} />
      </pattern>
      <pattern id="ths-section" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <path d="M1 0 V9" stroke="#718493" strokeWidth={2} opacity={.5} />
      </pattern>
    </defs>
    <text x={spacious ? 54 : 30} y={58} fontSize={36} fill={ink} fontWeight={900}>エンジン＋駆動ユニットの断面模式図</text>
    <path d={spacious ? 'M35 560 H1510' : 'M35 564 H1510'} stroke="#E0E6EB" strokeWidth={2} />
    {/* 本体・影・引出し線を一緒に内側へ寄せる。既定は等倍のまま。 */}
    <g transform={spacious ? 'translate(110 35) scale(.86)' : undefined}>
    <ellipse cx={790} cy={530} rx={660} ry={21} fill="#738695" opacity={.12} />

    {/* エンジンの鋳物と上蓋。写真に見られる4コイル列・締結部を反映。 */}
    <g stroke={ink} strokeWidth={3} strokeLinejoin="round">
      <path d="M169 215 L192 194 H606 L647 220 L655 407 L626 455 H189 L160 422 Z" fill="url(#ths-casting)" />
      <path d="M188 239 H621 V425 L602 450 H202 L188 424 Z" fill="#F0F3F5" stroke="#718493" strokeWidth={8} />
      <path d="M188 239 H621 V425 L602 450 H202 L188 424 Z" fill="url(#ths-section)" />
      <path d="M174 187 Q181 174 202 174 H598 L625 187 L629 222 H174 Z" fill="url(#ths-steel)" strokeWidth={4} />
      <path d="M182 203 H615" stroke="#8394A1" strokeWidth={3} />
      {[231, 335, 439, 543].map((x) => <g key={x}>
        <path d={`M${x-18} 166 L${x+15} 163 L${x+24} 179 L${x+20} 191 H${x-17} Z`} fill="#3C4A55" />
        <path d={`M${x-12} 173 H${x+12}`} stroke="#A5B0B7" strokeWidth={2} />
        <path d={`M${x} 195 V229`} stroke="#6A7E8C" strokeWidth={5} />
      </g>)}
      <ellipse cx={183} cy={190} rx={19} ry={10} fill="#3E4C58" />
      {[225, 329, 433, 537].map((x, i) => {
        const py = i === 0 || i === 3 ? 267 : 308;
        const pinX = x+36+(i%2 ? -12 : 12), pinY = 390+(i%2 ? 17 : -17);
        return <g key={x}>
          <rect x={x} y={241} width={72} height={143} rx={4} fill="#E8EEF2" stroke="#7A8C9B" strokeWidth={4} />
          <path d={`M${x+7} 249 V378 M${x+65} 249 V378`} stroke="#C0CCD5" strokeWidth={4} />
          <path d={`M${x+30} ${py+28} L${pinX-7} ${pinY} Q${pinX} ${pinY+14} ${pinX+7} ${pinY} L${x+43} ${py+28} Z`}
            fill="url(#ths-steel)" stroke="#526776" strokeWidth={3} />
          <path d={`M${x+4} ${py} H${x+68} V${py+32} Q${x+36} ${py+43} ${x+4} ${py+32} Z`} fill="url(#ths-steel)" />
          <path d={`M${x+7} ${py+7} H${x+65} M${x+7} ${py+13} H${x+65}`} stroke="#697B89" strokeWidth={2} />
          <circle cx={x+36} cy={py+27} r={5} fill="#758895" />
          <path d={`M${x+20} 390 Q${pinX} ${pinY-27} ${x+53} 390 Q${pinX} ${pinY+27} ${x+20} 390 Z`}
            fill="#7D919F" strokeWidth={3} />
          <circle cx={pinX} cy={pinY} r={8} fill="#E7EDF0" />
        </g>;
      })}
      <path d="M165 383 H690 V398 H165 Z" fill="url(#ths-shaft)" />
      <path d="M185 438 H626 L606 478 Q402 500 203 477 Z" fill="url(#ths-steel)" strokeWidth={4} />
      <path d="M211 458 H596 M238 477 H570" fill="none" stroke="#8699A7" strokeWidth={2} />
      {[172, 637].map((x) => <g key={x}>
        <path d={`M${x} 242 L${x-11} 408 L${x+7} 430`} fill="none" stroke="#C8D2D9" strokeWidth={10} />
      </g>)}
    </g>
    {[198, 303, 410, 520, 609].map((x) => <Bolt key={x} x={x} y={213} r={5} />)}
    {[201, 304, 412, 520, 609].map((x) => <Bolt key={x} x={x} y={445} r={5} />)}

    {/* 一体のトランスアクスル鋳物。右上の外殻を残し、手前の断面を開く。 */}
    <path d={caseOutline} transform="translate(11 10)" fill="#6E8392" opacity={.35} />
    <path d={caseOutline} fill="url(#ths-casting)" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M676 323 L730 285 H802 L820 269 H933 L956 290 H1085 L1113 274 H1265 L1302 299 L1337 323 L1351 355 V415 L1320 438 H1240 L1211 470 H1080 L1049 496 H956 L921 468 H810 L780 449 H724 L691 426 Z"
      fill="#F5F7F8" stroke="#DCE3E8" strokeWidth={12} strokeLinejoin="round" />
    <path d="M676 323 L730 285 H802 L820 269 H933 L956 290 H1085 L1113 274 H1265 L1302 299 L1337 323 L1351 355 V415 L1320 438 H1240 L1211 470 H1080 L1049 496 H956 L921 468 H810 L780 449 H724 L691 426 Z"
      fill="none" stroke="url(#ths-section)" strokeWidth={8} />
    <path d="M679 310 Q674 374 689 439 M710 285 Q700 372 717 462" stroke="#D1DBE2" strokeWidth={9} fill="none" />
    <path d="M722 289 V451 M1007 274 L1026 305 M1297 282 L1316 315 M1322 449 L1289 471 M1132 488 V503"
      stroke="#D2DCE2" strokeWidth={8} fill="none" />
    {/* 破線は共通の軸線。一本の剛体軸で全ローターが固定される、という意味ではない。 */}
    <path d="M645 390 H1400" stroke="#8B9DAA" strokeWidth={2} strokeDasharray="18 9 3 9" />
    <path d="M651 381 H769 V399 H651 Z" fill="url(#ths-shaft)" stroke={ink} strokeWidth={2} />
    <g>
      <ellipse cx={744} cy={390} rx={24} ry={62} fill="#8194A2" stroke={ink} strokeWidth={3} />
      <path d="M736 339 V441 M747 334 V446" stroke="#DBE3E8" strokeWidth={4} />
      <circle cx={788} cy={390} r={47} fill="#D6BE88" stroke="#8C7646" strokeWidth={4} />
      <circle cx={788} cy={390} r={34} fill="#E5DBBD" stroke="#8C7646" strokeWidth={3} />
      <path d="M760 379 Q782 349 811 374 M765 409 Q794 435 816 400" fill="none" stroke="#9A824C" strokeWidth={10} />
      <circle cx={788} cy={390} r={13} fill="#C29B51" stroke={ink} strokeWidth={3} />
    </g>
    <ElectricMachine x={845} width={164} radius={76} color="#4D819A" />
    <ElectricMachine x={1102} width={222} radius={104} color="#658F7D" />
    <path d="M817 378 H851 V402 H817 Z M1008 375 H1040 V405 H1008 Z M1068 379 H1104 V401 H1068 Z"
      fill="url(#ths-shaft)" stroke={ink} strokeWidth={2} />
    <path d="M1014 382 H1036 M1073 385 H1098" stroke="#EDF2F5" strokeWidth={2} />
    {/* 下側の減速・出力部は位置と役割のみを簡略表示する。歯数や歯車比は示さない。 */}
    <g stroke={ink} strokeWidth={3}>
      <path d="M1013 432 V475 L1056 497 L1104 479 V432" fill="#CAD4DB" />
      <circle cx={1055} cy={477} r={26} fill="url(#ths-steel)" />
      <circle cx={1055} cy={477} r={13} fill="#8296A5" />
      <path d="M1074 481 H1377 V495 H1074 Z" fill="url(#ths-shaft)" />
      <rect x={1368} y={472} width={30} height={33} rx={5} fill="url(#ths-steel)" />
      <path d="M1398 480 H1441 V497 H1398 Z" fill="#8196A6" />
    </g>
    <path d="M1287 265 C1394 239 1432 274 1434 329 L1446 438 Q1449 475 1424 479"
      fill="none" stroke="#8E5B39" strokeWidth={13} />
    <path d="M1287 265 C1394 239 1432 274 1434 329 L1446 438 Q1449 475 1424 479"
      fill="none" stroke="#C67E40" strokeWidth={9} />
    <path d="M1287 265 C1394 239 1432 274 1434 329 L1446 438 Q1449 475 1424 479"
      fill="none" stroke="#E2A05A" strokeWidth={3} strokeDasharray="3 5" />
    {[[709,279],[804,256],[936,257],[1103,261],[1278,267],[1360,325],[1357,429],
      [1250,482],[1092,490],[976,512],[797,482],[703,453]].map(([x,y]) => <Bolt key={`${x}-${y}`} x={x} y={y} r={5} />)}

    <Callout text="エンジン" x={76} y={99} width={190} points="170,152 170,162 354,184" anchor={[354,184]} />
    <Callout text="発電機" x={795} y={107} width={170} points="880,160 880,219 923,318" anchor={[923,318]} color="#4D819A" />
    <Callout text="モーター" x={1135} y={107} width={190} points="1230,160 1230,223 1214,289" anchor={[1214,289]} color="#658F7D" />
    <Callout text="動力分割装置" x={650} y={535} width={255} points="776,535 776,505 788,436" anchor={[788,436]} color="#9A824C" />
    <Callout text="減速・出力" x={1114} y={535} width={220} points="1224,535 1224,514 1186,489" anchor={[1186,489]} />
    </g>
    <text x={28} y={spacious ? 600 : 612} fontSize={22} fill="#526574">1997年の公式資料を参考に構成を簡略化した断面模式図　｜　出典：トヨタ 1997年3月・10月資料</text>
  </svg>
  {stamp ? <div style={{position: 'absolute', top: 22, right: 24, fontSize: 34, fontWeight: 900,
    color: ink, background: '#FFF3CF', border: `3px solid ${ink}`, borderRadius: 12,
    padding: '6px 18px', transform: 'rotate(-2deg)'}}>{stamp}</div> : null}
</div>;
