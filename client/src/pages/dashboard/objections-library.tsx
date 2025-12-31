import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Search,
  Copy,
  Check,
  Filter,
  MessageSquare,
  Instagram,
  Mail,
  Clock,
  DollarSign,
  Shield,
  Users,
  Target,
  Swords,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Objection {
  id: string;
  name: string;
  content: string;
  category: string;
  intentTags: string[];
  objectionTags: string[];
  channelRestriction: string;
  usageCount: number;
  successRate: number | null;
}

interface ObjectionsResponse {
  objections: Objection[];
  categories: { id: string; name: string; count: number }[];
  total: number;
}

const categoryIcons: Record<string, typeof Clock> = {
  timing: Clock,
  price: DollarSign,
  trust: Shield,
  authority: Users,
  fit: Target,
  competitor: Swords,
  decision: CheckCircle2,
};

const categoryColors: Record<string, string> = {
  timing: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  price: "from-green-500/20 to-green-600/10 border-green-500/30",
  trust: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  authority: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  fit: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  competitor: "from-red-500/20 to-red-600/10 border-red-500/30",
  decision: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
};

function CopyButton({ objectionId, text }: { objectionId: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const trackCopy = useMutation({
    mutationFn: () => apiRequest("POST", `/api/objections/${objectionId}/copy`),
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackCopy.mutate();
      toast({ description: "Response copied! Use it in your conversation." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ description: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-3 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1.5 text-green-400" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-1.5" />
          Copy
        </>
      )}
    </Button>
  );
}

function ObjectionCard({ objection, expanded, onToggle }: { 
  objection: Objection; 
  expanded: boolean; 
  onToggle: () => void;
}) {
  const Icon = categoryIcons[objection.category] || MessageSquare;
  const colorClass = categoryColors[objection.category] || "from-gray-500/20 to-gray-600/10 border-gray-500/30";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl bg-gradient-to-br ${colorClass} rounded-xl border p-4 cursor-pointer hover:border-white/30 transition-all`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-white/10 flex-shrink-0">
            <Icon className="w-4 h-4 text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{objection.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize bg-white/5">
                {objection.category}
              </Badge>
              {objection.channelRestriction !== "all" && (
                <Badge variant="outline" className="text-xs bg-white/5">
                  {objection.channelRestriction === "instagram" ? (
                    <Instagram className="w-3 h-3 mr-1" />
                  ) : (
                    <Mail className="w-3 h-3 mr-1" />
                  )}
                  {objection.channelRestriction}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <button className="p-1 hover:bg-white/10 rounded transition-colors" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/50" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                {objection.content}
              </p>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>Used {objection.usageCount} times</span>
                  {objection.successRate !== null && (
                    <span>{Math.round(objection.successRate * 100)}% success</span>
                  )}
                </div>
                <CopyButton objectionId={objection.id} text={objection.content} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ObjectionsLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ObjectionsResponse>({
    queryKey: ["/api/objections", { category: selectedCategory !== "all" ? selectedCategory : undefined, channel: selectedChannel !== "all" ? selectedChannel : undefined, search: searchQuery || undefined }],
    refetchInterval: 30000,
  });

  const filteredObjections = useMemo(() => {
    if (!data?.objections) return [];
    let filtered = data.objections;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(obj => 
        obj.name.toLowerCase().includes(query) ||
        obj.content.toLowerCase().includes(query) ||
        obj.objectionTags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [data?.objections, searchQuery]);

  const categories = [
    { id: "all", name: "All", count: data?.total || 0 },
    ...(data?.categories || []),
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            Objections Library
          </h1>
          <p className="text-white/60 mt-1">
            110+ proven responses for Email, Instagram, and manual copy-paste
          </p>
        </div>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          {data?.total || 0} Responses
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search objections... (e.g., 'too expensive', 'need to think')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex gap-2">
          <Tabs value={selectedChannel} onValueChange={setSelectedChannel}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-white/10">All</TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-white/10">
                <Mail className="w-4 h-4 mr-1" />
                Email
              </TabsTrigger>
              <TabsTrigger value="instagram" className="data-[state=active]:bg-white/10">
                <Instagram className="w-4 h-4 mr-1" />
                Instagram
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.id] || Filter;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id 
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30" 
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              }
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {cat.name}
              <span className="ml-1.5 text-xs opacity-60">({cat.count})</span>
            </Button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : filteredObjections.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/80">No objections found</h3>
            <p className="text-white/50 mt-1">Try a different search or category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredObjections.map((objection) => (
            <ObjectionCard
              key={objection.id}
              objection={objection}
              expanded={expandedId === objection.id}
              onToggle={() => setExpandedId(expandedId === objection.id ? null : objection.id)}
            />
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">AI Objection Analyzer</h3>
                <p className="text-sm text-white/60">Paste any objection and get an instant reframe</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              onClick={() => window.location.href = "/dashboard/sales-assistant"}
            >
              Try It
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
