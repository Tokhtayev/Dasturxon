import React from 'react';

interface LineChartProps {
  data: number[];
}

export const RevenueLineChart: React.FC<LineChartProps> = ({ data }) => {
  const safeData = data.length >= 2 ? data : [0, data[0] ?? 0];
  const maxVal = Math.max(...safeData, 10);
  const width = 420;
  const height = 148;
  const padX = 24;
  const padY = 18;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const points = safeData.map((val, idx) => {
    const x = padX + (idx / Math.max(1, safeData.length - 1)) * usableW;
    const y = padY + usableH - (val / maxVal) * usableH;
    return { x, y, val };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
        <defs>
          <linearGradient id="dxLineArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B7500A" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#B7500A" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => {
          const y = padY + usableH * ratio;
          return (
            <line
              key={ratio}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="var(--dx-border)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}
        <path d={areaPath} fill="url(#dxLineArea)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--dx-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="5" fill="var(--dx-surface)" stroke="var(--dx-primary)" strokeWidth="2.5" />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="var(--dx-text)"
            >
              {p.val}k
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

interface DonutChartProps {
  completed: number;
  inProgress: number;
  cancelled: number;
}

export const OrderStatusDonutChart: React.FC<DonutChartProps> = ({
  completed,
  inProgress,
  cancelled,
}) => {
  const total = Math.max(1, completed + inProgress + cancelled);
  const r = 44;
  const c = 2 * Math.PI * r;

  const segments = [
    { value: completed, color: '#4C7A2B', label: 'Yakunlandi' },
    { value: inProgress, color: '#0F7C84', label: 'Jarayonda' },
    { value: cancelled, color: '#BA1A1A', label: 'Bekor' },
  ];

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--dx-surface-variant)"
            strokeWidth="14"
          />
          {segments.map((seg, i) => {
            const len = (seg.value / total) * c;
            const dashArray = `${len} ${c - len}`;
            const dashOffset = -offset;
            offset += len;
            if (seg.value <= 0) return null;
            return (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold" style={{ color: 'var(--dx-text)' }}>
            {completed + inProgress + cancelled}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--dx-muted)' }}>
            Buyurtma
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4C7A2B]" />
          Yakunlandi: {completed}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0F7C84]" />
          Jarayonda: {inProgress}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" />
          Bekor: {cancelled}
        </span>
      </div>
    </div>
  );
};
