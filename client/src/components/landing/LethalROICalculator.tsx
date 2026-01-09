import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Link } from "wouter";
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign, Zap, ArrowRight, Cpu, Activity } from "lucide-react";

const presets = {
  creator: { leads: 500, dealValue: 150, closeRate: 2 },
  agency: { leads: 2000, dealValue: 500, closeRate: 3 },
  power: { leads: 5000, dealValue: 1000, closeRate: 4 },
};

type RecoveryModel = "conservative" | "realistic" | "optimistic";

export function LethalROICalculator() {
  const [leads, setLeads] = useState(500);
  const [dealValue, setDealValue] = useState(150);
  const [closeRate, setCloseRate] = useState(2);
  const [recoveryModel, setRecoveryModel] = useState<RecoveryModel>("realistic");

  const calculations = useMemo(() => {
    const optimalCloseRate = 0.18;
    const currentCloseDecimal = closeRate / 100;

    const currentDeals = Math.round(leads * currentCloseDecimal);
    const potentialDeals = Math.round(leads * optimalCloseRate);
    const lostDeals = Math.max(0, potentialDeals - currentDeals);
    const lostRevenue = lostDeals * dealValue;

    let recoveredDeals = 0;
    switch (recoveryModel) {
      case "conservative": recoveredDeals = Math.round(lostDeals * 0.27); break;
      case "realistic": recoveredDeals = Math.round(lostDeals * 0.55); break;
      case "optimistic": recoveredDeals = Math.round(lostDeals * 0.85); break;
    }
    const recoveredRevenue = recoveredDeals * dealValue;

    return { lostRevenue, recoveredRevenue, lostDeals, recoveredDeals };
  }, [leads, dealValue, closeRate, recoveryModel]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section id="calc" className="py-40 px-4 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-grid opacity-10 mask-radial" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12"
          >
            <AlertTriangle className="w-4 h-4" />
            Revenue Leakage Protocol
          </motion.div>
          <h2 className="text-6xl md:text-[8.5rem] font-black tracking-[-0.05em] leading-[0.85] text-white italic mb-12 uppercase">
            COST OF <br />
            <span className="text-red-500 not-italic tracking-[-0.08em]">INACTION.</span>
          </h2>
          <p className="text-white/40 text-2xl md:text-3xl max-w-3xl mx-auto font-medium tracking-tight italic">
            Every minute an inbound lead waits is capital vanishing from your ecosystem. <span className="text-white">Audnix eliminates the latency.</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Controls - Span 5 */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-10">
            <div className="glass-card p-12 rounded-[4rem] border-white/5 space-y-12 shadow-2xl relative overflow-hidden group perspective-tilt">
              <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />

              <div className="space-y-6">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.3em] text-white/30">
                  <Label className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-primary" />
                    Inbound Volume
                  </Label>
                  <span className="text-lg text-white italic font-black">{leads.toLocaleString()} / mo</span>
                </div>
                <Slider value={[leads]} onValueChange={(v) => setLeads(v[0])} min={50} max={10000} step={50} />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.3em] text-white/30">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-primary" />
                    Avg Deal Size
                  </Label>
                  <span className="text-lg text-white italic font-black">${dealValue}</span>
                </div>
                <Slider value={[dealValue]} onValueChange={(v) => setDealValue(v[0])} min={50} max={10000} step={50} />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-[0.3em] text-white/30">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" />
                    Human Close Rate
                  </Label>
                  <span className="text-lg text-white italic font-black">{closeRate}%</span>
                </div>
                <Slider value={[closeRate]} onValueChange={(v) => setCloseRate(v[0])} min={1} max={30} step={1} />
              </div>

              <div className="flex flex-wrap gap-3 pt-6">
                {Object.keys(presets).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      const preset = presets[p as keyof typeof presets];
                      setLeads(preset.leads); setDealValue(preset.dealValue); setCloseRate(preset.closeRate);
                    }}
                    className="px-6 py-2 rounded-full border border-white/10 text-[10px] uppercase font-black tracking-widest text-white/30 hover:text-white hover:bg-white/10 transition-all italic"
                  >
                    {p}.preset
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results - Span 7 */}
          <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div layout className="glass-card p-12 rounded-[4rem] border-red-500/20 bg-red-500/[0.03] flex flex-col justify-between group premium-glow">
              <div>
                <div className="w-16 h-16 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 mb-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                  <TrendingDown className="w-8 h-8" />
                </div>
                <p className="text-red-500/60 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Unrealized Revenue Leak</p>
                <h3 className="text-6xl md:text-8xl font-black text-white tracking-[-0.05em] mb-8 leading-none italic uppercase">
                  {formatCurrency(calculations.lostRevenue)}
                </h3>
              </div>
              <p className="text-white/30 text-base font-bold italic leading-relaxed">
                This capital is lost to <span className="text-red-500">Human Latency</span>. {calculations.lostDeals} potential units exit your pipeline monthly while you sleep.
              </p>
            </motion.div>

            <motion.div layout className="glass-card p-12 rounded-[4rem] border-primary/20 bg-primary/[0.03] flex flex-col justify-between group premium-glow relative overflow-hidden">
              <div className="absolute top-8 right-8 flex gap-2 z-10">
                {(["conservative", "realistic", "optimistic"] as RecoveryModel[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRecoveryModel(m)}
                    className={`w-3 h-3 rounded-full transition-all ${recoveryModel === m ? "bg-primary w-8 shadow-[0_0_15px_rgba(34,211,238,0.8)]" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <div>
                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-10 shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Audnix Recovery Protocol</p>
                <h3 className="text-6xl md:text-8xl font-black text-white tracking-[-0.05em] mb-8 leading-none italic uppercase">
                  {formatCurrency(calculations.recoveredRevenue)}
                </h3>
              </div>
              <p className="text-white/30 text-base font-bold italic leading-relaxed">
                Applying a <span className="text-primary">{recoveryModel} model</span>, Audnix recaptures {calculations.recoveredDeals} lost units via neural engagement logs.
              </p>
            </motion.div>

            {/* CTA Bar */}
            <div className="md:col-span-2 glass-card p-10 rounded-[4rem] border-white/5 flex flex-col xl:flex-row items-center justify-between gap-10 group relative overflow-hidden">
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent bottom-0" />
              <div className="flex flex-wrap justify-center xl:justify-start gap-12">
                <div className="text-center xl:text-left px-8 border-r border-white/5">
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-3 italic">Protocol ROI</p>
                  <p className="text-4xl font-black text-white tracking-tighter italic">{Math.round(calculations.recoveredRevenue / 99)}x</p>
                </div>
                <div className="text-center xl:text-left">
                  <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-3 italic">Efficiency Yield</p>
                  <div className="flex items-center gap-4">
                    <Cpu className="w-6 h-6 text-primary animate-pulse" />
                    <p className="text-5xl font-black text-white italic tracking-tighter">
                      {Math.round((calculations.recoveredRevenue / 199) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/auth">
                <Button className="h-24 px-16 rounded-[2.5rem] bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-700 shadow-[0_40px_80px_-20px_rgba(255,255,255,0.2)] overflow-hidden">
                  <span className="relative z-10 flex items-center gap-3">
                    Execute Recovery Protocol
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  <div className="absolute top-0 -inset-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent rotate-12 group-hover:animate-shimmer" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
