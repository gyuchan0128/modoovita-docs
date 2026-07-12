// 정적 문서 사이트 생성기.
// 원본 마크다운(앱 번들 약관 + 큐레이션 원고)을 읽어 docs/ 아래 정적 HTML로 변환한다.
// 단일 소스 오브 트루스: 아래 SOURCE 경로의 .md 를 고치고 `npm run build` 하면 재생성된다.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dir = dirname(fileURLToPath(import.meta.url));
const R = (p) => resolve(__dir, p);

// 문서 원본은 앱 monorepo(형제 폴더)의 마크다운이 단일 소스. 두 폴더는 같은 상위 폴더 아래 형제로 둔다.
const APP_REPO = R("../모두의영양제");
const SOURCE = {
  legal: resolve(APP_REPO, "app/ios/SupportingFiles/LegalDocument.md"),
  curation: resolve(APP_REPO, "outputs/2026-07-06_큐레이션_1차3편_v1.md"),
};
const OUT = R("docs");

marked.setOptions({ gfm: true, breaks: false });

const SITE_NAME = "모두의영양제";
const LEGAL_META = "시행일 2026년 7월 7일 · 버전 1.0";

// --- 헬퍼 -------------------------------------------------------------------

const stripComments = (md) => md.replace(/<!--[\s\S]*?-->/g, "");

// marked 가 만든 <table> 을 가로 스크롤 래퍼로 감싼다(좁은 화면 대응).
const wrapTables = (html) =>
  html.replace(/<table>[\s\S]*?<\/table>/g, (t) => `<div class="table-scroll">${t}</div>`);

const toHtml = (md) => wrapTables(marked.parse(stripComments(md).trim()));

function page({ title, prefix = "", backlink = "", body }) {
  const back = backlink
    ? `<a class="backlink" href="${backlink.href}">← ${backlink.label}</a>\n`
    : "";
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${title} · ${SITE_NAME}</title>
<link rel="stylesheet" href="${prefix}assets/style.css">
</head>
<body>
<main class="wrap">
${back}${body}
</main>
</body>
</html>
`;
}

const write = (rel, html) => {
  const path = resolve(OUT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html, "utf8");
  console.log("  ✓", rel);
};

// --- 1. 약관 · 개인정보처리방침 (한 파일 → 두 페이지) -------------------------

function buildLegal() {
  const raw = readFileSync(SOURCE.legal, "utf8");
  const termsMarker = "# 제1부. 이용약관";
  const privacyMarker = "# 제2부. 개인정보처리방침";
  const ti = raw.indexOf(termsMarker);
  const pi = raw.indexOf(privacyMarker);
  if (ti < 0 || pi < 0 || ti > pi) throw new Error("약관 분할 마커를 찾지 못했습니다.");

  // 상단 내부 주석(공개 원문 링크 안내)은 게시본에서 제외. 파트 번호 접두사는 단독 페이지에 맞게 정리.
  const termsMd = raw.slice(ti, pi).trim().replace(termsMarker, "# 이용약관");
  const privacyMd = raw.slice(pi).trim().replace(privacyMarker, "# 개인정보처리방침");

  for (const [file, title, md] of [
    ["terms.html", "이용약관", termsMd],
    ["privacy.html", "개인정보처리방침", privacyMd],
  ]) {
    // 첫 </h1> 뒤에 시행일 메타 삽입.
    const body = toHtml(md).replace(
      "</h1>",
      `</h1>\n<p class="doc-meta">${LEGAL_META}</p>`
    );
    write(file, page({ title, body }));
  }
}

// --- 2. 영양제 상식(큐레이션): 인덱스 + 글 3편 ------------------------------

// 앱(CurationContent)의 목록 순서·제목과 1:1 대응. slug 는 안정적 파일명.
const ARTICLES = [
  { slug: "label-reading", heading: "영양제 라벨, 이렇게 읽으면 쉬워요" },
  { slug: "upper-intake", heading: "많이 먹으면 무조건 좋을까? — 상한섭취량 이야기" },
  { slug: "storage", heading: "영양제 보관, 이렇게 하면 아깝지 않아요" },
];

function splitCuration() {
  const raw = readFileSync(SOURCE.curation, "utf8");
  // 최상위(`# `) 헤딩 단위로 분해. 첫 블록은 문서 제목/주석이므로 버린다.
  const parts = raw.split(/^# /m).slice(1).map((s) => "# " + s.trim());
  const byHeading = new Map();
  for (const block of parts) {
    const heading = block.slice(2, block.indexOf("\n")).trim();
    byHeading.set(heading, block);
  }
  return byHeading;
}

function buildCuration() {
  const blocks = splitCuration();
  const knowledgeHref = "index.html"; // knowledge/ 내부 상대경로

  for (const { slug, heading } of ARTICLES) {
    const md = blocks.get(heading);
    if (!md) throw new Error(`큐레이션 글을 찾지 못했습니다: ${heading}`);
    // 델리미터로 남은 앞뒤 --- 제거.
    const clean = md.replace(/\n---\s*$/g, "").trim();
    write(
      `knowledge/${slug}.html`,
      page({
        title: heading,
        prefix: "../",
        backlink: { href: knowledgeHref, label: "영양제 상식" },
        body: toHtml(clean),
      })
    );
  }

  // 인덱스("전체 보기").
  const list = ARTICLES.map(
    (a) => `<li><a href="${a.slug}.html">${a.heading}</a></li>`
  ).join("\n");
  const body = `<h1>영양제 상식</h1>
<p class="doc-meta">영양제를 더 잘 챙기기 위한 쉬운 이야기</p>
<ul class="article-list">
${list}
</ul>`;
  write("knowledge/index.html", page({ title: "영양제 상식", prefix: "../", body }));
}

// --- 3. 루트 랜딩(사람용 허브 — 앱은 개별 페이지로 직접 진입) ---------------

function buildIndex() {
  const body = `<h1>${SITE_NAME}</h1>
<p class="doc-meta">문서 안내</p>
<ul class="article-list">
<li><a href="knowledge/">영양제 상식</a></li>
<li><a href="terms.html">이용약관</a></li>
<li><a href="privacy.html">개인정보처리방침</a></li>
</ul>`;
  write("index.html", page({ title: "문서 안내", body }));
}

// --- 실행 -------------------------------------------------------------------

console.log("build →", OUT);
buildLegal();
buildCuration();
buildIndex();
console.log("done.");
