// functions/api/chat.js
// This is the serverless function that runs on Cloudflare's servers.
// It receives messages from your chat widget and sends them to Claude.

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Get the message from the website visitor
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'No message provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // This is what Claude knows about you — edit freely!
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
- Blockchain: Bitcoin mining, Lightning Network node operation (BIZARRETOLL on Umbrel), self-custody
- Project Management: Complex multi-site logistics, contract operations
- Leadership: 20+ years leading SEAL teams, training, and high-stakes operations
- Languages: English (native), Spanish (advanced, studying)

ACTIVELY SEEKING:
- Remote roles in fintech, blockchain, and AI
- Recently applied to Figure Lending in Reno, NV
- Open to work (recruiter-only on LinkedIn)

LINKS:
- GitHub: github.com/frogman263
- LinkedIn: linkedin.com/in/brianperry263

If someone asks for Brian's contact info, direct them to LinkedIn.
If you don't know something specific, say so — don't make things up.
Do not discuss salary expectations or personal financial details.`;

    // Call Claude through Cloudflare's AI binding
    const response = await env.AI.run('anthropic/claude-sonnet-4.6', {
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract the text reply (handles different response formats)
    const reply =
      response?.content?.[0]?.text ||
      response?.response ||
      response?.result?.response ||
      'Sorry, I had trouble generating a response. Please try again.';

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Chat function error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle browser preflight requests (required for security)
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
