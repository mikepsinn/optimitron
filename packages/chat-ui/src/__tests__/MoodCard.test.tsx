import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoodCard } from '../components/MoodCard.js';

describe('MoodCard', () => {
  it('renders 5 mood buttons', () => {
    render(<MoodCard onRate={() => {}} />);
    expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
    expect(screen.getByLabelText('Very Bad')).toBeInTheDocument();
    expect(screen.getByLabelText('Great')).toBeInTheDocument();
  });

  it('calls onRate with correct value on click', () => {
    const onRate = vi.fn();
    render(<MoodCard onRate={onRate} />);
    fireEvent.click(screen.getByLabelText('Good'));
    expect(onRate).toHaveBeenCalledWith(4);
  });

  it('shows confirmation after rating', () => {
    render(<MoodCard onRate={() => {}} />);
    fireEvent.click(screen.getByLabelText('Okay'));
    expect(screen.getByText(/Mood recorded: Okay/)).toBeInTheDocument();
  });
});
