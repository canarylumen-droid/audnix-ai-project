
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables if running locally (helper for dev)
if (!process.env.DATABASE_URL) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) process.env[key.trim()] = value.trim();
            });
        }
    } catch (e) {
        // Ignore
    }
}

const TEMPLATES = [
    // PRICING OBJECTIONS
    {
        name: "Pricing - Too Expensive (ROI Frame)",
        type: "reply_template",
        content: "I totally hear you. It's an investment. But think about it this way: one closed deal covers the cost for the entire year. If this helps you close just ONE extra client this month, would it be worth it?",
        channelRestriction: "all",
        intentTags: ["objection", "pricing_question"]
    },
    {
        name: "Pricing - Budget Freeze",
        type: "reply_template",
        content: "Understood. Many of our best partners started during a freeze because this is pure performance—it pays for itself. If we could defer the payment until you see your first result, would that change things?",
        channelRestriction: "email",
        intentTags: ["objection", "pricing_question"]
    },
    {
        name: "Pricing - Cheaper Competitor",
        type: "reply_template",
        content: "Fair point. They are cheaper. But usually, you pay for what you get in terms of [Specific Feature/Result]. I'd rather explain the price once than apologize for results forever. Want to see a quick side-by-side?",
        channelRestriction: "all",
        intentTags: ["objection", "pricing_question", "competitor"]
    },

    // TIMING OBJECTIONS
    {
        name: "Timing - 'Call Me Later'",
        type: "reply_template",
        content: "I can definitely circle back. But usually 'later' becomes 'never' and the problem just grows. Why don't we take 5 minutes now to see if this is even a fit? If not, I won't bug you again.",
        channelRestriction: "all",
        intentTags: ["objection", "timing", "cold"]
    },
    {
        name: "Timing - Too Busy",
        type: "reply_template",
        content: "That's exactly why I'm reaching out. This system is built to save you time, not take it. Give me 10 minutes to show you how to get 5 hours back next week.",
        channelRestriction: "all",
        intentTags: ["objection", "timing"]
    },
    {
        name: "Timing - Q4/End of Year",
        type: "reply_template",
        content: "Totally get the Q4 rush. But setting this up now means you hit the ground running Jan 1st while competitors are still waking up. Let's steal a march on them?",
        channelRestriction: "email",
        intentTags: ["objection", "timing"]
    },

    // TRUST / AUTHORITY
    {
        name: "Trust - 'Send Me Info'",
        type: "reply_template",
        content: "I could bombard you with PDFs, but honestly, it's better to see it in action. It takes 3 minutes to show you the backend. Are you at your desk?",
        channelRestriction: "all",
        intentTags: ["objection", "needs_info"]
    },
    {
        name: "Trust - Who Are You?",
        type: "reply_template",
        content: "Great question. We're a specialist agency helping [Industry] businesses authorize their growth. We've helped companies like [Example] scale to [Result]. Just wanted to see if we could do the same for you.",
        channelRestriction: "all",
        intentTags: ["objection", "trust"]
    },

    // FOLLOW-UPS
    {
        name: "Follow-Up - Bump 1 (Gentle)",
        type: "reply_template",
        content: "Hey [Name], just floating this to the top of your inbox. Did you get a chance to see my last note?",
        channelRestriction: "all",
        intentTags: ["re_engage"]
    },
    {
        name: "Follow-Up - Bump 2 (Value Add)",
        type: "reply_template",
        content: "Hey [Name], I was thinking about your business and found this case study relevant to what we discussed. Thought you might find it interesting: [Link]",
        channelRestriction: "all",
        intentTags: ["re_engage", "value_add"]
    },
    {
        name: "Follow-Up - Breakup (The 'Magic' Email)",
        type: "reply_template",
        content: "Hi [Name], I haven't heard back, so I assume you're all set or this isn't a priority right now. I'll close your file for now so I don't keep bugging you. All the best!",
        channelRestriction: "email",
        intentTags: ["re_engage", "breakup"]
    },

    // DIRECT CLOSING
    {
        name: "Closing - Calendar Drop",
        type: "reply_template",
        content: "Perfect. Let's stop the back and forth. Here's my calendar—pick a time that works for you: [Link]",
        channelRestriction: "all",
        intentTags: ["booking_ready"]
    },
    {
        name: "Closing - Assumptive",
        type: "reply_template",
        content: "Sounds like a plan. I can send over the agreement now and we can get started Tuesday. Does that timeline work for you?",
        channelRestriction: "email",
        intentTags: ["closing", "ready_to_buy"]
    },
    {
        name: "Closing - Two Options",
        type: "reply_template",
        content: "Great. Would you prefer to start with the Pilot (lower risk) or the Full Scale (faster results)?",
        channelRestriction: "all",
        intentTags: ["closing", "ready_to_buy"]
    },
    // INSTAGRAM SPECIFIC
    {
        name: "IG - Quick Intro",
        type: "reply_template",
        content: "Hey! 👋 Loved your recent post about [Topic]. We help creators just like you scale. Open to a quick chat?",
        channelRestriction: "instagram",
        intentTags: ["cold", "intro"]
    },
    {
        name: "IG - Story Reply",
        type: "reply_template",
        content: "🔥 This is spot on! We actually built a tool that automates exactly this. Want to see how?",
        channelRestriction: "instagram",
        intentTags: ["cold", "intro"]
    },
    {
        name: "IG - Value Hook",
        type: "reply_template",
        content: "Quick question for you - are you currently looking to add more clients this month? I have a strategy that might help.",
        channelRestriction: "instagram",
        intentTags: ["cold", "intro"]
    },
    // MORE OBJECTIONS
    {
        name: "Objection - 'We handle looking in-house'",
        type: "reply_template",
        content: "That's awesome. Usually that means you know exactly what you need. We actually work WITH in-house teams to supercharge their results, not replace them. Worth a 5-min chat to compare notes?",
        channelRestriction: "all",
        intentTags: ["objection", "competitor"]
    },
    {
        name: "Objection - 'Send a proposal'",
        type: "reply_template",
        content: "I'd love to, but I don't want to send a generic PDF that wastes your time. Can we do a 10-min retro call first so I can tailor it to exactly what you need?",
        channelRestriction: "all",
        intentTags: ["objection", "needs_info"]
    },
    {
        name: "Objection - 'Not Interested'",
        type: "reply_template",
        content: "Totally fair. Just so I don't reach out again irrelevantly—is it because you're set with a competitor, or just not focusing on growth right now?",
        channelRestriction: "all",
        intentTags: ["objection", "not_interested"]
    }
];

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("❌ DATABASE_URL missing");
        process.exit(1);
    }

    const client = postgres(databaseUrl);
    const db = drizzle(client, { schema });

    console.log(`🌱 Seeding ${TEMPLATES.length} content templates...`);

    // We need a user ID to attach these to.
    // In a real seed, we might attach to a specific admin or the first user found.
    // For this task, we will attach to the first user found, or 'system' default if we had one.
    // Actually, contentLibrary is per-user.
    // We should fetch ALL users and add these templates to them IF they don't have them?
    // Or just add to the first user (likely the dev user).

    const users = await db.select().from(schema.users).limit(1);
    if (users.length === 0) {
        console.log("⚠️ No users found. Skipping seed.");
        await client.end();
        return;
    }

    const userId = users[0].id;
    console.log(`👤 Seeding for user: ${users[0].email} (${userId})`);

    let count = 0;
    for (const template of TEMPLATES) {
        // Check if exists (duplicate check by name)
        const existing = await db.query.contentLibrary.findFirst({
            where: (table, { eq, and }) => and(
                eq(table.userId, userId),
                eq(table.name, template.name)
            )
        });

        if (!existing) {
            await db.insert(schema.contentLibrary).values({
                userId,
                // @ts-ignore - mismatch in type enum vs frontend value, expecting text col handles it
                type: template.type,
                name: template.name,
                content: template.content,
                // @ts-ignore
                channelRestriction: template.channelRestriction,
                intentTags: template.intentTags,
            });
            count++;
        }
    }

    console.log(`✅ Added ${count} new templates.`);
    await client.end();
}

main().catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
