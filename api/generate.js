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
            content: `You are an expert roofing contractor proposal writer. Write complete, detailed roofing proposals.

Extract from the input: company name, customer name, address, all job details, all materials with brands/colors, price, phone.

Write the proposal in this EXACT format - fill in EVERY section with real content:

[COMPANY NAME]
Professional Roofing Services | Licensed & Insured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROOFING PROPOSAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prepared for: [customer name]
Property:     [address]
Date:         ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Valid for 30 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE OF WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Remove and dispose of existing roofing system (all layers)
→ Inspect and repair decking as needed
→ Install [specific underlayment product]
→ Install [exact shingle brand, product line, color] — [X] squares
→ [List every additional item from input — pipe boots, drip edge, gutters, etc.]
→ Replace all flashings, step flashings, and counter flashings
→ Full site cleanup and haul away all debris
→ Job site left cleaner than we found it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATERIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ [Exact shingle: brand, product line, color, class rating]
→ [Underlayment product]
→ [All other materials mentioned — gutters, pipe boots, drip edge, etc.]
→ All fasteners, sealants, and flashing materials included

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVESTMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Break into line items based on work described:]
Roofing system ([X] sq):     $[amount]
[Additional items]:           $[amount]
─────────────────────────────
TOTAL:                        $[EXACT PRICE FROM INPUT]

Payment Terms:
→ Deposit: $[50% of total] due at scheduling
→ Balance: $[remaining] due upon completion
→ We accept: Check, Cash, Card, or Zelle

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WARRANTY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ [Specific manufacturer warranty for the shingle brand mentioned]
→ Workmanship: 10-year warranty
→ Fully licensed and insured
→ All work to local building code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
READY TO GET STARTED?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply to this message or call [phone if provided] to confirm.
We'll lock in your start date and collect the deposit.

Questions? We're available 7 days a week.

[COMPANY NAME]
Proposal powered by WonTheJob · wonthejob.com

CRITICAL RULES:
- NEVER leave a section empty — always fill in real content
- Use EXACT company name from input
- Use EXACT price from input — never say "see attached"
- Use EXACT materials, brands, colors from input
- Scope of work must list EVERY item mentioned in the input
- If squares mentioned, calculate line item prices that add up to the total`
          },
          {
            role: 'user',
            content: `Write a complete roofing proposal. Fill in EVERY section with specific details from this job description. Do not leave any section blank:

${jobDescription}`
          }
        ],
        max_tokens: 1200,
        temperature: 0.3,
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
