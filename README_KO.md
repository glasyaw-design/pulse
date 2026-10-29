# PULSE SHIFT — Netlify 배포 패키지

이 패키지는 최신 7곡·4/5/6/8키·112개 채보, Basic/Standard, 써클/바 노트, 이펙트 강도, 롱노트 유지 연출, FULL COMBO/ALL PERFECT 마무리 연출, 저지연 오디오 설정과 곡별 온라인 랭킹을 포함합니다.

## 권장: 랭킹까지 포함해서 배포

Node.js 22 이상을 설치하고, ZIP을 푼 폴더(이 설명서와 package.json이 있는 폴더)에서 터미널을 여세요.

```bash
npm install
npm test
npm run build
npx netlify-cli deploy --prod
```

Netlify CLI의 안내에 따라 로그인한 뒤 기존 사이트를 선택하거나 새 사이트를 만드세요. `netlify.toml`이 정적 파일 폴더 `public`과 Functions 폴더 `netlify/functions`를 지정하므로 별도 경로 설정은 필요하지 않습니다. 최신 CLI는 설정된 빌드 명령을 실행하고 정적 파일과 함수를 함께 배포합니다.

Git으로 배포하려면 이 폴더를 저장소에 올린 뒤 Netlify의 **Import an existing project**에서 연결하세요. 빌드 명령은 `npm run build`, Publish directory는 `public`입니다. Functions 설정은 netlify.toml에 있습니다.

온라인 랭킹은 Netlify Functions + Netlify Blobs를 사용합니다. SDK가 함수 실행 시 사이트 연결 정보를 자동으로 받으므로 코드에 토큰을 넣지 마세요. 처음에는 빈 랭킹이며, 실제 완주 기록만 쌓입니다. 브라우저별 플레이어 토큰으로 닉네임을 유지합니다. 첫 랭킹 등록 전 닉네임을 직접 정하며, 문자·숫자·_로 2~16자이고 대소문자를 구분하지 않아 중복 이름은 사용할 수 없습니다. 헤더의 닉네임 버튼이나 랭킹 창에서 변경할 수 있습니다. 기존 ChatGPT Sites의 랭킹 DB와 별개인 새 저장소이므로 이전 서버 순위는 자동 복사되지 않습니다.

## 드래그 앤 드롭으로 게임만 빠르게 올리기

압축을 풀고 **public 폴더 안의 index.html이 바로 보이는 그 폴더**를 Netlify Drop에 올리면 게임과 브라우저 개인 기록은 사용할 수 있습니다. 단순 정적 파일 업로드만으로는 이 패키지의 서버 함수를 배포하지 못하므로 **온라인 랭킹은 위 CLI 또는 Git 배포를 사용하세요.** 웹사이트의 업로드/빌드 방식은 Netlify UI에 따라 달라질 수 있어, 전체 기능에는 CLI/Git 경로를 권장합니다.

## 설정 위치

- F2 → 노트 모양: Bar / Circle
- F2 → 타격 이펙트: Laser / Ring / Spark / Off
- F2 → 이펙트 강도: 약하게 / 보통 / 강하게
- F2 → 미리보기: 타격·롱노트 / FULL COMBO / ALL PERFECT. 미리보기는 기록에 반영되지 않습니다.
- F2 → 오디오 지연 설정: 저지연(기본) / 안정성 우선. 샘플레이트·처리/출력 지연은 브라우저 보고값이며 기기 전체 지연의 실측값은 아닙니다.
- 웹 버전은 ASIO 드라이버를 직접 선택하지 않습니다.

저지연 설정 후에도 장치/브라우저에 따라 지연이 남을 수 있습니다. 입력 보정과 클릭 측정을 함께 사용하세요.

## 검증 범위

정적 파일 누락 검사, 게임 판정/롱노트/완주 상태 전이 검사, 랭킹 프로토콜·동점·중복 제출·점수 산식·동시 저장 조건 검사를 수행했습니다. 실제 Netlify 계정에는 배포하지 않았습니다. SDK 연결은 Netlify에서 배포한 뒤 실제 도메인의 RANKING 버튼과 완주 등록으로 확인하세요.

랭킹 서버는 시작 티켓, 경과 시간, 판정 총수, 점수 재계산을 검사합니다. 리플레이 기반의 고급 부정행위 검증은 포함하지 않습니다. 이식된 랭킹은 조건부 쓰기와 강한 일관성 읽기를 사용하지만, 대규모 이용자 수에 맞춘 별도 DB 인덱싱은 후속 작업입니다.

## 파일 구조

- public/: 바로 실행할 게임·음원·이미지
- netlify/functions/ranking.mjs: /api/ranking/:action 요청 처리
- netlify/lib/: Netlify Blobs 랭킹 서버와 현재 채보 판정 수
- scripts/: 패키지 검증과 랭킹 계약 테스트
- netlify.toml: 배포 설정
- package.json / package-lock.json: 서버 함수 의존성

## 공식 참고 문서

- https://docs.netlify.com/build/functions/configuration/
- https://docs.netlify.com/build/data-and-storage/netlify-blobs/
- https://cli.netlify.com/commands/deploy/

## 멀티키 / Chart Studio

곡 선택 화면의 4 KEY / 5 KEY / 6 KEY / 8 KEY에서 전환합니다.
기본 키: 4키 D F J K, 5키 D F Space J K, 6키 S D F J K L, 8키 A S D F J K L ;.
F2에서 모드별 키 배치를 따로 저장합니다. 8키는 양손 4개씩 사용하는 일반 8레인 방식입니다.
랭킹과 개인 최고 기록은 키 모드별로 분리합니다. 기존 5키 채보와 기록은 유지됩니다.
새 채보는 기존 분석의 멜로디 음높이·시점을 바탕으로 키 수에 맞춰 배치했습니다. 4키 Expert에서는 일부 밀집 반주 동시음을 줄였습니다.

CHART STUDIO에서 키 모드를 고르고 노트와 키음을 편집할 수 있습니다. 프로젝트 저장에는 음원도 포함되고, 이전 5키 프로젝트도 열 수 있습니다. H는 롱노트 도구이며, 각 모드 기본 키로 키음을 미리 들을 수 있습니다. 키 모드를 바꾸면 확인 후 현재 노트가 비워지므로 필요한 작업은 먼저 프로젝트로 저장하세요. 편집한 채보의 게임·온라인 랭킹 직접 등록은 지원하지 않습니다.

추가 수록곡: Photon Rush, 한 칸 더 가까이, 내일의 우리에게, Neon Eclipse. 각 곡은 약 2분 아케이드 편집본이며 원본 파일은 변경하지 않았습니다. BPM과 음높이는 혼합 음원 분석 추정치입니다.
