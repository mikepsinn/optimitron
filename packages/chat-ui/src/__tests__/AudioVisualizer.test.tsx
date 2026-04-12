import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioVisualizer } from '../components/AudioVisualizer.js';

describe('AudioVisualizer', () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '#000',
    })) as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('renders nothing when analyserNode is null', () => {
    const { container } = render(<AudioVisualizer analyserNode={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a canvas when analyserNode is provided', () => {
    // Create a minimal mock AnalyserNode
    const mockAnalyser = {
      frequencyBinCount: 32,
      fftSize: 256,
      getByteFrequencyData: (arr: Uint8Array) => {
        arr.fill(128);
      },
    } as unknown as AnalyserNode;

    const { container } = render(<AudioVisualizer analyserNode={mockAnalyser} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.className).toContain('opto-voice-visualizer');
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses custom width and height', () => {
    const mockAnalyser = {
      frequencyBinCount: 32,
      fftSize: 256,
      getByteFrequencyData: () => {},
    } as unknown as AnalyserNode;

    const { container } = render(
      <AudioVisualizer analyserNode={mockAnalyser} width={300} height={60} />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas?.width).toBe(300);
    expect(canvas?.height).toBe(60);
  });
});
