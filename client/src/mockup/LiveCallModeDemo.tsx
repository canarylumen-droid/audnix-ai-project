import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ActivationModal, 
  TranscriptPanel, 
  AIResponsePanel, 
  ContextPanel, 
  SummaryModal,
  LiveCallView 
} from "./live-call-mode";
import { 
  Play, FileText, Sparkles, Target, CheckCircle, Layout, 
  ChevronLeft, ChevronRight 
} from "lucide-react";

type TabId = "activation" | "transcript" | "ai-response" | "context" | "summary" | "full-view";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "activation", label: "Activation", icon: <Play className="w-4 h-4" />, component: <ActivationModal /> },
  { id: "full-view", label: "Live Call", icon: <Layout className="w-4 h-4" />, component: <LiveCallView /> },
  { id: "transcript", label: "Transcript", icon: <FileText className="w-4 h-4" />, component: <TranscriptPanel /> },
  { id: "ai-response", label: "AI Response", icon: <Sparkles className="w-4 h-4" />, component: <AIResponsePanel /> },
  { id: "context", label: "Context", icon: <Target className="w-4 h-4" />, component: <ContextPanel /> },
  { id: "summary", label: "Summary", icon: <CheckCircle className="w-4 h-4" />, component: <SummaryModal /> },
];

export function LiveCallModeDemo() {
  const [activeTab, setActiveTab] = useState<TabId>("full-view");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
  const currentTab = tabs[currentTabIndex];

  const goToNext = () => {
    const nextIndex = (currentTabIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  };

  const goToPrev = () => {
    const prevIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[prevIndex].id);
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : 240 }}
        className="flex-shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col"
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-white font-bold">Audnix AI</h1>
                <p className="text-slate-500 text-xs">Live Call Mode Demo</p>
              </motion.div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                ${activeTab === tab.id 
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                }
              `}
            >
              {tab.icon}
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  {tab.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-auto"
          >
            {currentTab.component}
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-lg border border-slate-700/50 shadow-2xl">
          <button
            onClick={goToPrev}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentTabIndex 
                    ? 'w-6 bg-teal-500' 
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goToNext}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-slate-700" />

          <span className="text-slate-400 text-sm">
            {currentTabIndex + 1} / {tabs.length}
          </span>
        </div>
      </main>
    </div>
  );
}

export default LiveCallModeDemo;
