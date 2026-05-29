# 디자인-코드 핸드오프 워크플로우

디자이너-개발자-AGENT 협업 플로우.

---

## 전제 조건

- Figma 파일 2개로 분리
  - **File 1**: 디자인 시스템(색상/타이포/간격) + 컴포넌트 라이브러리
  - **File 2**: 실제 제품 페이지 (File 1의 컴포넌트 인스턴스로 구성)
- Figma Professional 플랜 (Code Connect CLI 없음 → COMPONENTS.md로 대체)
- 디자이너: Full 시트 / 개발자: Dev 시트
- 에이전트: Figma MCP 연결

---

## Phase 1 — 디자인 시스템 수립

> **트리거**: 프로젝트 시작 또는 색상/타이포/간격 등 디자인 토큰 변경 시
> **스킬**: `design-md`
> **입력**: File 1의 Foundations/Design System 페이지 URL

**개발자 → 에이전트**
```
File 1 URL (foundations 페이지): <url>
design-md 스킬 실행
```

**에이전트 산출물**

| 파일 | 소비자 |
|------|--------|
| `DESIGN.md` | 에이전트, 개발자 |
| `tokens.studio.global.json` | 디자이너 (Tokens Studio import) |
| `tailwind.theme.css` | 개발자 (globals.css에 import) |

**검토**
- 개발자: tailwind.theme.css를 globals.css에 import
- 디자이너: tokens.studio.global.json을 Tokens Studio에 import, 토큰 이름/역할 확인

---

## Phase 2 — 컴포넌트 계약 수립

> **트리거**: 컴포넌트 추가 또는 수정 시마다 반복 실행
> **스킬**: `components`
> **입력**: File 1의 컴포넌트 URL (개별) 또는 Components 페이지 URL (전체)

Phase 2는 루프 구조다. 컴포넌트가 추가될 때마다 반복한다.

```
디자이너: Figma 컴포넌트 제작
       ↓
개발자: components 스킬 실행 → COMPONENTS.md 업데이트
       ↓
개발자(또는 에이전트): 코드 컴포넌트 구현 → COMPONENTS.md 경로 확정
       ↓
(새 컴포넌트가 필요하면 처음으로 돌아감)
```

### Step 2-1. 디자이너: Figma 컴포넌트 제작

- Phase 1에서 import한 토큰 사용 (raw 값 직접 사용 금지)
- variant/property 이름을 코드 props와 일치: `variant=primary`, `size=md`, `state=disabled`
- 완성 후 **Publish to library** (Full 시트만 가능)
- 인스턴스 detach 금지

### Step 2-2. 개발자 → 에이전트: components 스킬 실행

```
File 1 컴포넌트 URL (또는 Components 페이지 URL): <url>
components 스킬 실행
```

**에이전트 산출물**

| 파일 | 내용 |
|------|------|
| `COMPONENTS.md` | Figma 이름 ↔ 코드 경로 매핑 테이블 (최초 실행 시 신규 생성, 이후 누적 업데이트) |

최초 생성 시 코드 경로는 `pending` 상태.

### Step 2-3. 개발자(또는 에이전트): 코드 컴포넌트 구현

에이전트에게 위임 가능:
```
COMPONENTS.md의 pending 항목 보고
Figma URL에서 컴포넌트 구조/variants 파악해서 구현해줘
```

구현 완료 후 COMPONENTS.md에서 `pending` → 실제 경로로 업데이트.

```markdown
| Button | components/ui/Button.tsx | variant=primary/ghost, size=sm/md |
```

---

## Phase 3 — 제품 페이지 디자인

> **트리거**: 구현할 기능/페이지가 확정되었을 때
> **담당**: 디자이너
> **입력**: File 1 라이브러리 (Phase 2에서 완성된 컴포넌트들)

**디자이너: File 2에서 작업**
- File 2에서 File 1 라이브러리 활성화 (Assets → Libraries → File 1 enable)
- 라이브러리 컴포넌트 인스턴스로 페이지 구성 (raw frame 금지)
- 배포 수준 디테일 완성

**완료 후 개발자에게 전달**
- File 2의 해당 frame URL (node-id 포함)

---

## Phase 4 — 구현

> **트리거**: 디자이너가 제품 페이지 완성 후 URL 전달
> **스킬**: `figma-implement`
> **입력**: File 2 frame URL + DESIGN.md + COMPONENTS.md

**개발자 → 에이전트**
```
Figma URL: <File 2 frame URL, node-id 포함>
Route: app/[route]/page.tsx
Use DESIGN.md, tailwind.theme.css, COMPONENTS.md.
Do not create new shared components unless existing ones cannot express the design.
After implementation, compare screenshot against Figma.
```

**에이전트**
1. Figma MCP로 frame 구조, screenshot, asset 수집
2. COMPONENTS.md Lookup Order 준수
3. 기존 컴포넌트 재사용 우선
4. 신규 컴포넌트 필요 시 이유 기록 후 생성 → Phase 2 루프로 COMPONENTS.md 업데이트
5. Screenshot 비교 QA

---

## 스킬 요약

| 스킬 | 입력 | 출력 | 실행 빈도 |
|------|------|------|----------|
| `design-md` | File 1 Foundations URL | DESIGN.md, tokens, css | 드물게 |
| `components` | File 1 Component URL | COMPONENTS.md | 컴포넌트 변경 시마다 |
| `figma-implement` | File 2 Frame URL | 코드 + screenshot QA | 기능/페이지 구현 시마다 |

---

## 이름 일관성 규칙

Code Connect 없이 에이전트가 컴포넌트를 매칭하려면 이름이 일치해야 한다.

```
Figma 컴포넌트명: "Button"
COMPONENTS.md:    Button → components/ui/Button.tsx
코드 파일명:      Button.tsx
```

세 곳의 이름이 다르면 에이전트가 추측에 의존하게 된다.
이름 불일치가 발견되면 components 스킬이 COMPONENTS.md에 매핑 메모를 남기고
디자이너 또는 개발자에게 이름 정렬을 요청한다.
