import { useState, type FC } from 'react';
import type { ApiKeyCardProps } from '../types.js';

const PROVIDERS = ['OpenAI', 'Anthropic', 'Gemini'] as const;

export const ApiKeyCard: FC<ApiKeyCardProps> = ({ onSave }) => {
  const [provider, setProvider] = useState<string>(PROVIDERS[0]);
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!key.trim()) return;
    setSaved(true);
    onSave(provider, key);
  };

  if (saved) {
    return (
      <div className="opto-card opto-apikey-card opto-apikey-card--saved">
        <div className="opto-apikey-card__confirmation">
          🔑 API key saved for {provider}
        </div>
      </div>
    );
  }

  return (
    <div className="opto-card opto-apikey-card">
      <div className="opto-apikey-card__header">🔑 API Key Settings</div>
      <div className="opto-apikey-card__form">
        <label className="opto-apikey-card__label">
          Provider
          <select
            className="opto-apikey-card__select"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            aria-label="Provider"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="opto-apikey-card__label">
          API Key
          <input
            type="password"
            className="opto-apikey-card__input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            aria-label="API Key"
          />
        </label>
        <button
          className="opto-apikey-card__save-btn"
          onClick={handleSave}
          disabled={!key.trim()}
        >
          Save
        </button>
      </div>
      <div className="opto-apikey-card__disclaimer">
        🔒 Keys are stored locally and never leave your device
      </div>
    </div>
  );
};
