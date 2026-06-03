# components 스킬 설명

`components`는 Figma component와 코드 component의 대응 관계를 `COMPONENTS.md`에 기록하는 스킬이다. 디자인 토큰을 만들지 않고, 페이지 구현도 하지 않는다. 이 스킬의 목적은 에이전트가 Figma 디자인을 코드로 구현할 때 어떤 기존 컴포넌트를 재사용해야 하는지 추측하지 않게 만드는 것이다.

## 담당 범위

- `COMPONENTS.md` 생성
- Figma component를 `COMPONENTS.md`에 추가 또는 갱신
- Figma component variant/property를 `Variants/Notes`에 기록
- 코드 component 경로 확인
- shadcn/ui 감지 및 component origin 분류(`shadcn` / `shadcn (customized)` / `custom`)
- 커스텀된 shadcn 컴포넌트에 `do not regenerate` 표기
- Figma 이름과 코드 이름이 다를 때 mapping note 작성
- 구현되지 않은 component를 `pending` 상태로 등록

## 언제 실행하는가

- 디자이너가 새 Figma component를 만들고 library에 publish했을 때
- 기존 Figma component의 variant, property, state가 바뀌었을 때
- 새 code component가 구현되어 `COMPONENTS.md`의 `pending` 경로를 실제 경로로 바꿔야 할 때
- shadcn/ui 컴포넌트를 설치(`npx shadcn add <name>`)해 등록해야 할 때
- 프로젝트 초기에 `COMPONENTS.md`를 처음 만들 때
- `figma-implement` 중 새 shared component가 필요하다고 판단되어 Phase 2 루프로 돌아왔을 때

## 실행하지 않는 경우

- 색상, 타이포, spacing 같은 디자인 토큰이 바뀐 경우: `design-md`를 실행한다.
- 완성된 제품 페이지 frame을 route 코드로 구현하는 경우: `figma-implement`를 실행한다.
- 단순히 `DESIGN.md`를 lint/export해야 하는 경우: `design-md`를 실행한다.

## 필요한 입력

필수 입력:

- Figma component URL 또는 Figma Components page URL

선택 입력:

- 코드베이스 경로
- 기존 `COMPONENTS.md` 경로
- 컴포넌트가 들어 있는 code directory, 예: `components/ui`, `components/sections`

URL 처리 기준:

- individual component URL: 해당 component entry만 추가 또는 갱신한다.
- full components page URL: 페이지 안의 모든 component를 한 번에 처리한다.

## 실행 요청 예시

개별 component 등록:

```text
File 1 component URL: <figma-component-url>
components 스킬 실행.
COMPONENTS.md에 이 컴포넌트를 추가하고, 코드 경로가 확인되지 않으면 pending으로 둬.
```

전체 components page 처리:

```text
File 1 Components page URL: <figma-components-page-url>
components 스킬 실행.
모든 컴포넌트를 COMPONENTS.md에 반영하고 기존 entry는 삭제하지 마.
```

pending 경로 확정:

```text
figma-implement로 COMPONENTS.md의 Button pending 항목을 구현해.
구현 후 실제 코드 경로가 components/ui/Button.tsx이면 해당 entry를 갱신해줘.
```

## 실행 순서

1. `COMPONENTS.md`가 이미 있는지 확인한다.
2. shadcn 사용 여부를 감지한다(루트 `components.json`, `components/ui`의 shadcn 스타일 파일).
3. Figma MCP로 component structure, variants, properties를 수집한다.
4. 코드베이스가 있으면 `components/` directory를 scan해 실제 component path를 확인하고 각 컴포넌트를 `shadcn` / `shadcn (customized)` / `custom`으로 분류한다.
5. `COMPONENTS.md`가 없으면 새로 만든다.
6. `COMPONENTS.md`가 있으면 해당 Figma component entry만 추가 또는 갱신한다.
7. 기존 entry는 삭제하지 않는다.
8. shadcn 컴포넌트는 `Origin`을 표시하고, 커스텀된 것은 `do not regenerate` 플래그와 바뀐 variant/props를 기록한다.
9. Figma name과 code component name이 다르면 `Variants/Notes`에 mapping note를 쓴다.
10. 이름 불일치가 중요한 경우 디자이너 또는 개발자에게 rename 필요성을 보고한다.

