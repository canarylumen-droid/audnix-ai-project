import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface TrendData {
  date: string;
  score: number;
  bounces: number;
}

interface ReputationTrendChartProps {
  data: TrendData[];
}

export const ReputationTrendChart: React.FC<ReputationTrendChartProps> = ({ data }) => {
  return (
    <Card className="border-none bg-slate-900/40 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-emerald-400" />
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-200">
            Reputation Trend
          </CardTitle>
        </div>
        <CardDescription className="text-[10px] text-slate-500 font-medium">
          7-Day Health Analytics (Score vs Time)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
              />
              <YAxis 
                hide 
                domain={[0, 100]} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorScore)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
          <div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-0.5">Current Avg</div>
            <div className="text-xl font-black text-emerald-400 leading-none">
              {data.length > 0 ? Math.round(data[data.length-1].score) : 100}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-0.5">Weekly Bounces</div>
            <div className="text-xl font-black text-slate-300 leading-none">
              {data.reduce((sum, d) => sum + d.bounces, 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
