import { describe, expect, it } from 'vitest';
import { createAttachmentRecord } from '../create-attachment.js';

describe('create-attachment', () => {
  it('creates attachment records with URL content', () => {
    const record = createAttachmentRecord({
      title: 'Optimitron source analysis',
      urls: [
        'https://optimitron.com/policies/clinical-trials',
        'https://github.com/mikepsinn/optimitron',
      ],
      createdAt: '2026-03-11T00:00:00.000Z',
    });

    expect(record.$type).toBe('org.hypercerts.context.attachment');
    expect(record.content?.[0]).toEqual({
      uri: 'https://optimitron.com/policies/clinical-trials',
    });
    expect(record.contentType).toBe('evidence');
  });
});