## 출력되는 결과

기본 산출물은 `COMPONENTS.md` 하나다.

```markdown
# Component Contract

## Lookup Order
1. COMPONENTS.md mapped Code Path
2. components/ui
3. components/sections
4. route-local components
5. new component - reason required

## Components
| Figma Name | Code Path | Origin | Variants/Notes |
|------------|-----------|--------|----------------|
| Button | components/ui/button.tsx | shadcn | variant=default/destructive/outline/ghost, size=sm/default/lg |
| Badge | components/ui/badge.tsx | shadcn (customized) | do not regenerate; 커스텀 variant=brand 추가 |
| PricingCard | components/sections/PricingCard.tsx | custom | variant=monthly/annual |

## Primitive Components
| Code Path | Origin | Role | Notes |
|-----------|--------|------|-------|
| components/ui/button.tsx | shadcn | button primitive | installable via `npx shadcn add button` |

## New Component Rule
New shared components are allowed only when existing components cannot express the required UI through props, variants, slots, or composition. Every new component must include the reason existing components are insufficient.
```

최소 요구 구조는 `Lookup Order`, `Components` table, `New Component Rule`이다. 이 프로젝트의 handoff 흐름에서는 `design-md`가 bootstrap할 수 있는 `Primitive Components` inventory도 함께 유지하는 편이 좋다.

`Origin` 컬럼은 shadcn 흐름을 위해 추가됐다. 3컬럼 형식을 유지해야 하면 같은 정보를 `Variants/Notes` 앞머리에 둔다.

## COMPONENTS.md 필드 의미

`Figma Name`:

- Figma library에 publish된 component 이름
- 가능하면 code component 이름과 동일하게 유지한다.

`Code Path`:

- 실제 project-relative code path
- 확인되지 않았거나 아직 구현되지 않았으면 `pending` (미설치 표준 shadcn 포함)

`Origin`:

- `shadcn`: 수정 안 한 표준 shadcn primitive. `npx shadcn add <name>`로 재생성 가능
- `shadcn (customized)`: 수정한 shadcn. `Variants/Notes`에 `do not regenerate` + 바뀐 variant/props 기록
- `custom`: 팀이 만든 컴포넌트

`Variants/Notes`:

- variant/property/state 정보
- Figma 이름과 code 이름이 다를 때 mapping note
- 커스텀 shadcn이면 `do not regenerate`와 로컬 variant/props 차이
- 기존 component로 표현할 수 없는 이유
- accessibility나 interaction 관련 주의점

## shadcn/ui 처리

### 감지

- 루트 `components.json`이 가장 강한 신호(shadcn CLI 설정 파일).
- `components/ui`의 kebab-case 파일(`button.tsx`, `dialog.tsx`) + `cn()`/`cva` 패턴.
- 디자이너가 공식 shadcn Figma Kit을 썼다면 컴포넌트 이름·variant·size가 shadcn props API와 일치한다.

### origin 분류

- **`shadcn`**: 프로젝트 primitive로 취급. `npx shadcn add <name>`로 설치/재생성 가능함을 note에 적는다.
- **`shadcn (customized)`**: 핵심 케이스. `do not regenerate`를 표기하고 추가/변경된 variant·props를 명시한다. 재설치하면 커스텀이 소실되기 때문이다.
- **`custom`**: shadcn과 무관한 자체 컴포넌트.

### 미설치 표준 shadcn

Figma 노드가 미설치 표준 shadcn에 대응하면 경로를 지어내지 말고 `Code Path: pending`, `Origin: shadcn`으로 두고 `install via npx shadcn add <name>` note를 단다. 실제 경로 등록은 설치 후 이뤄진다.

