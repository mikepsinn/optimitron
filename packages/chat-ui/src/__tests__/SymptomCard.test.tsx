import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SymptomCard } from '../components/SymptomCard.js';

describe('SymptomCard', () => {
  it('renders symptom name and 5 rating buttons', () => {
    render(<SymptomCard name="Headache" valence="negative" onRate={() => {}} />);
    expect(screen.getByText('Headache')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate Headache 1 out of 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate Headache 5 out of 5')).toBeInTheDocument();
  });

  it('calls onRate with selected value', () => {
    const onRate = vi.fn();
    render(<SymptomCard name="Energy" valence="positive" onRate={onRate} />);
    fireEvent.click(screen.getByLabelText('Rate Energy 3 out of 5'));
    expect(onRate).toHaveBeenCalledWith(3);
  });

  it('shows confirmation after rating', () => {
    render(<SymptomCard name="Sleep" valence="positive" onRate={() => {}} />);
    fireEvent.click(screen.getByLabelText('Rate Sleep 4 out of 5'));
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Recorded')).toBeInTheDocument();
  });
});
