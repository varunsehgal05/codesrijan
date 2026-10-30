# CODESRIJAN — EXTERNAL SERVICE RESILIENCE & FAILURE RECOVERY

**Objective:** Zero single points of failure. Third-party API disruptions must never compromise the availability of the core CodeSrijan hackathon platform.

---

## 1. EXTERNAL PROVIDER RESILIENCE MATRIX

| Provider | Purpose | SLA / Tier | Failure Impact | Resilience & Fallback Strategy |
|:---|:---|:---|:---|:---|
| **Groq Cloud API** | SrijanBot LLM (`llama-3.3-70b-versatile`) | Free Tier Quota (Rate-limited) | AI Chat degraded | **Dual-Engine Design:** 5,000ms `AbortSignal` timeout. On timeout, 429 quota exhaustion, or decommissioned model, automatically routes prompt to in-process **Heuristic Fallback Engine**. Core platform remains 100% operational. |
| **Google Apps Script** | Outbound Transactional Email | Free Tier Quota | OTP / Alerts delayed | Asynchronous HTTP dispatch. If relay fails or times out, the backend persists an in-app notification to the operative's account and logs the event without halting the API request. |
| **Firebase Cloud Messaging** | Web Push Notifications | Free Tier | Push banner missing | Client ServiceWorker registration errors are handled silently. User retains access to in-app notification dropdown. |
| **MongoDB Atlas** | Primary Database | M0 Free Tier (512MB) | Severe if offline | Automatic reconnection with exponential backoff (`maxPoolSize: 10`, `serverSelectionTimeoutMS: 5000`). Database health probe surfaces degraded status without leaking credentials. |

---

## 2. SRIJANBOT TIMEOUT & GRACEFUL DEGRADATION SPECIFICATION

```javascript
// Resilient Groq Integration with Heuristic Fallback
try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: prompt }]
        }),
        signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!groqRes.ok) throw new Error(`Groq HTTP ${groqRes.status}`);
    const data = await groqRes.json();
    return res.json({ reply: data.choices[0].message.content, provider: "groq" });
} catch (err) {
    console.warn("[SRIJANBOT WARN] Groq failed, activating heuristic copilot:", err.message);
    const fallbackReply = heuristicFallbackEngine(prompt, liveContext);
    return res.json({ reply: fallbackReply, provider: "fallback" });
}
```
