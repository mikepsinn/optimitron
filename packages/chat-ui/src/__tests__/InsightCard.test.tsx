import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsightCard } from '../components/InsightCard.js';

describe('InsightCard', () => {
  it('renders title and body', () => {
    render(<InsightCard title="Sleep Analysis" body="You sleep better on magnesium" />);
    expect(screen.getByText('Sleep Analysis')).toBeInTheDocument();
    expect(screen.getByText('You sleep better on magnesium')).toBeInTheDocument();
  });

  it('renders default icon', () => {
    render(<InsightCard title="Test" body="Body" />);
    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<InsightCard title="Test" body="Body" icon="📊" />);
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('shows chart placeholder when enabled', () => {
    render(<InsightCard title="Test" body="Body" showChart />);
    expect(screen.getByText('📊 Chart')).toBeInTheDocument();
  });

  it('renders action button and calls onAction', () => {
    const onAction = vi.fn();
    render(
      <InsightCard
        title="Test"
        body="Body"
        actionLabel="See full analysis"
        onAction={onAction}
      />
    );
    fireEvent.click(screen.getByText('See full analysis'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
