"use client"

import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Area, AreaChart } from "recharts"

export function LazyLineChart({ data, dataKey, stroke = "#8884d8", height = 300 }: {
  data: any[]
  dataKey: string
  stroke?: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey={dataKey}
          stroke={stroke}
          strokeWidth={2}
          dot={{ fill: stroke, strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function LazyBarChart({ data, dataKey, fill = "#8884d8", height = 300 }: {
  data: any[]
  dataKey: string
  fill?: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function LazyAreaChart({ data, dataKey, fill = "#8884d8", height = 300 }: {
  data: any[]
  dataKey: string
  fill?: string
  height?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area 
          type="monotone" 
          dataKey={dataKey}
          stroke={fill}
          fill={fill}
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}