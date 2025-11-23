# NEXT 5 FEATURES TO BUILD (Quick Wins for Instant Impact)

## Priority Order: Build in This Sequence

---

## 1. ⭐ LEAD SCORING (Automated, Real-Time)

**Why First**: Every lead needs a score. This is foundational for everything else.

**What It Does**:
- Automatically scores every lead 0-100
- Scores based on: engagement velocity, reply rate, email opens, link clicks, company size, industry
- Re-calculates every hour
- Triggers workflows ("If score > 80, add to VIP sequence")
- Shows score on lead card with color (red=0-30, yellow=30-70, green=70-100)

**Implementation** (4 hours):
```typescript
// server/lib/ai/lead-scoring.ts
- calculateLeadScore(leadId) → engagementScore + companyScore + industryScore
- trackEngagementMetrics(leadId, action) → increment score when: email opened (+5), link clicked (+8), replied (+15)
- updateLeadScore() → cron job every hour
- getLeadRiskLevel() → "high value", "at risk", "cold", "hot"

// Add to database: leads table
ALTER TABLE leads ADD COLUMN score INT DEFAULT 0;
ALTER TABLE leads ADD COLUMN score_updated_at TIMESTAMP;
```

**UI** (Dashboard):
```tsx
// In lead list: Show score badge next to lead name
<LeadRow>
  <span>{lead.name}</span>
  <ScoreBadge score={lead.score} /> {/* 0-100 with color */}
</LeadRow>

// In lead detail: Score breakdown
<ScoreBreakdown>
  Engagement: 35/40 (emails opened)
  Company: 20/30 (size, revenue)
  Industry: 15/20 (target vertical)
  Activity: 10/10 (last 7 days active)
  Total: 80/100
</ScoreBreakdown>
```

**DB Query**:
```sql
-- Show leads by score (for lead list filtering)
SELECT * FROM leads WHERE score > 70 ORDER BY score DESC;
-- Show who's getting hotter
SELECT id, name, score, score_updated_at FROM leads ORDER BY score_updated_at DESC LIMIT 20;
```

---

## 2. 🏷️ LEAD TAGS & CUSTOM FIELDS

**Why Second**: Agencies need to organize leads by project, status, next action.

**What It Does**:
- Add unlimited tags to each lead (prospect, client, partner, warm, cold, demo-booked, etc.)
- Filter by tags instantly
- Bulk add/remove tags
- Suggested tags based on lead behavior
- Custom fields (text, number, dropdown, date) specific to user's business

**Implementation** (3 hours):
```typescript
// New table: lead_tags
CREATE TABLE lead_tags (
  id SERIAL PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id),
  tag_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(lead_id, tag_name)
);

// New table: custom_fields
CREATE TABLE custom_fields (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  field_name VARCHAR(100),
  field_type VARCHAR(20), -- 'text', 'number', 'dropdown', 'date'
  field_values JSONB -- for dropdown options
);

// New table: lead_custom_field_values
CREATE TABLE lead_custom_field_values (
  lead_id UUID REFERENCES leads(id),
  field_id SERIAL REFERENCES custom_fields(id),
  value VARCHAR(500)
);
```

**API Routes**:
```typescript
POST /api/leads/:id/tags → Add tag
DELETE /api/leads/:id/tags/:tagName → Remove tag
GET /api/leads?tags=prospect,warm → Filter by tags
POST /api/custom-fields → Create custom field
PUT /api/leads/:id/custom-fields → Set custom field value
```

**UI**:
```tsx
// Lead card
<LeadCard>
  <Tags>
    <Tag>prospect</Tag>
    <Tag>warm</Tag>
    <Tag>demo-booked</Tag>
    <TagInput placeholder="Add tag..." onAdd={addTag} />
  </Tags>
  <CustomFields>
    <Field label="Budget" value="$50k" editable />
    <Field label="Timeline" value="Q1 2026" editable />
  </CustomFields>
</LeadCard>

// Bulk tagging
<BulkTagging>
  Select: [50 leads selected]
  <Button>Add Tag "VIP"</Button>
</BulkTagging>
```

---

## 3. 📧 EMAIL TEMPLATE LIBRARY (200+ Pre-Built)

**Why Third**: Agencies need fast access to proven templates, reduces decision fatigue.

**What It Does**:
- 200+ pre-built email templates (real estate, agency, coaching, creator, B2B)
- Filter by industry, use case (cold outreach, follow-up, re-engagement, objection response)
- 1-click personalization with variables
- Save custom templates
- Track which templates perform best

