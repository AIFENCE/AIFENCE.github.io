// SPDX-License-Identifier: AGPL-3.0-or-later
// Builds the AIFENCE documentation wiki from docs/*.md into site/.
//
// The Markdown converter is deliberately dependency-free: the subset used
// across docs/ is small and fixed, so a vendored converter is cheaper to audit
// than a toolchain. Syntax highlighting is the one thing worth pulling in, and
// it comes from a CDN pinned to an exact version with a Subresource Integrity
// hash, so a compromised CDN cannot change what executes here.
//
// Every emitted link is relative, so the site renders correctly from a domain
// root or from any sub-path.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "docs");
const OUT = join(ROOT, "site");

// Sidebar order. Anything not listed is appended alphabetically under "More".
const NAV = [
  ["Overview", ["index", "getting-started", "fence-flow"]],
  ["Tiers", ["quality", "guard", "bus"]],
  ["Reference", ["api", "configuration", "architecture", "glossary"]],
  ["Assurance", ["evaluation", "security"]],
  ["Running it", ["deployment", "operations", "sdk"]],
];

const HLJS = {
  src: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.2/highlight.min.js",
  sri: "sha512-VSPLUv/n1Bmn+4zoxBNwpuFAO3//79I0Aax/qHDx24R47vylPcc9PrHDCqlePwHnh3joiM7/YTQhcXyQAAxvPQ==",
};

// Fence languages mapped to what highlight.js calls them. Anything absent here
// is left unhighlighted: the docs use fenced blocks for ASCII diagrams and
// directory trees too, and guessing at those mangles them.
const LANGS = { bash: "bash", sh: "bash", shell: "bash", json: "json", jsonc: "json", yaml: "yaml", yml: "yaml", python: "python", sql: "sql", ini: "ini", diff: "diff" };

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => esc(s).replace(/"/g, "&quot;");

function parseFrontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  let key = null;
  for (const raw of match[1].split(/\r?\n/)) {
    const nested = /^\s{2,}(\S[^:]*):\s*(.*)$/.exec(raw);
    if (nested && key) {
      (meta[key] ||= {})[nested[1].trim()] = nested[2].trim();
      continue;
    }
    const top = /^(\w[\w-]*):\s*(.*)$/.exec(raw);
    if (top) {
      key = top[1];
      meta[key] = top[2] === "" ? {} : top[2];
    }
  }
  return { meta, body: text.slice(match[0].length) };
}

const slug = (s) =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="13" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>',
};

// Inlined as a data URI so the tab icon costs no extra request and the site
// stays a directory of pages with no binary assets.
const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<rect width="32" height="32" rx="7" fill="#0d9488"/>' +
      '<path d="M16 5.5l8.5 3.2v7.1c0 5.3-3.6 9.2-8.5 10.7-4.9-1.5-8.5-5.4-8.5-10.7V8.7z" fill="#fff"/>' +
      '<path d="M11.5 15.5h9M16 11v9" stroke="#0d9488" stroke-width="1.8" stroke-linecap="round"/>' +
      "</svg>"
  );

// --- inline markdown ---------------------------------------------------------
function inline(text) {
  const codes = [];
  let out = text.replace(/`([^`]+)`/g, (_m, code) => {
    codes.push(`<code>${esc(code)}</code>`);
    return ` ${codes.length - 1} `;
  });
  out = esc(out);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
    let target = href;
    if (/^[\w./-]+\.md(#.*)?$/.test(href)) {
      target = href.replace(/\.md/, ".html"); // docs link to each other by file
    }
    const external = /^https?:/.test(target);
    const attrs = external ? ' rel="noopener" target="_blank"' : "";
    return `<a href="${target}"${attrs}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return out.replace(/ (\d+) /g, (_m, i) => codes[Number(i)]);
}

