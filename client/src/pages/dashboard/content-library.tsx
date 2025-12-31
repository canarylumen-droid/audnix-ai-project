import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Video, 
  Link2, 
  Plus,
  Trash2,
  Loader2,
  Edit2,
  Tag,
  MessageSquare
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: string;
  contentType: string;
  name: string;
  content: string;
  intentTags: string[];
  channel: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

const CONTENT_TYPES = [
  { value: 'reply_template', label: 'Reply Template', icon: MessageSquare },
  { value: 'cta', label: 'Call to Action', icon: Link2 },
  { value: 'video', label: 'Video Asset', icon: Video },
  { value: 'script', label: 'Script', icon: FileText },
];

const INTENT_TAGS = [
  'interested',
  'objection',
  'ready_to_buy',
  'needs_info',
  'cold',
  're_engage',
  'pricing_question',
  'booking_ready',
];

const CHANNELS = [
  { value: 'all', label: 'All Channels' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'email', label: 'Email' },
];

export default function ContentLibraryPage() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('reply_template');
  const [newContent, setNewContent] = useState({
    contentType: 'reply_template',
    name: '',
    content: '',
    channel: 'all',
    intentTags: [] as string[],
  });

  const { data: contentItems, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/automation/content'],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newContent) => {
      return apiRequest('POST', '/api/automation/content', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/content'] });
      setShowCreateDialog(false);
      setNewContent({
        contentType: 'reply_template',
        name: '',
        content: '',
        channel: 'all',
        intentTags: [],
      });
      toast({ title: 'Content added', description: 'Your content has been saved to the library.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save content.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/automation/content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/content'] });
      toast({ title: 'Content deleted' });
    },
  });

  const toggleTag = (tag: string) => {
    const current = newContent.intentTags;
    if (current.includes(tag)) {
      setNewContent({ ...newContent, intentTags: current.filter(t => t !== tag) });
    } else {
      setNewContent({ ...newContent, intentTags: [...current, tag] });
    }
  };

  const filteredContent = contentItems?.filter(item => item.contentType === activeTab) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Content Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Store templates, videos, and CTAs that AI can choose from based on intent
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Content to Library</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select
                    value={newContent.contentType}
                    onValueChange={(value) => setNewContent({ ...newContent, contentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select
                    value={newContent.channel}
                    onValueChange={(value) => setNewContent({ ...newContent, channel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((ch) => (
                        <SelectItem key={ch.value} value={ch.value}>
                          {ch.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Pricing Objection Response"
                  value={newContent.name}
                  onChange={(e) => setNewContent({ ...newContent, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  placeholder="Enter your template, script, or CTA link..."
                  value={newContent.content}
                  onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Intent Tags (AI uses these to select content)</Label>
                <div className="flex flex-wrap gap-2">
                  {INTENT_TAGS.map((tag) => {
                    const isSelected = newContent.intentTags.includes(tag);
                    return (
                      <Badge
                        key={tag}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createMutation.mutate(newContent)}
                  disabled={!newContent.name || !newContent.content || createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Tag className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold">Intent-Based Content Selection</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI automatically selects the best content from your library based on lead intent signals. 
                Tag your content with intent labels so AI knows when to use each piece.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {CONTENT_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value} className="gap-2">
              <type.icon className="h-4 w-4" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CONTENT_TYPES.map((type) => (
          <TabsContent key={type.value} value={type.value} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredContent.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <type.icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No {type.label}s Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first {type.label.toLowerCase()} to the library
                  </p>
                  <Button onClick={() => {
                    setNewContent({ ...newContent, contentType: type.value });
                    setShowCreateDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {type.label}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredContent.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onDelete={() => deleteMutation.mutate(item.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ContentCard({
  item,
  onDelete,
}: {
  item: ContentItem;
  onDelete: () => void;
}) {
  const typeInfo = CONTENT_TYPES.find(t => t.value === item.contentType);
  const TypeIcon = typeInfo?.icon || FileText;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TypeIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.content}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {item.channel === 'all' ? 'All Channels' : item.channel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Used {item.usageCount || 0} times
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.intentTags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Edit2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
