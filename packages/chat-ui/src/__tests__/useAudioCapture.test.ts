import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioCapture } from '../hooks/useAudioCapture.js';

// Mock AudioContext and related APIs
const mockClose = vi.fn().mockResolvedValue(undefined);
const mockAddModule = vi.fn().mockResolvedValue(undefined);
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

const mockWorkletPort = {
  onmessage: null as ((event: MessageEvent) => void) | null,
  postMessage: vi.fn(),
};

const mockAnalyser = {
  fftSize: 256,
  frequencyBinCount: 128,
  connect: mockConnect,
  disconnect: mockDisconnect,
};

const mockSource = {
  connect: mockConnect,
  disconnect: mockDisconnect,
};

const mockWorkletNode = {
  port: mockWorkletPort,
  connect: mockConnect,
  disconnect: mockDisconnect,
};

class MockAudioContext {
  sampleRate = 48000;
  audioWorklet = { addModule: mockAddModule };
  close = mockClose;
  createMediaStreamSource = vi.fn().mockReturnValue(mockSource);
  createAnalyser = vi.fn().mockReturnValue(mockAnalyser);
}

class MockAudioWorkletNode {
  port = mockWorkletPort;
  connect = mockConnect;
  disconnect = mockDisconnect;
  constructor() {
    Object.assign(this, mockWorkletNode);
  }
}

const mockTrack = { stop: vi.fn() };
const mockStream = { getTracks: () => [mockTrack] };

beforeEach(() => {
  vi.clearAllMocks();

  // @ts-expect-error -- mock global
  globalThis.AudioContext = MockAudioContext;
  // @ts-expect-error -- mock global
  globalThis.AudioWorkletNode = MockAudioWorkletNode;

  globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
  globalThis.URL.revokeObjectURL = vi.fn();

  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
    configurable: true,
  });
});

describe('useAudioCapture', () => {
  it('starts in non-capturing state', () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioChunk: vi.fn() }),
    );
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.analyserNode).toBeNull();
  });

  it('requests mic permission and starts capturing on start()', async () => {
    const onChunk = vi.fn();
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioChunk: onChunk }),
    );

    await act(async () => {
      await result.current.start();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 48000,
      },
    });
    expect(result.current.isCapturing).toBe(true);
    expect(result.current.analyserNode).not.toBeNull();
  });

  it('stops capturing and cleans up on stop()', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioChunk: vi.fn() }),
    );

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.analyserNode).toBeNull();
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('throws descriptive error on mic permission denied', async () => {
    const notAllowedError = new DOMException('Permission denied', 'NotAllowedError');
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(notAllowedError);

    const { result } = renderHook(() =>
      useAudioCapture({ onAudioChunk: vi.fn() }),
    );

    await expect(
      act(async () => {
        await result.current.start();
      }),
    ).rejects.toThrow('Microphone access denied');
    expect(result.current.isCapturing).toBe(false);
  });

  it('re-throws non-permission errors unchanged', async () => {
    const otherError = new Error('Device not found');
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(otherError);

    const { result } = renderHook(() =>
      useAudioCapture({ onAudioChunk: vi.fn() }),
    );

    await expect(
      act(async () => {
        await result.current.start();
      }),
    ).rejects.toThrow('Device not found');
  });

  it('does not start twice if already capturing', async () => {
    const { result } = renderHook(() =>
      useAudioCapture({ onAudioChunk: vi.fn() }),
    );

    await act(async () => {
      await result.current.start();
    });

    await act(async () => {
      await result.current.start();
    });

    // getUserMedia should only be called once
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  });
});
