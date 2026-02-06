import { describe, it, expect, beforeEach } from 'vitest';
import { ConversationContext } from '../conversation-context.js';

describe('ConversationContext', () => {
  let ctx: ConversationContext;

  beforeEach(() => {
    ctx = new ConversationContext();
  });

  describe('addMessage', () => {
    it('adds a message to the history', () => {
      ctx.addMessage('user', 'hello');
      const messages = ctx.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        role: 'user',
        content: 'hello',
      });
      expect(messages[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('adds multiple messages', () => {
      ctx.addMessage('user', 'took vitamin D');
      ctx.addMessage('assistant', 'Logged! Anything else?');
      ctx.addMessage('user', 'mood 4/5');
      expect(ctx.getMessages()).toHaveLength(3);
    });

    it('caps at 20 messages', () => {
      for (let i = 0; i < 25; i++) {
        ctx.addMessage('user', `message ${i}`);
      }
      const messages = ctx.getMessages();
      expect(messages.length).toBeLessThanOrEqual(20);
      // Should keep the most recent messages
      expect(messages[messages.length - 1].content).toBe('message 24');
    });
  });

  describe('clearContext', () => {
    it('clears all messages', () => {
      ctx.addMessage('user', 'test');
      ctx.clearContext();
      expect(ctx.getMessages()).toHaveLength(0);
    });

    it('clears all measurements', () => {
      ctx.clearContext();
      expect(ctx.getAllMeasurements()).toHaveLength(0);
    });
  });

  describe('parseWithContext (regex fallback)', () => {
    it('parses text and adds to history', async () => {
      const result = await ctx.parseWithContext({
        text: 'took 500 mg magnesium',
      });
      expect(result.measurements).toHaveLength(1);
      expect(result.measurements[0]).toMatchObject({
        variableName: 'Magnesium',
        value: 500,
      });
      // Should have added the user message to history
      expect(ctx.getMessages()).toHaveLength(1);
      expect(ctx.getMessages()[0].role).toBe('user');
    });

    it('accumulates measurements across calls', async () => {
      await ctx.parseWithContext({ text: 'took 500 mg magnesium' });
      await ctx.parseWithContext({ text: 'mood 4/5' });

      const allMeasurements = ctx.getAllMeasurements();
      expect(allMeasurements).toHaveLength(2);
      expect(allMeasurements[0].variableName).toBe('Magnesium');
      expect(allMeasurements[1].variableName).toBe('Overall Mood');
    });

    it('returns no followUpQuestion without API key', async () => {
      const result = await ctx.parseWithContext({
        text: 'coffee',
      });
      expect(result.followUpQuestion).toBeUndefined();
    });
  });

  describe('getSummary', () => {
    it('returns "no measurements" when empty', () => {
      expect(ctx.getSummary()).toBe('No measurements logged yet.');
    });

    it('returns formatted summary after logging', async () => {
      await ctx.parseWithContext({ text: 'took 500 mg magnesium' });
      await ctx.parseWithContext({ text: 'mood 4/5' });
      const summary = ctx.getSummary();
      expect(summary).toContain('Magnesium');
      expect(summary).toContain('500');
      expect(summary).toContain('mg');
      expect(summary).toContain('Overall Mood');
      expect(summary).toContain('4');
    });
  });

  describe('getAllMeasurements', () => {
    it('returns readonly array', async () => {
      await ctx.parseWithContext({ text: 'coffee' });
      const measurements = ctx.getAllMeasurements();
      expect(measurements).toHaveLength(1);
      // Should be readonly (TypeScript enforces at compile time)
      expect(Array.isArray(measurements)).toBe(true);
    });
  });
});
