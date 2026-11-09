import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

function WeeklyChart({ data }) {
  return <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barCategoryGap="32%">
      <CartesianGrid vertical={false} stroke="var(--line-soft)" strokeDasharray="3 5" />
      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} dy={10} />
      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} />
      <Tooltip cursor={{ fill: 'var(--chart-hover)' }} contentStyle={{ borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 12 }} />
      <Bar dataKey="completed" name="Completed" fill="var(--green)" radius={[5, 5, 1, 1]} maxBarSize={28} />
    </BarChart>
  </ResponsiveContainer>
}

export default WeeklyChart