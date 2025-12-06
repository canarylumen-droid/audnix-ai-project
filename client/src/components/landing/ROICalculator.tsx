import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calculator, TrendingUp, DollarSign, Users, ArrowRight, Zap } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function ROICalculator() {
  const [leadsPerMonth, setLeadsPerMonth] = useState(100);
  const [avgDealValue, setAvgDealValue] = useState(500);
  
  const calculations = useMemo(() => {
    const industryConversionRate = 0.02;
    const audnixConversionRate = 0.18;
    
    const manualClosedDeals = Math.round(leadsPerMonth * industryConversionRate);
    const audnixClosedDeals = Math.round(leadsPerMonth * audnixConversionRate);
    
    const manualRevenue = manualClosedDeals * avgDealValue;
    const audnixRevenue = audnixClosedDeals * avgDealValue;
    
    const additionalRevenue = audnixRevenue - manualRevenue;
    const multiplier = manualRevenue > 0 ? (audnixRevenue / manualRevenue).toFixed(1) : "9";
    
    return {
      manualClosedDeals,
      audnixClosedDeals,
      manualRevenue,
      audnixRevenue,
      additionalRevenue,
      multiplier
    };
  }, [leadsPerMonth, avgDealValue]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-5xl mx-auto relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Calculator className="w-3 h-3 mr-1" />
            Revenue Calculator
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            See Your Revenue with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              AI Intelligence
            </span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Our AI learns each lead's behavior and only reaches out when they're ready to buy.
            Most creators see 8-12x more conversions.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Calculate Your Revenue Potential
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-white/80 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Warm leads per month
                      </label>
                      <span className="text-2xl font-bold text-white">{leadsPerMonth}</span>
                    </div>
                    <Slider
                      value={[leadsPerMonth]}
                      onValueChange={([val]) => setLeadsPerMonth(val)}
                      min={50}
                      max={1000}
                      step={50}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/50">
                      <span>50</span>
                      <span>1,000</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-white/80 font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        Average deal value
                      </label>
                      <span className="text-2xl font-bold text-white">${avgDealValue}</span>
                    </div>
                    <Slider
                      value={[avgDealValue]}
                      onValueChange={([val]) => setAvgDealValue(val)}
                      min={100}
                      max={5000}
                      step={100}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/50">
                      <span>$100</span>
                      <span>$5,000</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm font-medium mb-1">Without AI (2% industry avg)</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{formatCurrency(calculations.manualRevenue)}</span>
                      <span className="text-white/50">/month</span>
                    </div>
                    <p className="text-white/50 text-sm mt-1">{calculations.manualClosedDeals} deals closed</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-emerald-400 text-sm font-medium">With Audnix AI (18% conversion)</p>
                      <Badge className="bg-emerald-500 text-white">{calculations.multiplier}x</Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                        {formatCurrency(calculations.audnixRevenue)}
                      </span>
                      <span className="text-white/50">/month</span>
                    </div>
                    <p className="text-white/50 text-sm mt-1">{calculations.audnixClosedDeals} deals closed</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-white/70 text-sm">Additional revenue</p>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xl font-bold text-emerald-400">
                          +{formatCurrency(calculations.additionalRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-white/60 text-sm text-center sm:text-left">
                    Based on AI that predicts optimal timing, handles objections, and only follows up when leads are ready to buy.
                  </p>
                  <Link href="/auth">
                    <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 py-6 rounded-full group whitespace-nowrap">
                      Start Closing More Deals
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-white/50 text-sm">
            Why 8-12x? Our AI learns from every conversation. It knows when leads open emails, 
            what objections they have, and the exact moment they're ready to buy.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
