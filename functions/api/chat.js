export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'No message provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a helpful assistant on Brian Perry's professional portfolio website.
Your job is to answer questions from recruiters, collaborators, and visitors about Brian's background, projects, and skills.
Be professional but direct — like Brian himself. Keep answers concise (2-4 sentences max unless more detail is asked for).

ABOUT BRIAN:
- Retired U.S. Navy SEAL Chief Petty Officer with 20+ years of service
- 100% service-connected disabled veteran and high-performing below-the-knee amputee (runs, lifts, snowboards)
- Based in Reno, Nevada
- Currently Project Manager & Logistics Operations Lead at White Buffalo Inc. (wildlife management contracts in Guam, Catalina Island, and the Midwest)
- Pursuing a BA in Spanish at Arizona State University (expected 2027)
- Holds an active SECRET clearance (adjudicated 2015)

BUSINESSES:
- Frogman Ventures LLC: Bitcoin mining operation (3x Antminer S21 XP Hydro miners at Simple Mining Iowa Site #10, via Ocean Mining Pool), plus vending operations
- Trident Professional Services LLC: Service route acquisitions

FLAGSHIP PROJECT — AI Trading Agent v2.3:
- Built from scratch with no prior coding experience
- Autonomous trading agent connected to Robinhood via MCP (Model Context Protocol)
- Operates on an AI infrastructure investment thesis across 18 stocks
- Fully documented with a professional GitHub profile at github.com/frogman263
- Demonstrates end-to-end AI system design: agent architecture, API integration, portfolio logic

SKILLS & INTERESTS:
- AI/ML: Autonomous agents, agentic workflows, Claude/Anthropic API, MCP integrations
- Blockchain: Bitcoin mining, Lightning Network node operation, self-custody
- Project Management: Complex multi-site logistics, contract operations
- Leadership: 20+ years leading SEAL teams, training, and high-stakes operations
- Languages: English (native), Spanish (advanced, studying)

ACTIVELY SEEKING:
- Remote roles in fintech, blockchain, and AI
- Open to work (recruiter-only on LinkedIn)

LINKS:
- GitHub: github.com/frogman263
- LinkedIn: linkedin.com/in/brianperry263

If someone asks for Brian's contact info, direct them to LinkedIn.
If you don't know something specific, say so honestly.
Do not discuss salary expectations or personal financial details.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text || 'Sorry, I had trouble generating a response.';

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
