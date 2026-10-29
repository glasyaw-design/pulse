PULSE SHIFT v36 — Ivory Daydream 재편집 패치

v35(Afterglow 수정 적용본) 프로젝트 루트에 압축을 풀어 동일 경로 파일을 덮어쓰세요.
이 ZIP은 교체 파일만 포함하므로 단독 Netlify 배포용이 아닙니다.
프로젝트 전체를 커밋 후 다시 배포하세요. 빌드 npm run build / 배포 폴더 public.

Ivory Daydream
- 총 120.596초. 원곡 0:00–1:00.943 + 2:09.508–3:09.160.
- 약 144박(36마디) 생략, 원곡 엔딩 유지.
- 연결 전후 32박의 화성 진행·리듬·음량 비교, 타격 직전 120ms 잔향 크로스페이드.
- 4/5/6/7/8키 × 4난이도 총 20개 채보를 새 음원으로 재작성·검사.
- 선율 방향, 롱노트 겹침/해제 간격, 밀도 및 7키 중앙키 반복 간격 점검.
- 새 채보 ID 및 서버 랭킹 카탈로그 적용. 기존 Afterglow 수정 포함 다른 7곡은 동일.

EDIT_REVIEW.html의 Ivory Daydream 연결부 버튼으로 약 1:01 구간을 바로 확인할 수 있습니다.
분석 및 자동 검증 기반 편집입니다. 인간 청음 검수를 완료한 결과는 아닙니다.

검증: 전체 160개 채보 무결성, 빌드, 음원 디코딩,
런타임/입력/오토 기록 격리, Netlify 랭킹 계약 검사.

교체/추가 파일
- public/index.html
- public/tracks.js
- public/charts/metadata.json
- public/audio/dreamy-piano-bounce-v36.mp3
- public/audio/dreamy-piano-bounce-keys-v36.ogg
- netlify/lib/rank-catalog.mjs
- EDIT_REVIEW.html
- review/edit-manifest.json
- review/ivory-v36.json
- review/ivory-v36-refinement.json
