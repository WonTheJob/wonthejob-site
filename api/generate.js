// api/generate.js
// Vercel serverless function — generates roofing proposals via OpenAI

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { jobDescription } = req.body;
  if (!jobDescription) return res.status(400).json({ error: 'jobDescription required' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert roofing contractor proposal writer with 20 years of experience. You write winning proposals that are professional, specific, and detailed.

Extract ALL of the following from the contractor's input and use them throughout:
- Company name → use EXACTLY as written, never substitute
- Homeowner name → use exactly, or "Valued Customer" if not provided
- Property address → use exactly, or "Your Property" if not provided
- All materials → use exact brand names, product lines, colors
- Square footage/squares → use exact number
- All work items → list every single one
- Price → use EXACT dollar amount provided, never say "see attached"
- City/state → use for licensing line

FORMAT THE PROPOSAL EXACTLY AS FOLLOWS — no deviations:

[COMPANY NAME]
Professional Roofing Services | Licensed & Insured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROOFING PROPOSAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prepared for: [Homeowner Name]
Property:     [Address]
Date:         ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Proposal valid for 30 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE OF WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[List every work item in detail — one per line with →]
→ [Item 1 with specifics]
→ [Item 2 with specifics]
[Continue for ALL items mentioned]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATERIALS SPECIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[List all materials with brand, product line, color, and manufacturer warranty]
→ [Material 1]
→ [Material 2]
[Continue for all materials]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVESTMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[If multiple line items, break them down. Always show total.]

TOTAL:  $[EXACT PRICE — never omit or substitute]

Payment Terms:
→ Deposit: $[50% of total] due at scheduling
→ Balance: $[remaining 50%] due upon completion
→ Accepted: Check, Cash, Card, or Zelle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WARRANTY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ [Specific manufacturer warranty for product mentioned]
→ Workmanship: 10-year warranty
→ Work performed to local building code
→ Fully licensed and insured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READY TO GET STARTED?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply to this message or call us to confirm your project.
We'll schedule your start date and collect the deposit.

Available 7 days a week for any questions.

[COMPANY NAME]
Proposal powered by WonTheJob · wonthejob.com

CRITICAL RULES — NEVER BREAK THESE:
1. ALWAYS use the EXACT company name from input — never "Your Company Name"
2. ALWAYS use the EXACT dollar amount from input — never "per specifications" or "see attached"
3. ALWAYS use exact brand names and colors mentioned
4. If no price given: write "Price: To be confirmed — please contact us"
5. If no company name given: write "Your Roofing Company" as placeholder
6. Be SPECIFIC — vague proposals cost contractors jobs`
          },
          {
            role: 'user',
            content: `Write a complete professional roofing proposal using every detail below. Be specific and use ALL the information provided — company name, exact price, exact materials, everything:

${jobDescription}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.4,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI error:', error);
      return res.status(500).json({ error: 'Generation failed' });
    }

    const data = await response.json();
    const proposal = data.choices[0]?.message?.content || '';

    return res.status(200).json({ proposal });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
