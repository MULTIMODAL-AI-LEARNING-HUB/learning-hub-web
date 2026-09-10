/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'

/**
 * Lightweight, dependency-free Markdown renderer for AI chat answers.
 *
 * The backend Tutor returns Markdown (**bold**, * bullets, headings, links).
 * Rendering it as plain text is what produced the raw `*` / `**` artifacts
 * in the chat UI. This component supports the subset the Tutor emits:
 * fenced code blocks, headings, bullet/numbered lists, blockquotes,
 * **bold**, *italic*, `inline code`, and [links](https://...).
 *
 * Safety: the raw text is HTML-escaped FIRST, then only our own generated
 * tags are injected via dangerouslySetInnerHTML. Link URLs are restricted
 * to http(s)/mailto so `javascript:` URLs can never execute.
 */

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const renderInline = (escaped: string): string => {
  let out = escaped
  // `code` first so asterisks inside code spans are left alone
  out = out.replace(/`([^`\n]+?)`/g, '<code class="md-code">$1</code>')
  // [label](url) — http(s)/mailto only
  out = out.replace(
    /\[([^\]]+?)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
    '<a class="md-link" href="$2" target="_blank" rel="noreferrer noopener">$1</a>',
  )
  // **bold** before *italic*
  out = out.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*\w])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
  return out
}

export const renderMarkdownToHtml = (text: string): string => {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const html: string[] = []
  let inCodeBlock = false
  let inList: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (inList) {
      html.push(inList === 'ul' ? '</ul>' : '</ol>')
      inList = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (/^```/.test(line.trim())) {
      closeList()
      if (inCodeBlock) {
        html.push('</code></pre>')
        inCodeBlock = false
      } else {
        html.push('<pre class="md-pre"><code>')
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      html.push(`${escapeHtml(line)}\n`)
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      html.push(`<p class="md-h${level}">${renderInline(escapeHtml(heading[2].trim()))}</p>`)
      continue
    }

    const bullet = line.match(/^\s*[*\-•]\s+(.*)$/)
    if (bullet) {
      if (inList !== 'ul') {
        closeList()
        html.push('<ul class="md-ul">')
        inList = 'ul'
      }
      html.push(`<li>${renderInline(escapeHtml(bullet[1].trim()))}</li>`)
      continue
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ordered) {
      if (inList !== 'ol') {
        closeList()
        html.push('<ol class="md-ol">')
        inList = 'ol'
      }
      html.push(`<li>${renderInline(escapeHtml(ordered[1].trim()))}</li>`)
      continue
    }

    const quote = line.match(/^\s*>\s?(.*)$/)
    if (quote) {
      closeList()
      html.push(`<p class="md-quote">${renderInline(escapeHtml(quote[1]))}</p>`)
      continue
    }

    if (!line.trim()) {
      closeList()
      continue
    }

    closeList()
    html.push(`<p class="md-p">${renderInline(escapeHtml(line.trim()))}</p>`)
  }

  closeList()
  if (inCodeBlock) html.push('</code></pre>')
  return html.join('')
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => renderMarkdownToHtml(text), [text])
  return (
    <div
      className={className ?? 'md-body'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
