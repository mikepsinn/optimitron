import { useState, useMemo, type FC } from 'react';
import type { FoodCardProps } from '../types.js';

export const FoodCard: FC<FoodCardProps> = ({ recentFoods = [], onLog }) => {
  const [input, setInput] = useState('');
  const [logged, setLogged] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return recentFoods.filter((f) => f.toLowerCase().includes(lower)).slice(0, 5);
  }, [input, recentFoods]);

  const handleLog = (description: string) => {
    if (!description.trim()) return;
    setLogged(description);
    onLog(description);
  };

  if (logged !== null) {
    return (
      <div className="opto-card opto-food-card opto-food-card--logged">
        <div className="opto-food-card__confirmation">
          🍽️ Logged: {logged}
        </div>
      </div>
    );
  }

  return (
    <div className="opto-card opto-food-card">
      <div className="opto-food-card__header">🍽️ Log a food</div>
      <div className="opto-food-card__input-row">
        <input
          type="text"
          className="opto-food-card__input"
          placeholder="What did you eat?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLog(input);
          }}
          aria-label="Food description"
        />
        <button
          className="opto-food-card__log-btn"
          onClick={() => handleLog(input)}
          disabled={!input.trim()}
        >
          Log
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="opto-food-card__suggestions">
          {suggestions.map((food) => (
            <button
              key={food}
              className="opto-food-card__suggestion"
              onClick={() => handleLog(food)}
            >
              {food}
            </button>
          ))}
        </div>
      )}
      {recentFoods.length > 0 && !input.trim() && (
        <div className="opto-food-card__recent">
          <span className="opto-food-card__recent-label">Recent:</span>
          {recentFoods.slice(0, 6).map((food) => (
            <button
              key={food}
              className="opto-food-card__chip"
              onClick={() => handleLog(food)}
            >
              {food}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
