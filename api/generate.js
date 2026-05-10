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
            role: 'user',
            content: `You are a roofing proposal writer. Write a complete proposal using the job details below. Today is ${today}.

Job: ${jobDescription}

Write the proposal exactly like this example — fill in every section with real details from the job above:

---
JOHNSON ROOFING LLC
Professional Roofing Services | Licensed and Insured

ROOFING PROPOSAL

Prepared for: Mike Smith
Property: 4521 Oak Drive, Louisville KY
Date: ${today}
Valid for 30 days

SCOPE OF WORK:
- Remove and dispose of existing roofing system (1 layer)
- Inspect roof deck and replace damaged boards as needed
- Install GAF Feltbuster synthetic underlayment on entire deck
- Install GAF Timberline HDZ Pewter Gray architectural shingles - 34 squares
- Replace 6 pipe boot flashings with new rubber boots
- Install new aluminum drip edge on all eaves and rakes - 50 linear feet
- Detach and reset 6-inch seamless gutters on front and back
- Replace all step flashings and counter flashings at walls
- Perform full site cleanup and remove all debris and nails from property

MATERIALS:
- GAF Timberline HDZ Architectural Shingles - Pewter Gray - Class 4 Impact Resistant
- GAF Feltbuster Synthetic Underlayment
- Aluminum drip edge - color matched to shingles
- Rubber pipe boot flashings (6 units)
- Roofing nails, sealants, and all required fasteners

INVESTMENT:
Roofing system (34 squares): $13,200
Drip edge and flashings: $1,400
Pipe boot replacements: $600
Gutter detach and reset: $1,600
Total: $16,800

Payment Terms:
- Deposit: $8,400 due at scheduling
- Balance: $8,400 due upon completion
- We accept: Check, Cash, Card, or Zelle

WARRANTY:
- GAF System Plus Limited Warranty: 50 years on shingles
- Workmanship warranty: 10 years
- Fully licensed and insured in Kentucky

READY TO GET STARTED?
Reply to this message or call us to confirm your start date.
Questions? We are available 7 days a week.

Johnson Roofing LLC
Proposal powered by WonTheJob
---

Now write the same style proposal using the actual job details I gave you above. Replace every detail with the real information from the job. Keep the exact same format and section names.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ error: 'Generation failed' });
    }

    const data = await response.json();
    const proposal = data.choices[0]?.message?.content || '';
    const htmlProposal = proposal.replace(/\n/g, '<br>').replace(/\r/g, '');
    return res.status(200).json({ proposal: htmlProposal });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
