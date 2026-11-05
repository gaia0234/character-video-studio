import {useCurrentFrame} from 'remotion';

export type HybridPhase = 'launch' | 'accelerate' | 'regenerate' | 'regenerate-limit' | 'stop';
const ink = '#344657';
const electricity = '#347B9C';
const mechanical = '#B27729';
const settings = {
  launch: {title: '発進：電池の電気でモーターを動かす', step: 0,
    summary: '電池 → モーター → 車輪',
    note: '条件が合う場合の例。電池残量や暖機などによりエンジンも作動します。'},
  accelerate: {title: '加速：エンジンとモーターが協力する', step: 1,
    summary: 'エンジンの力 ＋ モーターの力',
    note: '必要な駆動力に応じた分担の例。二つを常に同時に使うわけではありません。'},
  regenerate: {title: '回生：減速時のエネルギーを電池へ戻す', step: 2,
    summary: '車輪 → 発電するモーター → 電池',
    note: '回収できるのは一部。電力の変換・制御を介して電池にためます。'},
  'regenerate-limit': {title: '回生：取り戻せるのは、一部だけ', step: 2,
    summary: '使ったエネルギーが、すべて戻るわけではない',
    note: '摩擦や電力変換などによる損失もあります。永久に走れる仕組みではありません。'},
  stop: {title: '停車：条件に応じてエンジンを止める', step: 3,
    summary: '必要がなければ、エンジンを休ませる',
    note: '暖機・電池残量・空調などの条件で、停車中もエンジンが動く場合があります。'},
} as const;

