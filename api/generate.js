// api/generate.js
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

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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
            content: `You write roofing proposals. Always write the COMPLETE proposal with ALL sections filled in with real content. Never leave any section empty. Today is ${today}.

You MUST include real bullet points under SCOPE OF WORK and MATERIALS. These sections cannot be empty.`
          },
          {
            role: 'user',
            content: `Write a complete roofing proposal for this job. Include ALL sections with real content. The SCOPE OF WORK and MATERIALS sections MUST have detailed bullet points listing every item of work and every material.

Job details: ${jobDescription}

Write the proposal now in this exact format:

[Company Name from input]
Professional Roofing Services | Licensed & Insured

ROOFING PROPOSAL

Prepared for: [customer name]
Property: [address]
Date: ${today}
Valid for 30 days

SCOPE OF WORK

[List every single work item as a bullet point starting with a dash. Include removal of old roof, underlayment install, shingle install with exact brand and color, all extras mentioned like pipe boots, drip edge, gutters, flashings, cleanup. Minimum 6 bullet points.]

MATERIALS

[List every material with exact brand names, colors, and specs as bullet points. Minimum 4 bullet points.]

INVESTMENT

[Break price into line items that add up to the total price]
Total: $[exact price from input]

Payment Terms:
- Deposit: $[50% of price] due at scheduling
- Balance: $[50% of price] due upon completion
- Accepted: Check, Cash, Card, Zelle

WARRANTY

- [Manufacturer warranty for specific shingle brand mentioned]
- Workmanship: 10 years
- Fully licensed and insured

READY TO GET STARTED?
Reply or call to confirm. We lock in your date and collect the deposit.

[Company Name]
Proposal powered by WonTheJob`
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ error: 'Generation failed' });
    }

    const data = await response.json();
    const proposal = data.choices[0]?.message?.content || '';
    return res.status(200).json({ proposal });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
