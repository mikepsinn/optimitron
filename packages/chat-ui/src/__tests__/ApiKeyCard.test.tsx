import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiKeyCard } from '../components/ApiKeyCard.js';

describe('ApiKeyCard', () => {
  it('renders provider dropdown and key input', () => {
    render(<ApiKeyCard onSave={() => {}} />);
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows privacy disclaimer', () => {
    render(<ApiKeyCard onSave={() => {}} />);
    expect(
      screen.getByText(/Keys are stored locally and never leave your device/)
    ).toBeInTheDocument();
  });

  it('calls onSave with provider and key', () => {
    const onSave = vi.fn();
    render(<ApiKeyCard onSave={onSave} />);
    const keyInput = screen.getByLabelText('API Key');
    fireEvent.change(keyInput, { target: { value: 'sk-test-123' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('OpenAI', 'sk-test-123');
  });

  it('allows changing provider', () => {
    const onSave = vi.fn();
    render(<ApiKeyCard onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Provider'), {
      target: { value: 'Anthropic' },
    });
    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'sk-ant-test' },
    });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('Anthropic', 'sk-ant-test');
  });

  it('shows confirmation after saving', () => {
    render(<ApiKeyCard onSave={() => {}} />);
    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'key' },
    });
    fireEvent.click(screen.getByText('Save'));
    expect(screen.getByText(/API key saved for OpenAI/)).toBeInTheDocument();
  });
});
