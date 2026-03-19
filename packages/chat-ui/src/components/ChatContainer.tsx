import { useState, useRef, useEffect, type FC } from 'react';
import type { ChatContainerProps, ChatMessage } from '../types.js';
import { MoodCard } from './MoodCard.js';
import { TreatmentCard } from './TreatmentCard.js';
import { SymptomCard } from './SymptomCard.js';
import { PairwiseCard } from './PairwiseCard.js';
import { FoodCard } from './FoodCard.js';
import { InsightCard } from './InsightCard.js';
import { ApiKeyCard } from './ApiKeyCard.js';
import { HintBar } from './HintBar.js';
import { CheckInCard } from './CheckInCard.js';

const MessageRenderer: FC<{
  message: ChatMessage;
  props: ChatContainerProps;
}> = ({ message, props }) => {
  switch (message.type) {
    case 'text':
      return (
        <div
          className={`opto-chat__bubble opto-chat__bubble--${message.role}`}
        >
          {message.content}
        </div>
      );
    case 'mood':
      return (
        <MoodCard
          onRate={(value) => props.onMoodRate?.(message.id, value)}
        />
      );
    case 'treatment':
      return (
        <TreatmentCard
          name={message.name}
          dose={message.dose}
          onAction={(action, minutes) =>
            props.onTreatmentAction?.(message.id, action, minutes)
          }
        />
      );
    case 'symptom':
      return (
        <SymptomCard
          name={message.name}
          valence={message.valence}
          onRate={(value) => props.onSymptomRate?.(message.id, value)}
        />
      );
    case 'pairwise':
      return (
        <PairwiseCard
          itemA={message.itemA}
          itemB={message.itemB}
          onCompare={(alloc) =>
            props.onPairwiseCompare?.(message.id, alloc)
          }
        />
      );
    case 'food':
      return (
        <FoodCard
          recentFoods={props.recentFoods}
          onLog={(desc) => props.onFoodLog?.(message.id, desc)}
        />
      );
    case 'insight':
      return (
        <InsightCard
          title={message.title}
          body={message.body}
          actionLabel={message.actionLabel ?? 'See full analysis'}
          onAction={message.onAction ?? (() => props.onInsightAction?.(message.title))}
        />
      );
    case 'apiKey':
      return (
        <ApiKeyCard
          onSave={(provider, key) => props.onApiKeySave?.(provider, key)}
        />
      );
    case 'hints':
      return (
        <HintBar
          buttons={message.buttons}
          onHintClick={(action) => props.onHintClick?.(action)}
        />
      );
    case 'checkIn':
      return (
        <CheckInCard
          onCheckIn={(health, happiness, note) =>
            props.onCheckIn?.(message.id, health, happiness, note)
          }
        />
      );
    default:
      return props.renderCustomMessage?.(message) ?? null;
  }
};

export const ChatContainer: FC<ChatContainerProps> = (props) => {
  const { messages, onSend } = props;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    // Scroll within the messages container, not the whole page
    const container = el.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div className="opto-chat">
      <div className="opto-chat__messages">
        {messages.map((msg, i) => (
          <div key={i} className="opto-chat__message-wrapper">
            <MessageRenderer message={msg} props={props} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="opto-chat__input-bar">
        <input
          type="text"
          className="opto-chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Type a message..."
          aria-label="Chat message input"
        />
        <button
          className="opto-chat__send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
};
