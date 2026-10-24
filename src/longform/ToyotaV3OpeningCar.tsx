// Geometry retained from the accepted first-generation Prius side-view drawing.
const ink = '#344657';
export const ToyotaV3OpeningCar = () => <svg viewBox="100 60 1380 500" width="100%" height="100%" aria-label="初代プリウスの外観を参考にした説明図">
  <defs>
    <linearGradient id="pr-body" x2=".12" y2="1"><stop stopColor="#F3F8F7"/><stop offset=".42" stopColor="#BBD1CF"/><stop offset="1" stopColor="#91ADA9"/></linearGradient>
    <linearGradient id="pr-glass" x2=".2" y2="1"><stop stopColor="#657F86"/><stop offset=".5" stopColor="#9EBBBE"/><stop offset="1" stopColor="#D4E4E2"/></linearGradient>
  </defs>
  <ellipse cx={777} cy={539} rx={643} ry={10} fill="#9EB1B4" opacity={.17}/>
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
  {[370, 1138].map(cx => <g key={cx}>
    <circle cx={cx} cy={443} r={87} fill="#34454E"/>
    <circle cx={cx} cy={443} r={66} fill="#BACBD1" stroke="#6B838C" strokeWidth={5}/>
    {[0,72,144,216,288].map(a => <path key={a} d={`M${cx-7} 425L${cx-15} 392Q${cx} 385 ${cx+15} 392L${cx+7} 425Z`} fill="#728E99" transform={`rotate(${a} ${cx} 443)`}/>)}
    <circle cx={cx} cy={443} r={16} fill="#DDE8EB" stroke="#6B838C" strokeWidth={3}/>
  </g>)}
</svg>;
