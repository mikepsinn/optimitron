import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatContainer } from '../components/ChatContainer.js';
import type { ChatMessage } from '../types.js';

describe('ChatContainer', () => {
  it('renders text messages', () => {
    const messages: ChatMessage[] = [
      { type: 'text', role: 'user', content: 'Hello' },
      { type: 'text', role: 'assistant', content: 'Hi there!' },
    ];
    render(<ChatContainer messages={messages} onSend={() => {}} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('renders input and send button', () => {
    render(<ChatContainer messages={[]} onSend={() => {}} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('calls onSend when send button clicked', () => {
    const onSend = vi.fn();
    render(<ChatContainer messages={[]} onSend={onSend} />);
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByLabelText('Send message'));
    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('calls onSend on Enter key', () => {
    const onSend = vi.fn();
    render(<ChatContainer messages={[]} onSend={onSend} />);
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Enter test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Enter test');
  });

  it('clears input after send', () => {
    render(<ChatContainer messages={[]} onSend={() => {}} />);
    const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Clear me' } });
    fireEvent.click(screen.getByLabelText('Send message'));
    expect(input.value).toBe('');
  });

  it('does not send empty messages', () => {
    const onSend = vi.fn();
    render(<ChatContainer messages={[]} onSend={onSend} />);
    fireEvent.click(screen.getByLabelText('Send message'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('renders mood card message', () => {
    const messages: ChatMessage[] = [{ type: 'mood', id: 'mood-1' }];
    render(<ChatContainer messages={messages} onSend={() => {}} />);
    expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
  });

  it('renders treatment card message', () => {
    const messages: ChatMessage[] = [
      { type: 'treatment', id: 't-1', name: 'Aspirin', dose: '100mg' },
    ];
    render(<ChatContainer messages={messages} onSend={() => {}} />);
    expect(screen.getByText('Aspirin')).toBeInTheDocument();
    expect(screen.getByText('100mg')).toBeInTheDocument();
  });

  it('renders insight card message', () => {
    const messages: ChatMessage[] = [
      { type: 'insight', title: 'Sleep Insight', body: 'You need more sleep' },
    ];
    render(<ChatContainer messages={messages} onSend={() => {}} />);
    expect(screen.getByText('Sleep Insight')).toBeInTheDocument();
    expect(screen.getByText('You need more sleep')).toBeInTheDocument();
  });
});
