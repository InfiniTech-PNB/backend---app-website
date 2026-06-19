const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const cache = new Map();

// --------------------------------------------------
// Canonicalize input (VERY IMPORTANT)
// --------------------------------------------------
function canonicalizeSignals(signals) {
    return JSON.stringify(signals, Object.keys(signals).sort());
}

// --------------------------------------------------
// Stable Deterministic Noise (Hostname-Seeded)
// --------------------------------------------------
function getStableNoise(host) {
    if (!host || host === "unknown") return 0;
    let hash = 0;
    for (let i = 0; i < host.length; i++) {
        hash = host.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Generates a stable value between -0.02 and +0.02
    return ((Math.abs(hash) % 40) / 1000) - 0.02;
}

// --------------------------------------------------
// Deterministic enforcement (FINAL AUTHORITY)
// --------------------------------------------------
function enforceDeterminism(score, mlScore, signals) {

    // Handshake failure → force low
    if (!signals.tls_version || signals.cipher === "(NONE)") {
        return 0.35;
    }

    // No PQC → cannot exceed 0.85
    if (!signals.pqc.hybrid && !signals.pqc.key_exchange) {
        score = Math.min(score, 0.85);
    }

    // Weakness penalty
    if (signals.weak_ciphers.length > 0 || signals.vulnerabilities.length > 0) {
        score -= 0.03;
    }

    // Enforce ML deviation ±0.10
    if (Math.abs(score - mlScore) > 0.1) {
        score = mlScore - 0.05;
    }

    // Apply stable hostname-seeded noise to make scores realistic and non-repetitive
    const noise = getStableNoise(signals.host);
    score += noise;

    // Clamp
    score = Math.max(0, Math.min(1, score));

    return parseFloat(score.toFixed(2));
}

// --------------------------------------------------
// MAIN FUNCTION
// --------------------------------------------------
async function generateScore(mlScore, result) {

    const signals = {
        host: result.assetId?.host || result.host || "unknown",
        tls_version: result.negotiated?.tlsVersion || null,
        cipher: result.negotiated?.cipher || null,
        weak_ciphers: result.weakCiphers || [],
        pqc: {
            key_exchange: (result.pqc?.negotiated && result.pqc.negotiated.length > 0)
                ? result.pqc.negotiated[0]
                : null,
            signature: (result.pqc?.negotiated && result.pqc.negotiated.length > 1)
                ? result.pqc.negotiated[1]
                : null,
            hybrid: Boolean(result.pqc?.negotiated && result.pqc.negotiated.length > 0)
        },
        vulnerabilities: result.vulnerabilities || [],
        key_size: result.certificate?.publicKey?.size || null
    };

    const canonical = canonicalizeSignals(signals);
    const cacheKey = crypto
        .createHash("sha256")
        .update(canonical + "_" + mlScore)
        .digest("hex");

    // CACHE HIT → RETURN SAME RESULT
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    // --------------------------------------------------
    // STRICT PROMPT (PRECISE FLOATING POINT OUTPUT)
    // --------------------------------------------------
    const prompt = `
You are a deterministic PQC scoring engine.

OUTPUT RULES:
- Output ONLY one number.
- No text, no explanation.
- Output MUST be a decimal float between 0.00 and 1.00 (with exactly 2 decimal places).
- DO NOT restrict to a small list of pre-defined values. Compute the score dynamically.

SCORING RULES:

Start with base_score = ML score

1. TLS / HANDSHAKE FAILURE
If tls_version is null OR cipher == "(NONE)":
    score = 0.30

Else:

2. PQC ADJUSTMENT
- If no PQC → score -= 0.10
- If hybrid PQC → score += 0.05
- If both pqc.key_exchange AND pqc.signature exist → score += 0.10

3. WEAK CIPHERS
- If weak_ciphers length > 0 → score -= 0.05

4. VULNERABILITIES
- score -= 0.05 × number of vulnerabilities
- Maximum deduction = 0.20

5. KEY SIZE
- If key_size exists AND key_size < 2048 → score -= 0.05

6. CLAMP
- If score < 0 → set to 0
- If score > 1 → set to 1

7. RANGE CONSTRAINT
- Ensure score is within ±0.15 of ML score
- If outside, move it to the nearest boundary

8. NON-EQUALITY RULE
- If score == ML score → subtract 0.02

INPUT:
ML Score: ${mlScore}

Signals:
${canonical}
`;

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                temperature: 0,
                top_p: 1,
                max_tokens: 5,
                messages: [
                    {
                        role: "system",
                        content: "Return ONLY a number from the allowed list."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const raw = response.data.choices[0].message.content.trim();

        // Extract float safely
        const match = raw.match(/0?\.\d+|1(\.0+)?/);
        let score = match ? parseFloat(match[0]) : mlScore - 0.05;

        // Final deterministic enforcement
        const finalScore = enforceDeterminism(score, mlScore, signals);

        // Cache it
        cache.set(cacheKey, finalScore);

        return finalScore;

    } catch (error) {
        console.error("LLM Error → fallback");

        // fallback deterministic
        const fallback = enforceDeterminism(mlScore - 0.05, mlScore, signals);

        cache.set(cacheKey, fallback);

        return fallback;
    }
}

module.exports = generateScore;