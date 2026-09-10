/**
 * Gemini AI Integration for LEATrace Cyber Workspace
 * High-performance integration with Google Generative AI (Gemini) REST API.
 * Features automated multi-model failover (3.7-flash -> 3.6-flash -> 2.5-pro).
 */

export interface InvestigationContext {
  activeTargetAddress: string;
  investigationId: string;
  summary: any;
  transactions: any[];
  counterparties: any[];
  riskScore: number;
  riskLevel: string;
  alerts: any[];
  evidenceItems: any[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export function getGeminiApiKey(): string {
  // 1. Check Vite environment variables (VITE_GEMINI_API_KEY or GEMINI_API_KEY)
  const envKey = (
    (import.meta.env.VITE_GEMINI_API_KEY as string) ||
    (import.meta.env.GEMINI_API_KEY as string)
  )?.trim();

  if (envKey && envKey !== 'YOUR_GEMINI_API_KEY_HERE' && envKey !== '') {
    return envKey;
  }

  // 2. Check localStorage custom key entered by user
  const localKey = localStorage.getItem('leatrace_gemini_api_key')?.trim();
  if (localKey && localKey !== 'YOUR_GEMINI_API_KEY_HERE' && localKey !== '') {
    return localKey;
  }

  // 3. Fallback to empty string (key should come from env or user settings)
  return '';
}

export function setCustomGeminiApiKey(key: string): void {
  if (key) {
    localStorage.setItem('leatrace_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('leatrace_gemini_api_key');
  }
}

export function getGeminiModel(): string {
  const model = (import.meta.env.VITE_GEMINI_MODEL as string)?.trim();
  if (model && model !== '') {
    return model;
  }
  return 'gemini-3.7-flash';
}

/**
 * Returns the app-branded, precise forensic engine name
 */
export function getEngineDisplayName(modelName?: string): string {
  const name = modelName || getGeminiModel();
  if (name.includes('3.7')) return 'LEAT-Forensic-v3.7';
  if (name.includes('3.6')) return 'LEAT-Forensic-v3.6';
  if (name.includes('2.5')) return 'LEAT-Forensic-v2.5';
  if (name.includes('pro')) return 'LEAT-Forensic-Pro';
  return 'LEAT-Forensic-Neural';
}

export async function askGemini(
  userPrompt: string,
  context: InvestigationContext,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const primaryModel = getGeminiModel();
  // Multi-model resilience list: if primary hits 503 (high demand) or 404, automatically failover
  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-2.5-pro',
    'gemini-3-flash-preview',
    'gemini-flash-latest'
  ]));

  // Comprehensive system instruction that supports ANY question with 100% intelligence
  const systemInstruction = `You are the LEAtTrace Intelligence AI Copilot — an elite cyber forensics, financial crimes, blockchain tracing, and general intelligence assistant for law enforcement agencies (I4C, CBI, NIA, CID, State Cyber Cells) and digital investigators.

CAPABILITIES & CORE DIRECTIVES:
1. ANSWER ANY QUESTION: You are fully empowered to answer ANY question the user asks — including general cryptocurrency mechanics, cybercrime typologies, digital forensic methodologies, legal frameworks (NIST SP 800-53, Indian Evidence Act Section 65B), Python/bash scripting for forensics, transaction graph analysis, OSINT techniques, and general technical or conceptual queries.
2. ADAPTIVE DEPTH: Provide thorough, actionable, and mathematically accurate explanations. Never decline to answer questions or restrict yourself to a single wallet.
3. INVESTIGATION CONTEXT: If the user asks about the active investigation, case, wallet, or funds, correlate your response using the active case context provided below.
4. STRUCTURED FORMAT: Use clean markdown styling (headings, bullet points, bold highlights, and code blocks) for high readability.

ACTIVE CASE & INVESTIGATION DATA:
- Case Reference ID: ${context.investigationId || 'UNASSIGNED'}
- Target Wallet Address: ${context.activeTargetAddress || 'N/A'}
- Network/Chain: ${context.summary?.chain || 'Bitcoin Mainnet'}
- Confirmed Balance: ${context.summary ? (context.summary.confirmedBalance / 1e8).toFixed(4) : '0'} BTC
- Total Transactions: ${context.summary?.txCount ?? 0}
- Risk Assessment: ${context.riskScore}/100 (${context.riskLevel.toUpperCase()})
- Counterparties Identified: ${context.counterparties?.length ?? 0}
- Active Alerts: ${context.alerts?.length ?? 0}
- Sealed Evidence Items: ${context.evidenceItems?.length ?? 0}

TOP COUNTERPARTIES:
${context.counterparties?.slice(0, 8).map((cp: any, i: number) => 
  `${i + 1}. ${cp.address} (${cp.direction}, ${cp.txCount} txns, ${((cp.totalIn + cp.totalOut) / 1e8).toFixed(4)} BTC)`
).join('\n') || 'None'}

RECENT TRANSACTIONS:
${context.transactions?.slice(0, 6).map((tx: any) => 
  `- TXID: ${tx.txid} | Confirmed: ${tx.status?.confirmed} | Fee: ${tx.fee ? (tx.fee / 1e8).toFixed(6) : 'N/A'} BTC`
).join('\n') || 'None'}

ACTIVE ALERTS:
${context.alerts?.slice(0, 5).map((a: any) => `- [${a.severity.toUpperCase()}] ${a.message || a.type}`).join('\n') || 'No active alerts'}`;

  // Filter history to last 10 messages
  const recentHistory = history.slice(-10);
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const m of recentHistory) {
    contents.push({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userPrompt }]
  });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 2500,
    }
  };

  let lastError: any = null;

  // Try candidate models in order until one succeeds
  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const responseText = candidate?.content?.parts?.[0]?.text;
        if (responseText) {
          return responseText;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const status = res.status;
        const msg = errData.error?.message || `HTTP ${status}`;
        lastError = new Error(`[Model ${model}]: ${msg}`);
        // If 503 or 404, loop will try next model
        console.warn(`[LEATrace Gemini Failover] Model ${model} returned ${status}, trying next model...`);
      }
    } catch (e: any) {
      lastError = e;
      console.warn(`[LEATrace Gemini Failover] Network error on ${model}, trying next...`, e);
    }
  }

  throw lastError || new Error('All candidate Gemini models failed to generate content.');
}
