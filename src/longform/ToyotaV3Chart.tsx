import React from 'react';

const ink = '#293747';
const gold = '#D9AB56';
const gray = '#B9CBD2';

// 累計の到達点を示す棒グラフ。値は資料にある点だけを描く。
export const BarChart = ({items, width = 1180, height = 360}: {
  items: {label: string; value: number; display: string}[];
  width?: number; height?: number;
}) => {
  const max = Math.max(...items.map((i) => i.value));
  const top = 70, bottom = 70;
  const plot = height - top - bottom;
  const gap = 70;
  const bw = Math.min(150, (width - gap * (items.length + 1)) / items.length);
  const totalW = bw * items.length + gap * (items.length + 1);
  const startX = (width - totalW) / 2 + gap;
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="累計台数の棒グラフ">
    <line x1={40} y1={height - bottom} x2={width - 40} y2={height - bottom} stroke={ink} strokeWidth={3} />
    {items.map((item, i) => {
      const h = Math.max(2, (item.value / max) * plot);
      const x = startX + i * (bw + gap);
      const y = height - bottom - h;
      return <g key={item.label}>
        <rect x={x} y={y} width={bw} height={h} rx={8}
          fill={i === items.length - 1 ? gold : gray} stroke={ink} strokeWidth={3} />
        <text x={x + bw / 2} y={y - 16} textAnchor="middle" fontSize={34} fontWeight={900} fill={ink}>{item.display}</text>
        <text x={x + bw / 2} y={height - bottom + 44} textAnchor="middle" fontSize={28} fontWeight={800} fill="#526574">{item.label}</text>
      </g>;
    })}
  </svg>;
};

// 累計の到達点を結ぶ折れ線。中間の実測値を主張しない旨を画面側で注記する。
export const LineChart = ({points, yMax, yTicks, width = 1180, height = 380}: {
  points: {label: string; year: number; value: number; display: string}[];
  yMax: number; yTicks: {value: number; label: string}[];
  width?: number; height?: number;
}) => {
  const left = 150, right = 120, top = 50, bottom = 80;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const minYear = Math.min(...points.map((p) => p.year));
  const maxYear = Math.max(...points.map((p) => p.year));
  const x = (year: number) => left + ((year - minYear) / (maxYear - minYear)) * plotW;
  const y = (value: number) => top + plotH - (value / yMax) * plotH;
  const path = points.map((p) => `${x(p.year)},${y(p.value)}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="累計台数の折れ線グラフ">
    {yTicks.map((t) => <g key={t.value}>
      <line x1={left} y1={y(t.value)} x2={width - right} y2={y(t.value)} stroke="#DDE5EA" strokeWidth={2} />
      <text x={left - 14} y={y(t.value) + 8} textAnchor="end" fontSize={24} fill="#526574">{t.label}</text>
    </g>)}
    <line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke={ink} strokeWidth={3} />
    <polyline points={path} fill="none" stroke={gold} strokeWidth={6} strokeLinejoin="round" />
    {points.map((p, i) => <g key={p.label}>
      <circle cx={x(p.year)} cy={y(p.value)} r={10} fill={gold} stroke={ink} strokeWidth={3} />
      <text x={x(p.year) + (i === points.length - 1 ? 10 : 0)} y={y(p.value) + (i + 1 < points.length && x(points[i + 1].year) - x(p.year) < 150 ? -58 : -22)}
        textAnchor={i === points.length - 1 ? 'end' : 'middle'} fontSize={30} fontWeight={900} fill={ink}>{p.display}</text>
      <text x={x(p.year)} y={height - bottom + 38} textAnchor="middle" fontSize={26} fontWeight={800} fill="#526574">{p.label}</text>
    </g>)}
  </svg>;
};
