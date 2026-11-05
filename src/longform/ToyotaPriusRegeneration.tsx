import {useCurrentFrame} from 'remotion';
import {Machine} from './ToyotaHybridDriving';

const ink = '#344657';
const electric = '#347B9C';
const mechanical = '#B27729';

// 外観は初代の公式側面図と1997年発売写真を参照。透視部品と経路は位置・寸法を簡略化。
// 車体・部品だけを縮尺変換し、周囲の説明文字は32px以上を維持する。
export const ToyotaPriusRegeneration = () => {
  const frame = useCurrentFrame();
  const flow = (d: string, color: string, marker: string) => <g>
    <path d={d} fill="none" stroke="#FFFEF8" strokeWidth={17} strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinejoin="round" markerEnd={`url(#${marker})`} />
    <path d={d} fill="none" stroke="#FFF8DC" strokeWidth={3} strokeDasharray="10 20" strokeDashoffset={-frame * 1.6} />
  </g>;
  return <div style={{position: 'absolute', left: 120, top: 160, width: 1580, height: 630,
    background: '#FBFCFD', border: `4px solid ${ink}`, borderRadius: 26,
    boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
    <svg width={1580} height={630} viewBox="0 0 1580 630" role="img" aria-label="初代プリウスを参考にした車体と回生の説明図">
      <defs>
        <linearGradient id="pr-body" x2=".12" y2="1">
          <stop stopColor="#F3F8F7" /><stop offset=".42" stopColor="#BBD1CF" />
          <stop offset=".65" stopColor="#DCE8E5" /><stop offset="1" stopColor="#91ADA9" />
        </linearGradient>
        <linearGradient id="pr-glass" x2=".2" y2="1">
          <stop stopColor="#657F86" /><stop offset=".5" stopColor="#9EBBBE" /><stop offset="1" stopColor="#D4E4E2" />
        </linearGradient>
        <linearGradient id="hy-metal" x2=".2" y2="1">
          <stop stopColor="#EFF5F5" /><stop offset=".5" stopColor="#B5C6CD" /><stop offset="1" stopColor="#839CA8" />
        </linearGradient>
        {[[electric, 'pr-electric'], [mechanical, 'pr-mechanical']].map(([color, id]) => <marker key={id}
          id={id} markerWidth={28} markerHeight={24} refX={26} refY={12} orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0 L28 12 L0 24 Z" fill={color} />
        </marker>)}
      </defs>

      <text x={35} y={55} fill={ink} fontSize={36} fontWeight={900}>回生：車輪の動きを電気に戻す</text>
      <text x={38} y={105} fill="#526C78" fontSize={28} fontWeight={700}>初代プリウスの外観を参考にした透視模式図</text>
      <g transform="translate(1080 42)" fontSize={27} fontWeight={800}>
        <path d="M0 0 H42" stroke={electric} strokeWidth={7} /><text x={55} y={9} fill={ink}>電気</text>
        <path d="M160 0 H202" stroke={mechanical} strokeWidth={7} /><text x={215} y={9} fill={ink}>機械の力</text>
      </g>

      {/* 車体幅907px、白板幅の約57%。屋根と窓を高く、ノーズとトランクを短くする。 */}
      <g transform="translate(200 133) scale(.72)">
        <ellipse cx={777} cy={539} rx={643} ry={12} fill="#9EB1B4" opacity={.17} />
        {/* 公式の真横図の輪郭・窓枠を同じ座標系で採寸して描き直す。
            1997年発売写真と異なる後端スポイラーは付けない。 */}
        <g transform="translate(150 -3.3) scale(.615234375)">
          <path d="M0 636 Q4 598 18 584 L58 563 C119 474 270 422 468 377 L734 220 C811 176 857 160 943 153 C1105 143 1408 139 1484 172 C1556 197 1639 242 1738 296 Q1794 335 1852 343 L1961 361 Q1991 383 1999 434 L2001 488 Q2040 522 2045 578 L2044 672 Q2029 705 1919 730 L1785 763 C1797 509 1428 523 1439 792 L536 780 C533 512 183 505 174 786 L45 769 L23 722 L13 690 Z"
            fill="url(#pr-body)" stroke={ink} strokeWidth={5.5} strokeLinejoin="round" />
          <path d="M511 424 L787 249 Q853 211 957 194 L1106 186 L1071 387 Z"
            fill="url(#pr-glass)" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M1144 189 Q1361 184 1460 225 L1582 315 Q1569 359 1536 369 L1112 390 Z"
            fill="url(#pr-glass)" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
          <path d="M1106 180 L1133 180 L1106 398 L1071 400 Z" fill="#263F47" />
          <path d="M1460 228 L1454 376" stroke="#314B53" strokeWidth={8} />
          <path d="M557 403 L807 255 Q877 218 1089 205 M1164 207 Q1356 204 1425 237"
            fill="none" stroke="#EDF5F3" strokeWidth={6} opacity={.65} />
          <path d="M64 553 Q110 497 190 474 Q177 519 121 550 Z" fill="#F3F6ED" stroke="#5C7880" strokeWidth={4} />
          <path d="M89 536 L153 495 M102 545 L164 502" stroke="#B9CED1" strokeWidth={3} />
          <path d="M19 638 Q98 625 195 634 L197 658 Q83 665 16 659 Z" fill="#354D55" />
          <path d="M33 709 L148 718 V739 L40 728 Z" fill="#567078" />
          <path d="M1890 414 L1982 435 L1994 506 L1968 550 L1923 495 Z" fill="#A85B55" stroke="#6E4C4B" strokeWidth={3.5} />
          <path d="M2001 530 L2035 553 L2042 639 L2012 646 Z" fill="#415D65" />
          <path d="M142 577 Q230 491 394 474 L1500 397 L1864 373 M468 377 L517 366 M1738 296 L1852 343"
            fill="none" stroke="#8DA9A9" strokeWidth={4} />
          <path d="M550 429 C528 580 541 663 570 721 Q578 733 615 733 L1075 731 M1105 396 C1080 502 1082 705 1102 730 H1463 C1547 715 1591 540 1611 330"
            fill="none" stroke="#809D9F" strokeWidth={4} />
          <path d="M967 480 Q996 468 1024 471 L1021 491 L969 495 Z M1473 454 Q1508 441 1543 444 L1539 463 L1474 467 Z"
            fill="#A4BEBC" stroke="#536F75" strokeWidth={4} />
          <path d="M517 394 Q568 357 605 354 Q626 380 615 406 L525 426 Z"
            fill="#B7CECC" stroke={ink} strokeWidth={4} />
          <path d="M1658 367 L1672 337 L1705 342 L1735 365 Z" fill="#526E73" stroke="#A6BCBC" strokeWidth={3.5} />
          <path d="M565 765 H1423" stroke="#6A898E" strokeWidth={7} />
        </g>

        {/* 白く抜くのは窓下の透視部分だけ。車体のシルエットは残す。 */}
        <path d="M251 302 H1305 V397 H252 Z" fill="#F9FCFA" fillOpacity={.6} />
        <g opacity={.5}>
          <path d="M257 297 H381 L394 315 V374 H254 L245 357 V313 Z" fill="url(#hy-metal)" stroke={ink} strokeWidth={3} />
          <path d="M257 287 H377 V307 H257 Z" fill="#8EA4B3" stroke={ink} strokeWidth={3} />
          {[266, 293, 320, 347].map((x, i) => <g key={x}>
            <rect x={x} y={315} width={18} height={43} fill="#EDF3F3" stroke="#7A919F" strokeWidth={2} />
            <rect x={x + 2} y={324 + (i % 2) * 12} width={14} height={12} fill="#9FB1BD" />
          </g>)}
          <path d="M260 369 H392" stroke={ink} strokeWidth={8} />
        </g>
        <Machine x={487} y={303} active />
        <rect x={1098} y={300} width={203} height={73} rx={9} fill="#D9E3DB" stroke={ink} strokeWidth={3} />
        {Array.from({length: 8}, (_, i) => <rect key={i} x={1108 + i * 23} y={311} width={17} height={48} rx={3}
          fill="#93AF9F" stroke="#5F7D6C" strokeWidth={1.5} />)}
        <rect x={784} y={310} width={156} height={52} rx={8} fill="#DAE6EC" stroke="#648398" strokeWidth={3} />
        <path d="M805 326 h115 M805 346 h115" stroke="#98B2C0" strokeWidth={3} />

        {[370, 1138].map((cx) => <g key={cx}>
          <circle cx={cx} cy={443} r={87} fill="#34454E" stroke="#233A43" strokeWidth={3} />
          <circle cx={cx} cy={443} r={78} fill="#46585F" stroke="#53686E" strokeWidth={2} />
          <circle cx={cx} cy={443} r={66} fill="url(#hy-metal)" stroke="#A1B5BC" strokeWidth={2} />
          <g transform={`rotate(${-frame * 1.8} ${cx} 443)`}>
            {[0, 72, 144, 216, 288].map((a) => <path key={a}
              d={`M${cx-12} 425 L${cx-20} 390 Q${cx} 380 ${cx+20} 390 L${cx+12} 425 Z`}
              fill="#748E99" stroke="#4F6B78" strokeWidth={1.5} transform={`rotate(${a} ${cx} 443)`} />)}
          </g>
          <circle cx={cx} cy={443} r={18} fill="#DCE8E9" stroke="#617C89" strokeWidth={2} />
          <circle cx={cx} cy={443} r={6} fill="#6C8793" />
        </g>)}
        {flow('M370 412 L433 382 H477', mechanical, 'pr-mechanical')}
        {flow('M618 345 H770', electric, 'pr-electric')}
        {flow('M949 337 H1091', electric, 'pr-electric')}
      </g>

      {/* 説明は車体の外へ。引出線と注釈文字を縮小しない。 */}
      <g fill="none" stroke="#778D97" strokeWidth={2.2}>
        <path d="M265 307 H325 L427 370" />
        <path d="M670 186 V227 L597 372" />
        <path d="M960 186 V228 L820 364" />
        <path d="M1275 326 H1217 L1065 359" />
      </g>
      {[[427,370],[597,372],[820,364],[1065,359]].map(([x,y]) => <circle key={x} cx={x} cy={y} r={4} fill="#778D97" stroke="#FFF" strokeWidth={1.5} />)}
      <g fill={ink} fontSize={32} fontWeight={800} textAnchor="middle">
        <rect x={45} y={280} width={220} height={54} rx={10} fill="#FFFEFA" stroke="#9AADAF" strokeWidth={2} />
        <text x={155} y={318}>エンジン</text>
        <rect x={515} y={130} width={310} height={56} rx={10} fill="#FFFEFA" stroke={electric} strokeWidth={2} />
        <text x={670} y={169}>モーター（発電）</text>
        <rect x={850} y={130} width={220} height={56} rx={10} fill="#FFFEFA" stroke={electric} strokeWidth={2} />
        <text x={960} y={169}>電力の変換</text>
        <rect x={1275} y={299} width={240} height={54} rx={10} fill="#FFFEFA" stroke="#71947F" strokeWidth={2} />
        <text x={1395} y={337}>駆動用電池</text>
      </g>
      <rect x={50} y={523} width={1480} height={54} rx={13} fill="#EDF3F5" />
      <text x={790} y={561} textAnchor="middle" fill={ink} fontSize={34} fontWeight={900}>車輪 → 発電するモーター → 電池　｜　回収できるのは一部</text>
      <text x={50} y={608} fill="#5A727D" fontSize={22}>外観参考：トヨタの初代プリウス資料。部品配置・配線・寸法は説明のために簡略化しています。</text>
    </svg>
  </div>;
};
