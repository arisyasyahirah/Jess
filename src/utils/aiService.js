// Storage no longer needed for API keys

async function callGemini(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Gemini API error');
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(prompt, apiKey) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Groq API error');
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function callAI(prompt) {
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (groqKey) {
        return callGroq(prompt, groqKey);
    } else if (geminiKey) {
        return callGemini(prompt, geminiKey);
    }

    // Mock response when no API keys are provided for general website testing
    return `[Mock AI Response]\n\nSince no API keys are configured in the .env file, this is a mock generated response. \n\nHere is what I would have generated based on your prompt: \n"${prompt.substring(0, 50)}..."\n\nYou can safely test the UI functionalities!`;
}
