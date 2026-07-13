import { describe, it, expect } from 'vitest';
import { escapeHtml, truncate, replySubject, formatInbound, formatLead } from './format.js';

describe('escapeHtml', () => {
  it('escapes angle brackets and ampersands', () => {
    expect(escapeHtml('a & <b> c')).toBe('a &amp; &lt;b&gt; c');
  });
});

describe('truncate', () => {
  it('leaves short strings alone', () => {
    expect(truncate('short', 10)).toBe('short');
  });
  it('cuts long strings and adds ellipsis', () => {
    expect(truncate('abcdef', 3)).toBe('abc…');
  });
});

describe('replySubject', () => {
  it('prefixes Re:', () => {
    expect(replySubject('Вопрос')).toBe('Re: Вопрос');
  });
  it('does not double-prefix', () => {
    expect(replySubject('Re: Вопрос')).toBe('Re: Вопрос');
    expect(replySubject('RE: x')).toBe('RE: x');
  });
  it('handles empty subject', () => {
    expect(replySubject('')).toBe('Re: (без темы)');
  });
});

describe('formatInbound', () => {
  const base = {
    from: 'client@example.com',
    fromAddress: 'client@example.com',
    to: 'hello@met4.ru',
    subject: 'Привет',
    text: 'Тело письма',
    attachmentCount: 0,
    messageId: null,
  };

  it('includes headers and body', () => {
    const out = formatInbound(base, 3000);
    expect(out).toContain('client@example.com');
    expect(out).toContain('hello@met4.ru');
    expect(out).toContain('Привет');
    expect(out).toContain('Тело письма');
  });

  it('shows attachment count when present', () => {
    expect(formatInbound({ ...base, attachmentCount: 2 }, 3000)).toContain('Вложений:</b> 2');
  });

  it('escapes html in the body', () => {
    expect(formatInbound({ ...base, text: '<script>' }, 3000)).toContain('&lt;script&gt;');
  });

  it('truncates a long body', () => {
    const out = formatInbound({ ...base, text: 'x'.repeat(50) }, 10);
    expect(out).toContain('…');
  });
});

describe('formatLead', () => {
  it('renders labelled fields', () => {
    const out = formatLead({ type: 'contact', fields: { name: 'Иван', email: 'i@e.com' } });
    expect(out).toContain('Новая заявка');
    expect(out).toContain('contact');
    expect(out).toContain('Имя:</b> Иван');
    expect(out).toContain('Email:</b> i@e.com');
  });
});
