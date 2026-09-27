import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

const ALLOWED_TAGS = [
  "a",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "ul",
];

const ALLOWED_ATTR = ["class", "href", "rel", "target", "title"];

const md = new MarkdownIt({
  html: false,
  linkify: true,
  highlight: (source: string, language: string): string => {
    if (language && hljs.getLanguage(language)) {
      try {
        const highlighted = hljs.highlight(source, {
          language,
          ignoreIllegals: true,
        }).value;
        return `<pre><code class="hljs language-${md.utils.escapeHtml(language)}">${highlighted}</code></pre>`;
      } catch {
        // Fall through to escaped plain code.
      }
    }
    return `<pre><code>${md.utils.escapeHtml(source)}</code></pre>`;
  },
});

const defaultLinkOpen = md.renderer.rules.link_open;
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index].attrSet("target", "_blank");
  tokens[index].attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options);
};

const sanitize = (html: string): string => {
  if (typeof DOMPurify.sanitize !== "function") {
    // markdown-it has HTML disabled, so this SSR fallback contains only renderer-owned markup.
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  });
};

export const renderMarkdown = (content: string | null | undefined): string => {
  if (!content) return "";
  return sanitize(md.render(content));
};

const PLATFORM_MARKER = /(#PC客户端|#安卓版)/;

export const renderUpdateLogMarkdown = (content: string | null | undefined): string => {
  if (!content) return "";

  const parts = content.split(PLATFORM_MARKER);
  let platform: "pc" | "android" | "" = "";
  let html = "";

  for (const part of parts) {
    const value = part.trim();
    if (value === "#PC客户端") {
      platform = "pc";
      continue;
    }
    if (value === "#安卓版") {
      platform = "android";
      continue;
    }
    if (!value) continue;

    const rendered = md.render(value);
    if (platform) {
      const title = platform === "pc" ? "PC客户端" : "安卓版";
      html += `<div class="platform-block ${platform}"><strong>${title}</strong><div>${rendered}</div></div>`;
      platform = "";
    } else {
      html += rendered;
    }
  }

  return sanitize(html);
};
