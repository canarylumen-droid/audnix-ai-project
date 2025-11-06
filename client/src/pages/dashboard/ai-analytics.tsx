
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, MessageCircle, ThumbsUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AIAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Performance</h1>
        <p className="text-muted-foreground">How well is your AI converting leads?</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Response Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <Progress value={94} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Contextually relevant replies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <Progress value={23} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              AI conversations → sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2m</div>
            <p className="text-xs text-muted-foreground mt-2">
              Human-like timing maintained
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-yellow-500" />
              Lead Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.7/5</div>
            <Progress value={94} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Based on conversation sentiment
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
