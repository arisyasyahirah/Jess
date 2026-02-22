const KEY_PREFIX = 'jess_apikey_';

export function saveApiKey(provider, key) {
    localStorage.setItem(`${KEY_PREFIX}${provider}`, key);
}

export function getApiKey(provider) {
    return localStorage.getItem(`${KEY_PREFIX}${provider}`) || '';
}

export function clearApiKey(provider) {
    localStorage.removeItem(`${KEY_PREFIX}${provider}`);
}

export function getActiveProvider() {
    if (getApiKey('gemini')) return 'gemini';
    if (getApiKey('groq')) return 'groq';
    return null;
}
