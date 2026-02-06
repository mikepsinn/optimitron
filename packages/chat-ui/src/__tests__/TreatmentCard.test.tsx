import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TreatmentCard } from '../components/TreatmentCard.js';

describe('TreatmentCard', () => {
  it('renders treatment name and dose', () => {
    render(<TreatmentCard name="Vitamin D" dose="2000 IU" onAction={() => {}} />);
    expect(screen.getByText('Vitamin D')).toBeInTheDocument();
    expect(screen.getByText('2000 IU')).toBeInTheDocument();
  });

  it('calls onAction with done', () => {
    const onAction = vi.fn();
    render(<TreatmentCard name="Vitamin D" dose="2000 IU" onAction={onAction} />);
    fireEvent.click(screen.getByText('✅ Done'));
    expect(onAction).toHaveBeenCalledWith('done', undefined);
  });

  it('calls onAction with skip', () => {
    const onAction = vi.fn();
    render(<TreatmentCard name="Vitamin D" dose="2000 IU" onAction={onAction} />);
    fireEvent.click(screen.getByText('⏭️ Skip'));
    expect(onAction).toHaveBeenCalledWith('skip', undefined);
  });

  it('shows snooze options and calls onAction with snooze', () => {
    const onAction = vi.fn();
    render(<TreatmentCard name="Vitamin D" dose="2000 IU" onAction={onAction} />);
    fireEvent.click(screen.getByText('⏰ Snooze'));
    expect(screen.getByText('15min')).toBeInTheDocument();
    expect(screen.getByText('30min')).toBeInTheDocument();
    expect(screen.getByText('1hr')).toBeInTheDocument();
    fireEvent.click(screen.getByText('30min'));
    expect(onAction).toHaveBeenCalledWith('snooze', 30);
  });

  it('shows completed state after action', () => {
    render(<TreatmentCard name="Vitamin D" dose="2000 IU" onAction={() => {}} />);
    fireEvent.click(screen.getByText('✅ Done'));
    expect(screen.getByText('✅ Taken')).toBeInTheDocument();
  });
});
