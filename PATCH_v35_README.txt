PULSE SHIFT v35 — Afterglow Ascent 재편집 패치

기존 v34 프로젝트 루트(package.json이 있는 폴더)에 압축을 풀어 동일 경로 파일을 덮어쓰세요.
이 ZIP은 교체 파일만 포함합니다. 단독으로 Netlify에 배포하지 마세요.
기존 프로젝트 전체를 커밋하고 다시 배포하세요. 빌드 명령 npm run build / 배포 폴더 public.

변경 사항
- Afterglow Ascent: 127.094초. 원곡 0:00–1:24.280 + 2:40.787–3:23.600.
- 연결 전후 음정 진행·음량·현지 템포에 따른 리듬 비교 및 190ms 크로스페이드.
- 4/5/6/7/8키 × Easy/Normal/Hard/Expert 20개 채보 재생성·감수.
- 새 음원 기준 선율/타격 시점, 롱노트, 밀도, 7키 중앙키 반복 간격 점검.
- 새 채보 ID 및 서버 랭킹 카탈로그. 다른 7곡 데이터 동일.
- 음원 및 tracks.js 캐시 버전 변경.

확인: 프로젝트 루트의 EDIT_REVIEW.html을 열고 Afterglow Ascent의 연결부 버튼을 누르면
1:24 부근을 바로 확인할 수 있습니다. 전체 음원은 public/audio/bittersweet-ascension-v35.mp3.
분석·자동 검증 기반 편집이며 인간 청음/가사 문장 경계 검수는 완료하지 않았습니다.

검증 통과: npm run build, 전체 160개 채보 무결성, 음원 2종 디코딩,
런타임/입력/오토 모드 격리, Netlify 랭킹 계약 검사.

교체/추가 파일
- public/index.html
- public/tracks.js
- public/charts/metadata.json
- public/audio/bittersweet-ascension-v35.mp3
- public/audio/bittersweet-ascension-keys-v35.ogg
- netlify/lib/rank-catalog.mjs
- EDIT_REVIEW.html
- review/edit-manifest.json
- review/afterglow-v35.json
- review/afterglow-v35-refinement.json
