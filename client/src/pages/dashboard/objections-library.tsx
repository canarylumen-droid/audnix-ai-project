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
  ArrowRight,
  ShieldAlert,
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

const CATEGORY_STYLES: Record<string, string> = {
  price: "border-primary/20 bg-primary/5 text-primary",
  fit: "border-purple-500/20 bg-purple-500/5 text-purple-500",
  timing: "border-primary/20 bg-primary/5 text-primary",
  generic: "border-white/5 bg-white/5 text-white/40",
};

// Helper function for copying text
function copyToClipboard(text: string, type: string, toast: any) {
  navigator.clipboard.writeText(text)
    .then(() => {
      toast({ description: `${type} copied to clipboard!` });
    })
    .catch(err => {
      toast({ description: `Failed to copy ${type}`, variant: "destructive" });
    });
}

function ObjectionCard({ objection, index }: {
  objection: Objection;
  index: number;
}) {
  const { toast } = useToast();

  return (
    <motion.div
      key={objection.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 10 }}
    >
      <Card className={`overflow-hidden border group transition-all duration-500 hover:scale-[1.02] cursor-pointer rounded-[2rem] ${CATEGORY_STYLES[objection.category] || CATEGORY_STYLES.generic}`}>
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="font-black uppercase tracking-[0.2em] text-[10px] bg-white/5 border-white/5">
              {objection.category.toUpperCase()} PATTERN
            </Badge>
            <ShieldAlert className="h-4 w-4 opacity-20" />
          </div>
          <CardTitle className="text-xl font-black text-white uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{objection.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-4">
          <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
            <p className="text-sm font-bold text-white/80 leading-relaxed tracking-tight">{objection.content}</p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(objection.content, 'Neural Response', toast); }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-primary/20 transition-all text-white/40 hover:text-primary active:scale-90"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-primary h-auto p-0">
              Evolution Logic <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ObjectionsLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null); // This state is no longer used by ObjectionCard directly
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
            <Sparkles className="w-6 h-6 text-primary" />
            Objections Library
          </h1>
          <p className="text-white/60 mt-1">
            110+ proven responses for Email, Instagram, and manual copy-paste
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 py-1 px-3">
          {data?.total || 0} Responses
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search neural patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus:border-primary/50 transition-all font-bold tracking-tight"
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
                ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
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
          {filteredObjections.map((objection, index) => (
            <ObjectionCard
              key={objection.id}
              objection={objection}
              index={index}
            />
          ))}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 p-12 rounded-[3.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-purple-500/10 border border-primary/20 relative overflow-hidden group grayscale hover:grayscale-0 transition-all duration-1000"
      >
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full group-hover:bg-primary/10 transition-colors" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-[0.9]">
              Custom Neural <br /> <span className="text-primary">Logic Required?</span>
            </h2>
            <p className="text-white/40 font-bold max-w-md tracking-tight text-lg">
              Train your personal objection patterns into the neural core for deterministic close rates. Automated evolution active.
            </p>
          </div>
          <Button className="h-20 px-16 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
            Initialize Trainer
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
