import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('SEO & Discoverability Metadata (AUD-020)', () => {
  it('generates valid robots.txt configuration with disallow rules for sensitive routes', () => {
    const config = robots();
    expect(config.sitemap).toContain('/sitemap.xml');
    expect(Array.isArray(config.rules)).toBe(true);

    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules.allow).toContain('/problems');
    expect(rules.disallow).toContain('/admin/');
    expect(rules.disallow).toContain('/api/');
  });

  it('generates sitemap with core indexable platform URLs', () => {
    const items = sitemap();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(4);

    const urls = items.map((i) => i.url);
    expect(urls.some((u) => u.endsWith('/problems'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/contests'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/leaderboard'))).toBe(true);
  });
});
