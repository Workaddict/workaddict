import { format } from 'date-fns'
import { forwardRef, useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatHM } from '../../domain/time'
import { useI18n } from '../../i18n'
import type { BreakdownRow, Bucket, Granularity } from './stats'

const HOUR = 3_600_000
// Mid-gray axis colors stay readable on light, dark and the white PDF background.
const AXIS = '#8b93a0'
const GRID = 'rgba(139, 147, 160, 0.25)'

export const HoursBarChart = forwardRef<
  HTMLDivElement,
  { buckets: Bucket[]; projects: BreakdownRow[]; granularity: Granularity }
>(function HoursBarChart({ buckets, projects, granularity }, ref) {
  const { t, locale } = useI18n()
  const data = useMemo(
    () =>
      buckets.map((b) => ({
        label:
          granularity === 'week'
            ? format(b.start, 'd MMM', { locale })
            : buckets.length <= 14
              ? format(b.start, 'EEE d', { locale })
              : format(b.start, 'd.M.', { locale }),
        title:
          granularity === 'week'
            ? t('stats.week', { date: format(b.start, 'PP', { locale }) })
            : format(b.start, 'EEEE, PP', { locale }),
        ...Object.fromEntries(Object.entries(b.byProject).map(([k, ms]) => [k, ms / HOUR])),
      })),
    [buckets, granularity, locale, t],
  )
  const names = useMemo(() => new Map(projects.map((p) => [p.key, p.label])), [projects])

  return (
    <div className="chart-box" ref={ref}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tick={{ fill: AXIS, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tick={{ fill: AXIS, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={(v: number) => `${v}h`}
          />
          <Tooltip
            cursor={{ fill: GRID }}
            labelFormatter={(_l, payload) =>
              (payload?.[0]?.payload as { title?: string } | undefined)?.title ?? ''
            }
            formatter={(v, key) => [formatHM(Number(v) * HOUR), names.get(String(key)) ?? String(key)]}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 13,
            }}
          />
          {projects.map((p, i) => (
            <Bar
              key={p.key}
              dataKey={p.key}
              stackId="h"
              fill={p.color}
              isAnimationActive={false}
              radius={i === projects.length - 1 ? [3, 3, 0, 0] : undefined}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

export const ProjectShareChart = forwardRef<HTMLDivElement, { projects: BreakdownRow[] }>(
  function ProjectShareChart({ projects }, ref) {
    const data = projects.map((p) => ({ name: p.label, value: p.ms / HOUR, fill: p.color }))
    return (
      <div className="chart-box" ref={ref}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            />
            <Tooltip
              formatter={(v, name) => [formatHM(Number(v) * HOUR), String(name)]}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
              }}
              itemStyle={{ color: 'var(--text)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  },
)