**Implementation** (2 hours):
```typescript
// Seed database with templates
// server/seeds/email-templates.json
[
  {
    name: "Agency Cold Outreach #1",
    industry: "agency",
    useCase: "cold_outreach",
    subject: "Quick question about {{COMPANY}}",
    body: `Hi {{FIRST_NAME}},

I help agencies like {{COMPANY}} reduce their lead time by 40% through smart automation.

Quick question - are you currently doing any cold outreach?

Talk soon,
{{SENDER_NAME}}`,
    performance: { openRate: 0.35, replyRate: 0.12 }
  },
  // 199 more...
]

// Create templates table if needed
// Usually, this is just seeded data

// API: GET /api/templates?industry=agency&useCase=cold_outreach
// API: GET /api/templates/:id (with stats)
// API: POST /api/templates (save custom)
```

**UI**:
```tsx
// In sequence builder
<SequenceStep>
  <Button>Choose Template</Button>
  <TemplateLibraryModal>
    <FilterBy industry="agency" useCase="cold" />
    <TemplateCards>
      {templates.map(t => (
        <TemplateCard 
          title={t.name}
          openRate={t.performance.openRate}
          replyRate={t.performance.replyRate}
          onSelect={useTemplate}
        />
      ))}
    </TemplateCards>
  </TemplateLibraryModal>
</SequenceStep>

// Template preview with variables
<TemplatePreview>
  Subject: Quick question about {{COMPANY}} 
  Body shows personalization hints
  <Input placeholder="First Name" />
  <Input placeholder="Company" />
  <Preview /> {/* Live preview updates */}
</TemplatePreview>
```

---

## 4. 🔄 CUSTOM AUTOMATION WORKFLOWS (Drag-Drop Builder)

**Why Fourth**: This is where magic happens. Every agency needs custom flows.

**What It Does**:
- Visual drag-drop workflow builder
- Triggers: lead scored X+, email opened, link clicked, no reply X days, form filled
- Actions: send email, add tag, change status, add to sequence, webhook call
- Conditions: IF/AND/OR logic
- Time-based delays: "wait 2 hours", "wait until Tuesday 9 AM"
- Multi-branch logic: route leads to different paths based on conditions

**Implementation** (5 hours):
```typescript
// Workflow schema
interface Workflow {
  id: string;
  userId: string;
  name: string; // "Hot lead auto-follow-up"
  trigger: {
    type: 'lead_scored' | 'email_opened' | 'link_clicked' | 'no_reply' | 'form_filled';
    config: Record<string, any>; // e.g., { score: 80, days: 3 }
  };
  steps: WorkflowStep[];
  active: boolean;
}

interface WorkflowStep {
  id: string;
  type: 'action' | 'condition' | 'delay' | 'webhook';
  config: any;
  nextStepId?: string; // for linear flow
  branches?: { condition: string; steps: WorkflowStep[] }[]; // for branching
}

// Database
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(200),
  trigger JSONB,
  steps JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

// Execution engine
export async function executeWorkflow(workflowId, leadId) {
  const workflow = await getWorkflow(workflowId);
  for (const step of workflow.steps) {
    if (step.type === 'action') {
      await executeAction(step, leadId);
    } else if (step.type === 'delay') {
      await delay(step.config.ms);
    } else if (step.type === 'condition') {
      if (evaluateCondition(step, leadId)) {
        await executeStep(step.branchTrue, leadId);
      } else {
        await executeStep(step.branchFalse, leadId);
      }
    }
  }
}
```

**UI** (React Flow):
```tsx
// Workflow canvas with nodes
<WorkflowBuilder>
  <Canvas>
    <Node type="trigger" label="Lead Score > 80" onConnect={connectNode} />
    <Node type="delay" label="Wait 2 hours" />
    <Node type="action" label="Send Email" />
    <Node type="condition" label="Did they reply?" />
    <Node type="action" label="Add tag: Interested" />
  </Canvas>
  <SaveButton onClick={saveWorkflow} />
</WorkflowBuilder>

// Trigger selector
<TriggerSelector>
  <Option value="lead_scored">Lead Score Reaches</Option>
  <Input type="number" placeholder="80" />
  
  <Option value="email_opened">Email Opened</Option>
  <Option value="link_clicked">Link Clicked</Option>
  <Option value="no_reply">No Reply For</Option>
  <Input type="number" placeholder="3" /> <Select><option>Days</option></Select>
</TriggerSelector>

// Action selector
<ActionSelector>
  <Option>Send Email</Option>
  <Option>Add Tag</Option>
  <Option>Change Status</Option>
  <Option>Add to Sequence</Option>
  <Option>Call Webhook</Option>
  <Option>Send Slack Message</Option>
</ActionSelector>
```

