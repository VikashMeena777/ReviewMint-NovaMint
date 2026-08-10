"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Star } from "@phosphor-icons/react";
import { formatDate } from "@/lib/utils/helpers";

const AXIS_STYLE = {
  fill: "var(--color-ink-4)",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
} as const;

/**
 * Reply volume over time. Area chart because the shape of the curve is
 * the point, not individual day values.
 */
export function ReplyTrend({
  data,
}: {
  data: { date: string; replies: number }[];
}) {
  return (
    <div className="h-[168px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
        >
          <defs>
            <linearGradient id="rm-trend" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-accent)"
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor="var(--color-accent)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="var(--color-line)"
            strokeDasharray="2 4"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value)}
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={26}
          />
          <YAxis
            allowDecimals={false}
            width={44}
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-line-3)", strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const count = Number(payload[0].value ?? 0);
              return (
                <div className="rounded-md border border-line-2 bg-surface-3 px-2.5 py-2 shadow-[var(--shadow-lg)]">
                  <p className="font-mono text-2xs text-ink-4" data-numeric>
                    {formatDate(String(label))}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-ink">
                    <span data-numeric className="font-mono">
                      {count}
                    </span>{" "}
                    {count === 1 ? "reply" : "replies"}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="replies"
            stroke="var(--color-accent)"
            strokeWidth={1.75}
            fill="url(#rm-trend)"
            dot={false}
            activeDot={{
              r: 3,
              fill: "var(--color-accent)",
              stroke: "var(--color-canvas)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Rating distribution. Hand-built bars rather than a chart library:
 * five rows of a single proportion read better as a list than as a
 * plotted axis, and it keeps the tabular alignment.
 */
export function RatingBars({
  data,
  total,
}: {
  data: { star: number; count: number }[];
  total: number;
}) {
  const peak = Math.max(...data.map((row) => row.count), 1);

  return (
    <div className="flex h-[168px] flex-col justify-between">
      {data.map(({ star, count }) => {
        const share = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-3">
            <span className="flex w-8 shrink-0 items-center gap-1 font-mono text-2xs text-ink-3">
              <span data-numeric>{star}</span>
              <Star
                size={9}
                weight="fill"
                aria-hidden="true"
                className="text-star"
              />
            </span>

            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${(count / peak) * 100}%` }}
              />
            </span>

            <span
              data-numeric
              className="w-11 shrink-0 text-right font-mono text-2xs text-ink-3"
            >
              {share}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