### 설치 직후 등록

`npx shadcn add <name>` 후 `components/ui` scan으로 새 파일을 `Primitive Components`에 등록한다. `Components`의 Figma↔code 매핑까지 채우려면 해당 Figma component URL과 함께 이 스킬을 실행한다. 코드 scan만으로는 어느 Figma component에 대응하는지 알 수 없다.

## 다른 스킬과 연계하는 방법

`design-md`와의 관계:

- `design-md`는 디자인 토큰과 component reuse policy를 만든다.
- `components`는 Figma component와 code component의 실제 mapping을 관리한다.
- `design-md` handoff mode에서 `COMPONENTS.md` 초안이 생겼더라도, 이후 component 변경은 `components`로 갱신한다.

`figma-implement`와의 관계:

- `figma-implement`는 `COMPONENTS.md`의 Lookup Order를 그대로 따른다.
- `figma-implement`는 Figma component 또는 frame 안의 component instance를 보고 `COMPONENTS.md`에서 code path를 찾는다.
- `Code Path`가 `pending`이면 page 구현에서 재사용하기 전에 component 구현 또는 mapping 확정이 필요하다.
- 구현 중 새 shared component가 필요하면 이유를 기록하고, 구현 후 `components`를 다시 실행해 `COMPONENTS.md`를 갱신한다.

## 이름 일관성 규칙

이 workflow에서는 `COMPONENTS.md`가 Figma component와 code component의 공식 매핑 문서이므로 이름 일관성이 중요하다.

```text
Figma component: Button
COMPONENTS.md:    Button -> components/ui/Button.tsx
Code file:        Button.tsx
```

이름이 다르면 에이전트가 추측하게 된다. 불일치가 필요한 경우라도 반드시 `Variants/Notes`에 명시한다. shadcn Figma Kit을 쓰면 Figma의 variant/size 이름을 shadcn props API(`variant=default/destructive/outline/secondary/ghost/link`, `size=default/sm/lg/icon`)와 정렬한다.

예시:

```markdown
| Primary CTA | components/ui/button.tsx | shadcn | maps to Button, variant=default, size=lg |
```

## 검증 방법

별도 자동 validator는 없지만 다음을 확인해야 한다.

- Figma URL에 있는 모든 component가 `COMPONENTS.md`에 entry를 가진다.
- 각 entry에 origin(`shadcn` / `shadcn (customized)` / `custom`)이 표기되어 있다.
- 커스텀 shadcn은 `do not regenerate`와 로컬 variant/props 차이가 기록되어 있다.
- 기존 entry가 의도 없이 삭제되지 않았다.
- 확인된 code path는 실제 파일로 존재한다.
- `pending`은 실제로 미구현 또는 미확인 상태(미설치 표준 shadcn 포함)에만 사용한다.
- Figma variant/property가 구현에 필요한 수준으로 기록되어 있다.
- 이름 불일치는 `Variants/Notes`에 mapping note로 남아 있다.

## 실패 또는 중단 기준

- Figma URL이 component가 아니라 일반 frame이고 component 정보를 얻을 수 없으면 target URL을 다시 요청한다.
- 코드베이스 경로가 없으면 code path를 추측하지 않고 `pending`으로 둔다.
- 기존 `COMPONENTS.md`에 같은 Figma name이 여러 entry로 충돌하면 임의 병합하지 않고 충돌을 보고한다.

## 운영상 주의점

- `COMPONENTS.md`는 누적 문서다. 한 번 실행할 때 전체를 재작성해 기존 mapping을 잃으면 안 된다.
- 새 component를 만드는 판단은 최대한 보수적으로 한다.
- `figma-implement`가 완료된 뒤에도 새 shared component가 생겼다면 `COMPONENTS.md`를 반드시 최신화해야 한다.