// --- block markdown ----------------------------------------------------------
function render(body) {
  const lines = body.split(/\r?\n/);
  const html = [];
  const headings = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      const hl = LANGS[lang];
      const cls = hl ? ` class="language-${hl}"` : ' class="nohighlight"';
      const label = lang ? `<span class="codelang">${esc(lang)}</span>` : "";
      html.push(
        `<div class="codewrap"><div class="codebar">${label}` +
          `<button class="copybtn" type="button" aria-label="Copy code">${ICON.copy}</button></div>` +
          `<pre class="code"><code${cls}>${esc(buf.join("\n"))}</code></pre></div>`
      );
      continue;
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      const id = slug(title);
      if (level <= 3) headings.push({ level, title, id });
      const link =
        level <= 3
          ? `<a class="anchor" href="#${id}" aria-label="Link to this section">#</a>`
          : "";
      html.push(`<h${level} id="${id}">${link}${inline(title)}</h${level}>`);
      i++;
      continue;
    }

    if (/^\|/.test(line) && /^\|[\s:|-]+\|$/.test(lines[i + 1] || "")) {
      const cells = (row) =>
        row.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      html.push(
        `<div class="tablewrap"><table><thead><tr>${head
          .map((c) => `<th>${inline(c)}</th>`)
          .join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      }
      html.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      }
      html.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      html.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{2,4}\s|```|\||>|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) {
      para.push(lines[i++]);
    }
    if (para.length) html.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return { html: html.join("\n"), headings };
}

