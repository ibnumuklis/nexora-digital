import type { ReactNode } from 'react';

/**
 * Minimal, XSS-safe Markdown subset renderer for CMS articles. Produces React elements only
 * (no raw HTML). Supports: ## / ### headings, paragraphs, "- " lists, **bold**, *italic*,
 * `code`, and [text](https://link) with http(s) URLs only.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k} className="rounded bg-surface-2 px-1.5 py-0.5 text-[13px]">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const label = tok.slice(1, tok.indexOf(']'));
      const href = tok.slice(tok.indexOf('(') + 1, -1);
      const external = href.startsWith('http');
      out.push(<a key={k} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{label}</a>);
    } else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(src: string): ReactNode[] {
  const blocks = src.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const b = block.trim();
    if (!b) return null;
    if (b.startsWith('### ')) return <h3 key={bi}>{inline(b.slice(4), `h${bi}`)}</h3>;
    if (b.startsWith('## ')) return <h2 key={bi}>{inline(b.slice(3), `h${bi}`)}</h2>;
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*[-*] /.test(l))) {
      return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-*] /, ''), `l${bi}-${li}`)}</li>)}</ul>;
    }
    return <p key={bi}>{lines.flatMap((l, li) => (li ? [<br key={`br${li}`} />, ...inline(l, `p${bi}-${li}`)] : inline(l, `p${bi}-${li}`)))}</p>;
  });
}
