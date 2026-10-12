import { format } from '../../domain/zoned'
import { forwardRef, useMemo, useState } from 'react'
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
  type XAxisTickContentProps,
} from 'recharts'
import { formatHM } from '../../domain/time'
import { useI18n } from '../../i18n'
import { axisLabelPlan, isLabeledBar, type BreakdownRow, type Bucket, type Granularity } from './stats'

const HOUR = 3_600_000
// Mid-gray axis colors stay readable on light, dark and the white PDF background.
const AXIS = '#8b93a0'
const GRID = 'rgba(139, 147, 160, 0.25)'
const MARGIN = { top: 8, right: 8, left: 0, bottom: 0 }
const Y_AXIS_WIDTH = 48


export const HoursBarChart = forwardRef<
  HTMLDivElement,
  { buckets: Bucket[]; projects: BreakdownRow[]; granularity: Granularity }
>(function HoursBarChart({ buckets, projects, granularity }, ref) {
  const { t, locale } = useI18n()
  const data = useMemo(
    () =>
      buckets.map((b) => ({
        label:
          granularity === 'month'
            ? format(b.start, 'MMM yy', { locale })
            : granularity === 'week'
              ? format(b.start, 'd MMM', { locale })
              : buckets.length <= 14
                ? format(b.start, 'EEE d', { locale })
                : format(b.start, 'd.M.', { locale }),
        title:
          granularity === 'month'
            ? format(b.start, 'MMMM yyyy', { locale })
            : granularity === 'week'
              ? t('stats.week', { date: format(b.start, 'PP', { locale }) })
              : format(b.start, 'EEEE, PP', { locale }),
        day: format(b.start, 'd', { locale }),
        weekday: format(b.start, 'EEEEE', { locale }),
        ...Object.fromEntries(Object.entries(b.byProject).map(([k, ms]) => [k, ms / HOUR])),
      })),
    [buckets, granularity, locale, t],
  )
  const names = useMemo(() => new Map(projects.map((p) => [p.key, p.label])), [projects])

  // Recharts would silently drop labels that don't fit, so we decide which bars get one.
  const [width, setWidth] = useState<number | null>(null)
  const plotWidth = width === null ? null : width - Y_AXIS_WIDTH - MARGIN.left - MARGIN.right
  const labelChars = Math.max(0, ...data.map((d) => d.label.length))
  const plan = axisLabelPlan(plotWidth, data.length, granularity, labelChars)
  const short = plan.format === 'short'
  const renderTick = ({ x, y, index, payload }: XAxisTickContentProps) => {
    const d = data[index]
    if (!d || !isLabeledBar(index, data.length, plan.step)) return <g />
    // On a thinned axis the bars are narrower than the label: end the last one at the plot edge.
    const atEnd = plan.step > 1 && index === data.length - 1 && plotWidth
    const tx = atEnd ? Number(x) + plotWidth / data.length / 2 : x
    return (
      <text x={tx} y={y} textAnchor={atEnd ? 'end' : 'middle'} fill={AXIS} fontSize={short ? 11 : 12}>
        {short ? (
          <>
            <tspan x={x} dy="0.71em">
              {d.day}
            </tspan>
            <tspan x={x} dy="1.25em" opacity={0.75}>
              {d.weekday}
            </tspan>
          </>
        ) : (
          <tspan x={tx} dy="0.71em">
            {String(payload.value)}
          </tspan>
        )}
      </text>
    )
  }

  return (
    <div className="chart-box" ref={ref}>
      <ResponsiveContainer width="100%" height="100%" onResize={(w) => setWidth(w)}>
        <BarChart data={data} margin={MARGIN}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tick={renderTick}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval={0}
            height={short ? 38 : 30}
          />
          <YAxis
            width={Y_AXIS_WIDTH}
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