// --- page shell --------------------------------------------------------------
function infobox(meta) {
  if (!meta.infobox || typeof meta.infobox !== "object") return "";
  const rows = Object.entries(meta.infobox)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${inline(String(v))}</td></tr>`)
    .join("");
  return `<aside class="infobox"><table><caption>${esc(meta.title || "")}</caption>${rows}</table></aside>`;
}

function contents(headings) {
  if (headings.length < 3) return '<aside class="toc"></aside>';
  const items = headings
    .map((h) => `<li class="lv${h.level}"><a href="#${h.id}">${inline(h.title)}</a></li>`)
    .join("");
  return `<aside class="toc"><h2>On this page</h2><ol>${items}</ol></aside>`;
}

function sidebar(pages, currentSlug) {
  const known = new Set(NAV.flatMap(([, s]) => s));
  const extra = pages.map((p) => p.slug).filter((s) => !known.has(s)).sort();
  const groups = extra.length ? [...NAV, ["More", extra]] : NAV;
  const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));
  return groups
    .map(([label, slugs]) => {
      const items = slugs
        .filter((s) => bySlug[s])
        .map((s) => {
          const active = s === currentSlug ? ' class="active" aria-current="page"' : "";
          const href = s === "index" ? "index.html" : `${s}.html`;
          return `<li><a href="${href}"${active}>${esc(bySlug[s].title)}</a></li>`;
        })
        .join("");
      return items ? `<h3>${esc(label)}</h3><ul>${items}</ul>` : "";
    })
    .join("");
}

// Applied before first paint so a reader who chose a theme never sees the other
// one flash first.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("aifence-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

const BEHAVIOUR = `
document.addEventListener("DOMContentLoaded", function () {
  if (window.hljs) {
    document.querySelectorAll("pre.code code[class^='language-']").forEach(function (el) {
      try { hljs.highlightElement(el); } catch (e) {}
    });
  }

  // Theme toggle. Three states are possible, but the button only ever needs to
  // flip away from what is currently showing.
  var root = document.documentElement;
  var toggle = document.getElementById("theme");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var dark = getComputedStyle(root).getPropertyValue("color-scheme").trim() === "dark";
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("aifence-theme", next); } catch (e) {}
    });
  }

  // Mobile section nav.
  var navBtn = document.getElementById("navtoggle");
  var nav = document.querySelector(".sidebar");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", String(open));
    });
  }

  // Copy buttons.
  document.querySelectorAll(".copybtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pre = btn.closest(".codewrap").querySelector("pre.code");
      navigator.clipboard.writeText(pre.innerText).then(function () {
        btn.classList.add("copied");
        setTimeout(function () { btn.classList.remove("copied"); }, 1200);
      });
    });
  });

  // Highlight the contents entry for the section currently on screen.
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (links.length && "IntersectionObserver" in window) {
    var seen = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
      var current = null;
      links.forEach(function (a) {
        var id = a.getAttribute("href").slice(1);
        if (seen[id] && !current) current = a;
        a.classList.remove("active");
      });
      if (current) current.classList.add("active");
    }, { rootMargin: "-80px 0px -70% 0px" });
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) obs.observe(el);
    });
  }

  // Search. The index is fetched once, on first use.
  var dlg = document.getElementById("searchdlg");
  var openBtn = document.getElementById("searchbtn");
  var input = document.getElementById("searchq");
  var out = document.getElementById("searchres");
  var note = document.getElementById("searchnote");
  var index = null;

  function load() {
    if (index) return Promise.resolve(index);
    return fetch("search.json").then(function (r) { return r.json(); }).then(function (d) {
      index = d;
      return d;
    }).catch(function () { index = []; return index; });
  }

  function run(q) {
    q = q.trim().toLowerCase();
    out.innerHTML = "";
    if (!q) { note.textContent = "Type to search " + (index ? index.length : 0) + " pages."; note.hidden = false; return; }
    var terms = q.split(/\\s+/);
    var hits = [];
    (index || []).forEach(function (p) {
      var hay = (p.title + " " + p.summary + " " + p.headings.map(function (h) { return h.t; }).join(" ") + " " + p.text).toLowerCase();
      if (!terms.every(function (t) { return hay.indexOf(t) !== -1; })) return;
      var score = 0;
      terms.forEach(function (t) {
        if (p.title.toLowerCase().indexOf(t) !== -1) score += 10;
        if (p.summary.toLowerCase().indexOf(t) !== -1) score += 4;
      });
      var sub = null;
      for (var i = 0; i < p.headings.length; i++) {
        if (terms.every(function (t) { return p.headings[i].t.toLowerCase().indexOf(t) !== -1; })) { sub = p.headings[i]; break; }
      }
      hits.push({ p: p, score: score + (sub ? 6 : 0), sub: sub });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    if (!hits.length) { note.textContent = "No matches."; note.hidden = false; return; }
    note.hidden = true;
    hits.slice(0, 12).forEach(function (h, i) {
      var li = document.createElement("li");
      if (i === 0) li.className = "sel";
      var a = document.createElement("a");
      a.href = h.p.url + (h.sub ? "#" + h.sub.id : "");
      a.innerHTML = '<span class="t"></span><span class="s"></span>';
      a.querySelector(".t").textContent = h.p.title + (h.sub ? " › " + h.sub.t : "");
      a.querySelector(".s").textContent = h.p.summary;
      li.appendChild(a);
      out.appendChild(li);
    });
  }

  function open() {
    if (!dlg.open) dlg.showModal();
    input.value = "";
    load().then(function () { run(""); });
    input.focus();
  }

  if (openBtn) openBtn.addEventListener("click", open);
  document.addEventListener("keydown", function (e) {
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))) {
      e.preventDefault();
      open();
    }
  });
  if (input) {
    input.addEventListener("input", function () { run(input.value); });
    input.addEventListener("keydown", function (e) {
      var sel = out.querySelector("li.sel");
      if (e.key === "Enter" && sel) { e.preventDefault(); sel.querySelector("a").click(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        var items = Array.prototype.slice.call(out.querySelectorAll("li"));
        var at = items.indexOf(sel);
        var next = items[e.key === "ArrowDown" ? Math.min(at + 1, items.length - 1) : Math.max(at - 1, 0)];
        if (next) { if (sel) sel.classList.remove("sel"); next.classList.add("sel"); next.scrollIntoView({ block: "nearest" }); }
      }
    });
  }
});
`;

function page({ meta, content, headings, pages, slugName }) {
  const title = meta.title || slugName;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — AIFENCE</title>
<meta name="description" content="${attr(meta.summary || "")}">
<meta property="og:title" content="${attr(title)} — AIFENCE">
<meta property="og:description" content="${attr(meta.summary || "")}">
<meta property="og:type" content="article">
<link rel="icon" href="${FAVICON}">
<script>${THEME_BOOT}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="style.css">
<script defer src="${HLJS.src}" integrity="${HLJS.sri}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  <button class="iconbtn navtoggle" id="navtoggle" type="button" aria-label="Sections" aria-expanded="false">${ICON.menu}</button>
  <a class="wordmark" href="index.html"><span>AI</span>FENCE</a>
  <span class="tagline">One governed fence around AI agents</span>
  <button class="searchbtn" id="searchbtn" type="button">${ICON.search}<span class="lbl">Search</span><kbd>/</kbd></button>
  <button class="iconbtn" id="theme" type="button" aria-label="Toggle theme">${ICON.sun}</button>
  <a class="repo" href="https://github.com/AIFENCE/AIFENCE" rel="noopener" target="_blank">${ICON.github}<span>GitHub</span></a>
</header>
<div class="layout">
  <nav class="sidebar" aria-label="Sections">${sidebar(pages, slugName)}</nav>
  <main class="article" id="main">
    <h1>${esc(title)}</h1>
    ${meta.summary ? `<p class="lede">${inline(String(meta.summary))}</p>` : ""}
    ${infobox(meta)}
    ${content}
    <footer class="pagefoot">
      <p>AIFENCE is dual-licensed under AGPL-3.0-or-later or a commercial licence.
      Source: <a href="https://github.com/AIFENCE/AIFENCE" rel="noopener" target="_blank">AIFENCE/AIFENCE</a>.</p>
      <p><a href="https://github.com/AIFENCE/AIFENCE.github.io/edit/main/docs/${slugName}.md" rel="noopener" target="_blank">Edit this page</a></p>
    </footer>
  </main>
  ${contents(headings)}
</div>
<dialog class="searchdlg" id="searchdlg">
  <input id="searchq" type="search" placeholder="Search the documentation" aria-label="Search the documentation" autocomplete="off">
  <p class="searchnote" id="searchnote"></p>
  <ul class="searchres" id="searchres"></ul>
</dialog>
<script>${BEHAVIOUR}</script>
</body>
</html>`;
}

