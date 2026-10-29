PULSE SHIFT v35–v41 누적 업데이트

v34 전체 Netlify 프로젝트에 압축을 풀어 같은 경로의 파일을 덮어쓰세요.
v35 이후 개별 패치를 순서대로 적용할 필요가 없습니다. 이미 중간 패치를 적용한 프로젝트에도 덮어쓸 수 있습니다.
이 ZIP은 변경 파일만 포함하며 단독 배포용이 아닙니다. 프로젝트 전체를 배포하세요.

포함 내용
- Afterglow: 최종 1:45.62 연속 구간, 중간 접합 없음. 전 20개 채보 재작성.
- Ivory: 최종 2:00.596 재편집, 전 20개 채보 재작성.
- 전곡 채보 감수와 선율/손 집중 배치 보정.
- v41 최종 채보 기준 표시 레벨 재산정: 160개 중 155개 변경.
- 표시 레벨은 PULSE SHIFT 내부 잠정 척도이며 실플레이로 확정된 수치는 아닙니다.
- 서버 랭킹 카탈로그 및 캐시 갱신.

현재 사용 음원은 Afterglow -v39, Ivory -v36입니다. 중간에 폐기한 편집 음원은 포함하지 않습니다.
기존 -v30/-v35/-v38 음원이 폴더에 남아 있어도 새 tracks.js에서 참조하지 않습니다.

빌드 npm run build / 배포 폴더 public
레벨 상세: review/LEVELS_v41_KO.md 및 LEVELS_v41.csv
편집 음원 확인: EDIT_REVIEW.html

교체/추가 파일
- EDIT_REVIEW.html
- netlify/lib/rank-catalog.mjs
- public/audio/bittersweet-ascension-keys-v39.ogg
- public/audio/bittersweet-ascension-v39.mp3
- public/audio/dreamy-piano-bounce-keys-v36.ogg
- public/audio/dreamy-piano-bounce-v36.mp3
- public/charts/metadata.json
- public/index.html
- public/tracks.js
- review/ALL_CHARTS_v37_KO.md
- review/LEVELS_v41.csv
- review/LEVELS_v41_KO.md
- review/afterglow-v35-refinement.json
- review/afterglow-v35.json
- review/afterglow-v39-refinement.json
- review/afterglow-v39.json
- review/all-charts-v37-changes.json
- review/all-charts-v37-summary.json
- review/edit-manifest.json
- review/ivory-v36-refinement.json
- review/ivory-v36.json
- review/levels-v41-preview.jpg
