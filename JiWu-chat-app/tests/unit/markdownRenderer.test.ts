import { describe, expect, it } from "vitest";
import { renderMarkdown, renderUpdateLogMarkdown } from "../../untils/markdownRenderer";

const assertNoExecutableMarkup = (html: string) => {
  const container = document.createElement("div");
  container.innerHTML = html;

  expect(container.querySelector("script, iframe, object, embed, style")).toBeNull();
  expect(container.querySelector("[onerror], [onclick], [onload]")).toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
};

describe("renderMarkdown", () => {
  it("disables raw HTML and sanitizes dangerous links", () => {
    const html = renderMarkdown(
      '<img src=x onerror="alert(1)">\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))',
    );

    assertNoExecutableMarkup(html);
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
    expect(container.querySelector("a")).toBeNull();
  });

  it("keeps syntax highlighting markup for fenced code", () => {
    const html = renderMarkdown("```js\nconst safe = true;\n```");

    expect(html).toContain('class="hljs language-js"');
    expect(html).toContain("hljs-keyword");
    assertNoExecutableMarkup(html);
  });

  it("adds safe external-link attributes", () => {
    const html = renderMarkdown("[example](https://example.com)");
    const container = document.createElement("div");
    container.innerHTML = html;
    const link = container.querySelector("a");

    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("renderUpdateLogMarkdown", () => {
  it("preserves platform blocks while sanitizing their Markdown", () => {
    const html = renderUpdateLogMarkdown(
      "通用说明\n\n#PC客户端\n- PC 修复\n\n#安卓版\n<img src=x onerror=alert(1)>\n\n- 安卓修复",
    );
    const container = document.createElement("div");
    container.innerHTML = html;

    expect(container.querySelector(".platform-block.pc strong")?.textContent).toBe("PC客户端");
    expect(container.querySelector(".platform-block.android strong")?.textContent).toBe("安卓版");
    expect(container.textContent).toContain("安卓修复");
    assertNoExecutableMarkup(html);
  });
});
