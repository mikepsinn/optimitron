import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VoiceTranscript, type TranscriptEntry } from '../components/VoiceTranscript.js';

describe('VoiceTranscript', () => {
  it('renders nothing when entries are empty', () => {
    const { container } = render(<VoiceTranscript entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders user and assistant entries', () => {
    const entries: TranscriptEntry[] = [
      { role: 'user', text: 'What is Optimitron?' },
      { role: 'assistant', text: 'Optimitron is an AI governance platform.' },
    ];

    render(<VoiceTranscript entries={entries} />);

    expect(screen.getByText('What is Optimitron?')).toBeDefined();
    expect(screen.getByText('Optimitron is an AI governance platform.')).toBeDefined();
    expect(screen.getByText('You')).toBeDefined();
    expect(screen.getByText('Wishonia')).toBeDefined();
  });

  it('marks partial entries with the correct class', () => {
    const entries: TranscriptEntry[] = [
      { role: 'assistant', text: 'Processing...', partial: true },
    ];

    const { container } = render(<VoiceTranscript entries={entries} />);
    const partialSpan = container.querySelector('.opto-voice-transcript__text--partial');
    expect(partialSpan).not.toBeNull();
  });

  it('has accessible role and aria-live', () => {
    const entries: TranscriptEntry[] = [
      { role: 'user', text: 'Hello' },
    ];

    render(<VoiceTranscript entries={entries} />);
    const log = screen.getByRole('log');
    expect(log.getAttribute('aria-live')).toBe('polite');
  });
});
