import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PairwiseCard } from '../components/PairwiseCard.js';

describe('PairwiseCard', () => {
  it('renders both items', () => {
    render(<PairwiseCard itemA="Education" itemB="Healthcare" onCompare={() => {}} />);
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });

  it('renders preset buttons', () => {
    render(<PairwiseCard itemA="A" itemB="B" onCompare={() => {}} />);
    expect(screen.getByText('80/20')).toBeInTheDocument();
    expect(screen.getByText('50/50')).toBeInTheDocument();
    expect(screen.getByText('20/80')).toBeInTheDocument();
  });

  it('calls onCompare when preset clicked', () => {
    const onCompare = vi.fn();
    render(<PairwiseCard itemA="A" itemB="B" onCompare={onCompare} />);
    fireEvent.click(screen.getByText('60/40'));
    expect(onCompare).toHaveBeenCalledWith(60);
  });

  it('calls onCompare with slider value on confirm', () => {
    const onCompare = vi.fn();
    render(<PairwiseCard itemA="A" itemB="B" onCompare={onCompare} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onCompare).toHaveBeenCalledWith(50); // default
  });

  it('shows submitted state', () => {
    render(<PairwiseCard itemA="X" itemB="Y" onCompare={() => {}} />);
    fireEvent.click(screen.getByText('80/20'));
    expect(screen.getByText('X: 80%')).toBeInTheDocument();
    expect(screen.getByText('Y: 20%')).toBeInTheDocument();
  });
});
