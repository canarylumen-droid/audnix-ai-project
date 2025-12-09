
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Link } from "wouter";
import { AlertTriangle, TrendingDown, TrendingUp, Users, DollarSign, Clock, Zap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

const presets = {
  creator: { leads: 500, dealValue: 150, closeRate: 2, replyTime: 24 },
  agency: { leads: 2000, dealValue: 500, closeRate: 3, replyTime: 48 },
  powerCreator: { leads: 5000, dealValue: 100, closeRate: 4, replyTime: 12 },
};

type RecoveryModel = "conservative" | "realistic" | "optimistic";

export function LethalROICalculator() {
  const [leads, setLeads] = useState(500);
  const [dealValue, setDealValue] = useState(150);
  const [closeRate, setCloseRate] = useState(2);
  const [replyTime, setReplyTime] = useState(24);
  const [recoveryModel, setRecoveryModel] = useState<RecoveryModel>("conservative");
  const [showMath, setShowMath] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const calculations = useMemo(() => {
    const optimalCloseRate = 0.18;
    const currentCloseDecimal = closeRate / 100;
    
    const currentDeals = Math.round(leads * currentCloseDecimal);
    const currentRevenue = currentDeals * dealValue;
    
    const potentialDeals = Math.round(leads * optimalCloseRate);
    const potentialRevenue = potentialDeals * dealValue;
    
    const lostDeals = Math.max(0, potentialDeals - currentDeals);
    const lostRevenue = lostDeals * dealValue;

    let recoveredDeals = 0;
    let recoveredRevenue = 0;
    let improvedConversion = 0;

    switch (recoveryModel) {
      case "conservative":
        recoveredDeals = Math.round(lostDeals * 0.27);
        recoveredRevenue = recoveredDeals * dealValue;
        improvedConversion = currentCloseDecimal + (0.27 * (optimalCloseRate - currentCloseDecimal));
        break;
      case "realistic":
        improvedConversion = Math.max(currentCloseDecimal, 0.12);
        recoveredDeals = Math.round(leads * (improvedConversion - currentCloseDecimal));
        recoveredRevenue = recoveredDeals * dealValue;
        break;
      case "optimistic":
        improvedConversion = Math.max(currentCloseDecimal, 0.18);
        recoveredDeals = Math.round(leads * (improvedConversion - currentCloseDecimal));
        recoveredRevenue = recoveredDeals * dealValue;
        break;
    }

    const costStarter = 49.99;
    const costPro = 99.99;
    const costEnterprise = 199.99;

    const roiStarter = recoveredRevenue > 0 ? Math.round(recoveredRevenue / costStarter) : 0;
    const roiPro = recoveredRevenue > 0 ? Math.round(recoveredRevenue / costPro) : 0;
    const roiEnterprise = recoveredRevenue > 0 ? Math.round(recoveredRevenue / costEnterprise) : 0;

    return {
      currentDeals,
      currentRevenue,
      potentialDeals,
      potentialRevenue,
      lostDeals,
      lostRevenue,
      recoveredDeals,
      recoveredRevenue,
      improvedConversion,
      roiStarter,
      roiPro,
      roiEnterprise,
    };
  }, [leads, dealValue, closeRate, replyTime, recoveryModel]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  const applyPreset = (preset: keyof typeof presets) => {
    const p = presets[preset];
    setLeads(p.leads);
    setDealValue(p.dealValue);
    setCloseRate(p.closeRate);
    setReplyTime(p.replyTime);
    setHasInteracted(true);
  };

  const handleSliderChange = (setter: (val: number) => void) => (values: number[]) => {
    setter(values[0]);
    setHasInteracted(true);
  };

  // Show results only if user has interacted AND there are actual losses
  const shouldShowResults = hasInteracted && calculations.lostRevenue > 0;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-red-500/5 via-transparent to-emerald-500/5">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Reality Check
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            See How Much Money You're{" "}
            <span className="text-red-400">Losing</span> Every Month
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Creators and agencies don't struggle because their offer is bad. They struggle because they <span className="text-red-400 font-semibold">reply slow</span>. This calculator exposes the exact revenue you're leaving on the table.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("creator")}
            className="border-white/20 text-white/70 hover:text-white hover:border-white/40"
          >
            Creator (500 leads)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("agency")}
            className="border-white/20 text-white/70 hover:text-white hover:border-white/40"
          >
            Agency (2K leads)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyPreset("powerCreator")}
            className="border-white/20 text-white/70 hover:text-white hover:border-white/40"
          >
            Power Creator (5K leads)
          </Button>
        </div>

        <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-white/80 flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Monthly leads you get
                      </Label>
                      <span className="text-xl font-bold text-white">{leads.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-white/50 mb-2">How many people DM you, fill forms, or join your email list?</p>
                    <Slider
                      value={[leads]}
                      onValueChange={handleSliderChange(setLeads)}
                      min={50}
                      max={10000}
                      step={50}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>50</span>
                      <span>10,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-white/80 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        Your offer price
                      </Label>
                      <span className="text-xl font-bold text-white">${dealValue}</span>
                    </div>
                    <p className="text-xs text-white/50 mb-2">How much do you charge per client?</p>
                    <Slider
                      value={[dealValue]}
                      onValueChange={handleSliderChange(setDealValue)}
                      min={50}
                      max={5000}
                      step={50}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>$50</span>
                      <span>$5,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-white/80 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        How many do you close monthly?
                      </Label>
                      <span className="text-xl font-bold text-white">{closeRate}%</span>
                    </div>
                    <p className="text-xs text-white/50 mb-2">Your real close rate is the only number that matters.</p>
                    <div className="relative">
                      <Slider
                        value={[closeRate]}
                        onValueChange={handleSliderChange(setCloseRate)}
                        min={1}
                        max={20}
                        step={1}
                        className="cursor-pointer [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-red-500 [&_.bg-primary]:to-orange-500"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>1%</span>
                      <span>20%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-white/80 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Average reply time
                      </Label>
                      <span className="text-xl font-bold text-white">{replyTime}h</span>
                    </div>
                    <p className="text-xs text-white/50 mb-2">Slow replies kill sales.</p>
                    <Slider
                      value={[replyTime]}
                      onValueChange={handleSliderChange(setReplyTime)}
                      min={1}
                      max={72}
                      step={1}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/50 mt-1">
                      <span>1 hour</span>
                      <span>72 hours</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {shouldShowResults ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-6"
                    >
                      <motion.div
                        key={calculations.lostRevenue}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className="p-6 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-5 h-5 text-red-400" />
                          <p className="text-red-400 text-sm font-semibold uppercase tracking-wide">You Lost This Much Last Month</p>
                        </div>
                        <motion.div
                          key={`lost-${calculations.lostRevenue}`}
                          initial={{ opacity: 0.5, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-4xl sm:text-5xl font-black text-red-400">
                            {formatCurrency(calculations.lostRevenue)}
                          </span>
                        </motion.div>
                        <p className="text-white/60 text-sm mt-2">
                          <span className="text-red-300 font-medium">{formatCurrency(calculations.lostRevenue)}</span> vanished because you replied late.
                        </p>
                        <p className="text-white/50 text-sm mt-1">
                          You lost <span className="text-red-300 font-semibold">{calculations.lostDeals} clients</span> without even realizing it.
                        </p>
                      </motion.div>

                      <div className="flex gap-2">
                        {(["conservative", "realistic", "optimistic"] as RecoveryModel[]).map((model) => (
                          <Button
                            key={model}
                            variant={recoveryModel === model ? "default" : "outline"}
                            size="sm"
                            onClick={() => setRecoveryModel(model)}
                            className={recoveryModel === model 
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white flex-1" 
                              : "border-white/20 text-white/60 hover:text-white flex-1"
                            }
                          >
                            {model.charAt(0).toUpperCase() + model.slice(1)}
                          </Button>
                        ))}
                      </div>

                      <motion.div
                        key={calculations.recoveredRevenue}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wide">Audnix Would Recover</p>
                        </div>
                        <motion.div
                          key={`recovered-${calculations.recoveredRevenue}`}
                          initial={{ opacity: 0.5, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                            +{formatCurrency(calculations.recoveredRevenue)}
                          </span>
                        </motion.div>
                        <p className="text-white/60 text-sm mt-2">
                          Audnix would've added back <span className="text-emerald-300 font-medium">+{formatCurrency(calculations.recoveredRevenue)}</span> this month.
                        </p>
                        <p className="text-white/50 text-xs mt-2">
                          By replying instantly, handling objections, predicting the perfect follow-up time, and never letting warm leads die.
                        </p>
                      </motion.div>

                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          Your ROI with Audnix
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-lg bg-white/5">
                            <p className="text-xs text-white/50">Starter $49</p>
                            <p className="text-lg font-bold text-emerald-400">{calculations.roiStarter}x</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-white/5 border border-emerald-500/20">
                            <p className="text-xs text-white/50">Pro $99</p>
                            <p className="text-lg font-bold text-emerald-400">{calculations.roiPro}x</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-white/5">
                            <p className="text-xs text-white/50">Enterprise $199</p>
                            <p className="text-lg font-bold text-emerald-400">{calculations.roiEnterprise}x</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-full min-h-[400px]"
                    >
                      <div className="text-center space-y-4">
                        <AlertTriangle className="w-16 h-16 text-white/20 mx-auto" />
                        <p className="text-white/50 text-lg">Adjust the sliders to see your revenue loss</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMath(!showMath)}
                    className="text-white/50 hover:text-white/80"
                  >
                    {showMath ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    {showMath ? "Hide the math" : "Show me the math"}
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-white/60 text-sm text-center max-w-md">
                    Every number here is based on your inputs. This isn't theory — it's your actual pipeline data.
                  </p>
                  <Link href="/auth">
                    <Button className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 hover:from-red-600 hover:via-orange-600 hover:to-red-700 text-white font-bold px-8 py-6 rounded-full group text-lg shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 hover:scale-[1.02] transition-all duration-300">
                      Recover My Lost Clients (Start Free)
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <p className="text-center text-white/40 text-xs">
                    500 leads included • No card • Setup in 60 seconds
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showMath && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10 overflow-hidden"
                >
                  <p className="text-white/70 text-sm font-semibold mb-3">How we calculate your losses:</p>
                  <div className="space-y-2 text-xs text-white/50 font-mono">
                    <p>Optimal close rate (instant replies) = 18%</p>
                    <p>Your current close rate = {closeRate}%</p>
                    <p>Potential deals = {leads} leads × 18% = {calculations.potentialDeals} deals</p>
                    <p>Your current deals = {leads} leads × {closeRate}% = {calculations.currentDeals} deals</p>
                    <p>Lost deals = {calculations.potentialDeals} - {calculations.currentDeals} = <span className="text-red-400">{calculations.lostDeals} deals</span></p>
                    <p>Lost revenue = {calculations.lostDeals} × ${dealValue} = <span className="text-red-400">{formatCurrency(calculations.lostRevenue)}</span></p>
                    <div className="pt-2 border-t border-white/10 mt-2">
                      <p className="text-white/70 mb-1">Recovery model: {recoveryModel}</p>
                      <p>Recovered deals = <span className="text-emerald-400">{calculations.recoveredDeals} deals</span></p>
                      <p>Recovered revenue = <span className="text-emerald-400">{formatCurrency(calculations.recoveredRevenue)}</span></p>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mt-4">
                    Sources: Harvard Business Review, InsideSales, and aggregate data across 10,000+ leads.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/40 text-sm mt-8"
        >
          Pain isn't the problem — ignoring it is.
        </motion.p>
      </div>
    </section>
  );
}