---

## 5. 📊 CAMPAIGN ANALYTICS DASHBOARD

**Why Fifth**: Agencies live by metrics. Give them crystal-clear performance data.

**What It Does**:
- Real-time campaign metrics: sent, delivered, opened, clicked, replied, converted
- Funnel view: shows drop-off at each stage
- Performance by sequence: which sequences convert best
- Performance by day: when do conversions happen (day 1, 2, 5, etc.)
- Benchmarks: compare against industry average
- Export to PDF/CSV

**Implementation** (4 hours):
```typescript
// Analytics queries
export async function getCampaignMetrics(campaignId: string) {
  return {
    sent: countWhere('messages', { campaign_id, direction: 'outbound' }),
    delivered: countWhere('messages', { campaign_id, direction: 'outbound', status: 'delivered' }),
    opened: countWhere('messages', { campaign_id, opened_at: { $ne: null } }),
    clicked: countWhere('message_clicks', { campaign_id }),
    replied: countWhere('messages', { campaign_id, direction: 'inbound' }),
    converted: countWhere('leads', { campaign_id, status: 'converted' }),
  };
}

export async function getConversionFunnel(campaignId: string) {
  return [
    { stage: 'Sent', count: 1000 },
    { stage: 'Delivered', count: 980 },
    { stage: 'Opened', count: 350 },
    { stage: 'Clicked', count: 85 },
    { stage: 'Replied', count: 45 },
    { stage: 'Converted', count: 12 },
  ];
}

export async function getPerformanceBySequence(userId: string) {
  // Group by sequence, calculate rate for each
  return sequences.map(seq => ({
    name: seq.name,
    replyRate: totalReplies / totalSent,
    conversionRate: totalConverted / totalSent,
    avgDealValue: totalRevenue / totalConverted,
  }));
}

export async function getPerformanceByDay(campaignId: string) {
  // Day 1, 2, 3, 5, 7 performance
  return {
    day1: { opened: 35%, clicked: 8%, replied: 2% },
    day2: { opened: 18%, clicked: 4%, replied: 1% },
    day5: { opened: 12%, clicked: 3%, replied: 0.5% },
    day7: { opened: 8%, clicked: 2%, replied: 0.3% },
  };
}
```

**UI**:
```tsx
<AnalyticsDashboard>
  <MetricsRow>
    <Metric label="Sent" value="1,000" />
    <Metric label="Delivered" value="980" />
    <Metric label="Opened" value="350" onChange="35%" />
    <Metric label="Clicked" value="85" onChange="8.5%" />
    <Metric label="Replied" value="45" onChange="4.5%" />
    <Metric label="Converted" value="12" onChange="1.2%" />
  </MetricsRow>

  <FunnelChart 
    data={conversionFunnel}
    layout="vertical"
  />

  <PerformanceBySequenceTable
    sequences={[
      { name: "Cold Outreach", replyRate: "4.5%", conversionRate: "1.2%", deals: 12, revenue: "$48k" },
      { name: "Warm Follow-up", replyRate: "18%", conversionRate: "6%", deals: 45, revenue: "$220k" },
      { name: "Re-engagement", replyRate: "12%", conversionRate: "3%", deals: 18, revenue: "$72k" },
    ]}
  />

  <PerformanceByDay
    data={dayPerformance}
    chart="line"
  />

  <ExportButtons>
    <Button>Export PDF</Button>
    <Button>Export CSV</Button>
  </ExportButtons>
</AnalyticsDashboard>
```

---

## 🚀 BUILD THESE NEXT = INSTANT COMPETITIVE ADVANTAGE

Each of these is 2-5 hours of work. Build in order, deploy incrementally.

```
Week 1:
Mon-Tue: Lead Scoring
Wed: Lead Tags + Custom Fields
Thu-Fri: Email Template Library

Week 2:
Mon-Tue: Custom Automation Workflows
Wed-Thu: Campaign Analytics Dashboard
Fri: Testing + deployment

Total: ~20 hours of work = 50% increase in feature completeness
```

---

These 5 features take Audnix from "nice tool" to "must-have for agencies".
Deploy them and you're at $499/month tier legitimately.
