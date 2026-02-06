import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FoodCard } from '../components/FoodCard.js';

describe('FoodCard', () => {
  it('renders input and log button', () => {
    render(<FoodCard onLog={() => {}} />);
    expect(screen.getByPlaceholderText('What did you eat?')).toBeInTheDocument();
    expect(screen.getByText('Log')).toBeInTheDocument();
  });

  it('calls onLog with input text', () => {
    const onLog = vi.fn();
    render(<FoodCard onLog={onLog} />);
    const input = screen.getByPlaceholderText('What did you eat?');
    fireEvent.change(input, { target: { value: 'Chicken salad' } });
    fireEvent.click(screen.getByText('Log'));
    expect(onLog).toHaveBeenCalledWith('Chicken salad');
  });

  it('shows recent foods as chips', () => {
    render(<FoodCard recentFoods={['Pizza', 'Salad', 'Soup']} onLog={() => {}} />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Salad')).toBeInTheDocument();
    expect(screen.getByText('Soup')).toBeInTheDocument();
  });

  it('calls onLog when chip clicked', () => {
    const onLog = vi.fn();
    render(<FoodCard recentFoods={['Pizza']} onLog={onLog} />);
    fireEvent.click(screen.getByText('Pizza'));
    expect(onLog).toHaveBeenCalledWith('Pizza');
  });

  it('shows confirmation after logging', () => {
    render(<FoodCard onLog={() => {}} />);
    const input = screen.getByPlaceholderText('What did you eat?');
    fireEvent.change(input, { target: { value: 'Eggs' } });
    fireEvent.click(screen.getByText('Log'));
    expect(screen.getByText(/Logged: Eggs/)).toBeInTheDocument();
  });

  it('shows autocomplete suggestions', () => {
    render(<FoodCard recentFoods={['Pizza', 'Pasta', 'Pie']} onLog={() => {}} />);
    const input = screen.getByPlaceholderText('What did you eat?');
    fireEvent.change(input, { target: { value: 'Pi' } });
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Pie')).toBeInTheDocument();
  });
});
