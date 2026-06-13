"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — Chart Components (Recharts)
// Bar, Line, Pie, Area chart wrappers with dark-mode tokens
// ─────────────────────────────────────────────────────────────────────────────

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Shared Design Tokens ─────────────────────────────────────────────────────

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const AXIS_STYLE = {
  fontSize: 11,
  fill: "var(--color-muted-foreground)",
  fontFamily: "inherit",
};

const GRID_COLOR = "var(--color-border)";

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--color-foreground)",
};

// ─── BarChartComponent ────────────────────────────────────────────────────────

interface BarChartData {
  [key: string]: string | number;
}

interface BarChartComponentProps {
  data: BarChartData[];
  dataKeys: string[];
  xKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
}

export function BarChartComponent({
  data,
  dataKeys,
  xKey = "label",
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = false,
}: BarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xKey}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
        />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {dataKeys.map((key, idx) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[idx % colors.length]}
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── LineChartComponent ───────────────────────────────────────────────────────

interface LineChartComponentProps {
  data: BarChartData[];
  dataKeys: string[];
  xKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  curved?: boolean;
}

export function LineChartComponent({
  data,
  dataKeys,
  xKey = "label",
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = false,
  curved = true,
}: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xKey}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {dataKeys.map((key, idx) => (
          <Line
            key={key}
            type={curved ? "monotone" : "linear"}
            dataKey={key}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── PieChartComponent ────────────────────────────────────────────────────────

interface PieChartEntry {
  name: string;
  value: number;
  fill?: string;
}

interface PieChartComponentProps {
  data: PieChartEntry[];
  innerRadius?: number;
  showLegend?: boolean;
}

export function PieChartComponent({
  data,
  innerRadius = 60,
  showLegend = true,
}: PieChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={innerRadius + 36}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, idx) => (
            <Cell
              key={`cell-${idx}`}
              fill={entry.fill ?? CHART_COLORS[idx % CHART_COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        {showLegend && (
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── AreaChartComponent ───────────────────────────────────────────────────────

interface AreaChartComponentProps {
  data: BarChartData[];
  dataKeys: string[];
  xKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
}

export function AreaChartComponent({
  data,
  dataKeys,
  xKey = "label",
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = false,
}: AreaChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <defs>
          {dataKeys.map((key, idx) => (
            <linearGradient
              key={key}
              id={`gradient-${key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={colors[idx % colors.length]}
                stopOpacity={0.25}
              />
              <stop
                offset="95%"
                stopColor={colors[idx % colors.length]}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xKey}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {dataKeys.map((key, idx) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            fill={`url(#gradient-${key})`}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
