# modoovita-docs — 모두의영양제 공개 문서 사이트

앱(iOS·Android) WebView가 로드하는 **이용약관 · 개인정보처리방침 · 영양제 상식** 정적 문서.
Notion을 대체해 상단 네비게이션 바 없이 **순수 문서**만 보여준다.

이 저장소는 앱 monorepo(`../모두의영양제`)와 **형제 폴더**로 둔다. 빌드 시 앱 repo의 마크다운을
원본으로 읽으므로, 두 폴더는 같은 상위 폴더(`/Volumes/AI-Projects/`) 아래에 나란히 있어야 한다.

## URL 매핑 (배포 후)

| 문서 | URL |
|---|---|
| 이용약관 | https://gyuchan0128.github.io/modoovita-docs/terms.html |
| 개인정보처리방침 | https://gyuchan0128.github.io/modoovita-docs/privacy.html |
| 영양제 상식(전체 보기) | https://gyuchan0128.github.io/modoovita-docs/knowledge/ |
| · 영양제 라벨… | …/knowledge/label-reading.html |
| · 상한섭취량 이야기 | …/knowledge/upper-intake.html |
| · 영양제 보관… | …/knowledge/storage.html |

이 URL들은 앱 코드에 하드코딩되어 있다(`LegalDocument`, `CurationContent` — iOS/Android).
경로(`modoovita-docs`)나 host를 바꾸면 앱의 해당 상수도 함께 고쳐야 한다.

## 구조

```
모두의영양제-docs/          ← 이 저장소(GitHub: modoovita-docs)
  build.mjs               생성기: 원본 .md → docs/*.html
  docs/                   ← GitHub Pages 소스(이 폴더가 그대로 서빙됨)
    index.html            루트 안내(사람용 허브)
    terms.html
    privacy.html
    knowledge/            영양제 상식(인덱스 + 글 3편)
    assets/style.css
    .nojekyll
  serve.mjs               로컬 미리보기 서버(node serve.mjs → http://localhost:4321)
```

## 콘텐츠 수정 → 재생성

문서 원본은 **앱 repo(`../모두의영양제`)의 마크다운이 단일 소스**다(중복 작성 금지).

- 약관·방침: `../모두의영양제/app/ios/SupportingFiles/LegalDocument.md`
  (Android 번들 `.../app/android/.../assets/legal_document.md`와 바이트 동일 유지)
- 영양제 상식: `../모두의영양제/outputs/2026-07-06_큐레이션_1차3편_v1.md`

수정 후 (이 저장소 루트에서):

```bash
npm install      # 최초 1회
npm run build    # docs/ 재생성
node serve.mjs   # 로컬 확인(선택) → http://localhost:4321
git add -A && git commit -m "docs: 내용 갱신"
git push
```

새 글 추가 시: 원본 md에 글 추가 → `build.mjs`의 `ARTICLES`에 slug/제목 추가 →
앱 `CurationContent`의 `articles`에도 동일 slug/URL 추가.

## 배포 (GitHub Pages)

원격은 이미 연결되어 있다(`origin` = `git@github.com:gyuchan0128/modoovita-docs.git`).

1. 최초 push (이 저장소 루트에서):

   ```bash
   git add -A
   git commit -m "정적 문서 사이트 초기본"
   git branch -M main
   git push -u origin main
   ```

2. GitHub → 저장소 **Settings → Pages** →
   **Source: Deploy from a branch**, **Branch: `main` / `/docs`** → Save.
3. 1~2분 후 https://gyuchan0128.github.io/modoovita-docs/ 접속 확인.