// --- build -------------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = readdirSync(DOCS).filter((f) => f.endsWith(".md"));
const parsed = files.map((file) => {
  const slugName = file.replace(/\.md$/, "");
  const { meta, body } = parseFrontMatter(readFileSync(join(DOCS, file), "utf8"));
  return { file, slug: slugName, title: meta.title || slugName, meta, body };
});

const index = [];
for (const doc of parsed) {
  const { html, headings } = render(doc.body);
  writeFileSync(
    join(OUT, `${doc.slug}.html`),
    page({ meta: doc.meta, content: html, headings, pages: parsed, slugName: doc.slug }),
    "utf8"
  );
  index.push({
    url: `${doc.slug}.html`,
    title: doc.title,
    summary: String(doc.meta.summary || ""),
    headings: headings.map((h) => ({ t: h.title, id: h.id })),
    // Prose only: fenced blocks and tables are mostly identifiers, and letting
    // them into the index buries real matches.
    text: doc.body.replace(/```[\s\S]*?```/g, " ").replace(/^\|.*$/gm, " ").replace(/\s+/g, " ").slice(0, 4000),
  });
}

writeFileSync(join(OUT, "search.json"), JSON.stringify(index), "utf8");
writeFileSync(join(OUT, "style.css"), readFileSync(join(ROOT, "tooling", "wiki.css"), "utf8"));
writeFileSync(join(OUT, ".nojekyll"), "", "utf8");

console.log(`wiki: ${parsed.length} pages -> site/`);