export const Machine = ({x, y, active}: {x: number; y: number; active: boolean}) => <g opacity={active ? 1 : .48}>
  <rect x={x} y={y} width={128} height={86} rx={22} fill="url(#hy-metal)" stroke={ink} strokeWidth={3} />
  <rect x={x + 13} y={y + 11} width={96} height={64} rx={16} fill="#D6E1E6" stroke={ink} strokeWidth={2} />
  {[y + 16, y + 58].map((cy) => <g key={cy}>
    <rect x={x + 28} y={cy} width={64} height={12} rx={4} fill="#C99966" stroke="#8F6741" />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M${x + 32 + i * 7} ${cy + 1} v10`} stroke="#8F6741" />)}
  </g>)}
  <rect x={x + 28} y={y + 32} width={66} height={22} rx={4} fill="#92A8B5" stroke={ink} strokeWidth={2} />
  <path d={`M${x - 8} ${y + 43} h146`} stroke={ink} strokeWidth={9} />
</g>;

export const ToyotaHybridDriving = ({phase}: {phase: HybridPhase}) => {
  const frame = useCurrentFrame();
  const config = settings[phase];
  const regen = phase === 'regenerate' || phase === 'regenerate-limit';
  const moving = phase !== 'stop';
  const engineOn = phase === 'accelerate';
  const offset = -frame * 1.6;
  const energyLine = (path: string, color: string, marker: string) => <g>
    <path d={path} fill="none" stroke="#FFFCF5" strokeWidth={17} strokeLinejoin="round" />
    <path d={path} fill="none" stroke={color} strokeWidth={9} strokeLinejoin="round" markerEnd={`url(#${marker})`} />
    <path d={path} fill="none" stroke="#FFF5D1" strokeWidth={3} strokeDasharray="10 20" strokeDashoffset={offset} />
  </g>;
  return <div style={{position: 'absolute', left: 120, top: 160, width: 1580, height: 630,
    background: '#FBFCFD', border: `4px solid ${ink}`, borderRadius: 26,
    boxShadow: '0 12px 0 #29374718', overflow: 'hidden'}}>
    <svg width={1580} height={630} viewBox="0 0 1580 630" role="img" aria-label={config.title}>
      <defs>
        <linearGradient id="hy-metal" x2=".2" y2="1">
          <stop stopColor="#F0F4F5" /><stop offset=".5" stopColor="#B5C4CF" /><stop offset="1" stopColor="#879EAE" />
        </linearGradient>
        <linearGradient id="hy-body" x2="0" y2="1">
          <stop stopColor="#E8EFF2" /><stop offset=".5" stopColor="#BACCD8" /><stop offset="1" stopColor="#F0F4F6" />
        </linearGradient>
        <linearGradient id="hy-glass" x2="0" y2="1">
          <stop stopColor="#AFC5D1" /><stop offset="1" stopColor="#E4EDF2" />
        </linearGradient>
        <marker id="hy-electric-arrow" markerWidth={26} markerHeight={22} refX={24} refY={11} orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0 L26 11 L0 22 Z" fill={electricity} />
        </marker>
        <marker id="hy-mechanical-arrow" markerWidth={26} markerHeight={22} refX={24} refY={11} orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0 0 L26 11 L0 22 Z" fill={mechanical} />
        </marker>
      </defs>
      <text x={30} y={51} fontSize={35} fontWeight={900} fill={ink}>{config.title}</text>
      {['発進', '加速', '回生', '停車'].map((name, i) => <g key={name}>
        <rect x={1050 + i * 122} y={18} width={110} height={43} rx={21}
          fill={i === config.step ? '#344657' : '#E7ECEE'} />
        <text x={1105 + i * 122} y={49} fontSize={28} fontWeight={800} textAnchor="middle"
          fill={i === config.step ? '#FFF' : '#6A7C87'}>{name}</text>
      </g>)}

      {/* 初代のセダンの外形を参考にした車体。部品位置・寸法は説明用に展開。 */}
      <ellipse cx={772} cy={487} rx={666} ry={17} fill="#8A9DA9" opacity={.16} />
      <path d="M143 376 L165 310 Q176 292 221 285 L414 263 L552 164 Q575 151 628 151 H1009 Q1045 152 1072 173 L1205 260 L1336 285 Q1400 299 1419 338 L1443 409 L1427 443 H160 L137 419 Z"
        fill="url(#hy-body)" stroke={ink} strokeWidth={4} />
      <path d="M445 261 L568 175 H747 V261 Z M769 175 H1006 Q1028 175 1051 190 L1159 261 H769 Z"
        fill="url(#hy-glass)" stroke={ink} strokeWidth={4} />
      <path d="M632 278 V420 M1044 278 V420 M192 301 H408 M1201 280 L1379 315 M150 395 H1413"
        fill="none" stroke="#849CAB" strokeWidth={3} />
      <path d="M680 287 H720 M1066 287 H1106" stroke={ink} strokeWidth={6} strokeLinecap="round" />
      <path d="M144 345 L204 335 V359 H142 M1384 320 L1410 341 V363 H1383" fill="#FAF0CB" stroke={ink} strokeWidth={2} />
      <path d="M225 303 H1321 V405 H225 Z" fill="#FBFCFD" fillOpacity={.72} />
      <path d="M209 411 H1364" stroke="#8298A6" strokeWidth={12} />
      {[363, 1206].map((cx) => <g key={cx}>
        <circle cx={cx} cy={427} r={66} fill="#3D4B56" stroke={ink} strokeWidth={5} />
        <circle cx={cx} cy={427} r={48} fill="url(#hy-metal)" stroke="#849AA8" strokeWidth={3} />
        <g transform={`rotate(${moving ? -frame * (regen ? 1.8 : 3) : 0} ${cx} 427)`}>
          {[0, 72, 144, 216, 288].map((a) => <path key={a} d={`M${cx} 414 V389 M${cx} 440 V465`}
            stroke="#5F7584" strokeWidth={8} strokeLinecap="round" transform={`rotate(${a} ${cx} 427)`} />)}
        </g>
        <circle cx={cx} cy={427} r={13} fill="#DFE7EB" stroke={ink} strokeWidth={3} />
      </g>)}

      <g opacity={engineOn ? 1 : .45}>
        <path d="M257 297 H381 L394 315 V374 H254 L245 357 V313 Z" fill="url(#hy-metal)" stroke={ink} strokeWidth={3} />
        <path d="M257 287 H377 V307 H257 Z" fill="#8EA4B3" stroke={ink} strokeWidth={3} />
        {[266, 293, 320, 347].map((x, i) => <g key={x}>
          <rect x={x} y={315} width={18} height={43} fill="#ECF1F4" stroke="#7A919F" strokeWidth={2} />
          <rect x={x + 2} y={324 + (i % 2) * 12} width={14} height={12} fill="#9FB1BD" />
        </g>)}
        <path d="M260 369 H392" stroke={ink} strokeWidth={8} />
      </g>
      <Machine x={487} y={303} active={moving} />
      <g>
        <rect x={1098} y={300} width={203} height={73} rx={9} fill="#D2DDD9" stroke={ink} strokeWidth={3} />
        {Array.from({length: 8}, (_, i) => <rect key={i} x={1108 + i * 23} y={311} width={17} height={48} rx={3}
          fill="#92AB9D" stroke="#5F7D6C" strokeWidth={1.5} />)}
        <rect x={1302} y={316} width={10} height={15} fill="#A5B7AF" stroke={ink} />
      </g>
      <rect x={784} y={310} width={156} height={52} rx={8} fill="#E6EDF1" stroke="#648398" strokeWidth={3} />
      <text x={862} y={345} textAnchor="middle" fill={ink} fontSize={27} fontWeight={800}>電力変換</text>
      {/* 線はエネルギー経路。配管・実物配線の寸法や配置を再現するものではない。 */}
      {moving ? <>
        {energyLine(regen ? 'M618 345 H770' : 'M776 345 H627', electricity, 'hy-electric-arrow')}
        {energyLine(regen ? 'M949 337 H1091' : 'M1091 337 H949', electricity, 'hy-electric-arrow')}
      </> : null}
      {moving ? energyLine(regen ? 'M363 401 L428 381 H478' : 'M482 381 H429 L363 401', mechanical, 'hy-mechanical-arrow') : null}
      {engineOn ? energyLine('M393 337 H430 V381 L376 402', mechanical, 'hy-mechanical-arrow') : null}
      {!moving ? <g>
        <rect x={636} y={381} width={430} height={59} rx={12} fill="#F6F0DF" stroke="#A38B55" strokeWidth={2} />
        <text x={851} y={421} fontSize={34} fontWeight={800} textAnchor="middle" fill={ink}>停車中・必要時に再始動</text>
      </g> : null}

      <g fill={ink} fontSize={32} fontWeight={800} textAnchor="middle">
        <path d="M314 147 V278" stroke={ink} strokeWidth={2} />
        <rect x={205} y={95} width={220} height={52} rx={9} fill="#FFFEFA" stroke={ink} strokeWidth={2} />
        <text x={315} y={132}>エンジン</text>
        <path d="M600 126 L548 295" stroke={ink} strokeWidth={2} />
        <rect x={450} y={74} width={300} height={52} rx={9} fill="#FFFEFA" stroke={ink} strokeWidth={2} />
        <text x={600} y={111}>{regen ? 'モーター（発電）' : 'モーター'}</text>
        <path d="M1231 147 V292" stroke={ink} strokeWidth={2} />
        <rect x={1121} y={95} width={220} height={52} rx={9} fill="#FFFEFA" stroke={ink} strokeWidth={2} />
        <text x={1231} y={132}>駆動用電池</text>
      </g>
      <rect x={28} y={512} width={1524} height={58} rx={12} fill="#EEF3F5" />
      <text x={790} y={553} textAnchor="middle" fontSize={35} fontWeight={900} fill={ink}>{config.summary}</text>
      <text x={29} y={610} fontSize={25} fill="#526574">{config.note}</text>
      <g transform="translate(41 78)" fontSize={25} fontWeight={800}>
        <path d="M0 0 H45" stroke={electricity} strokeWidth={7} /><text x={56} y={9} fill={ink}>電気</text>
        <path d="M157 0 H202" stroke={mechanical} strokeWidth={7} /><text x={213} y={9} fill={ink}>機械の力</text>
        <text x={1070} y={9} fill="#647B89" fontSize={23}>配置は説明用の模式図</text>
      </g>
    </svg>
  </div>;
};
