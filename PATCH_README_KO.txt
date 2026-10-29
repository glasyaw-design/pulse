PULSE SHIFT v12 채보 패치 — 변경 파일만

대상: 7곡·112채보가 들어 있는 기존 PULSE_SHIFT_Netlify 패키지.
1. 기존 프로젝트를 백업하세요.
2. 이 ZIP을 기존 프로젝트 루트(public, netlify 폴더가 있는 위치)에 풀어 같은 경로의 파일 4개를 덮어쓰세요.
3. npm test 후 기존 방식으로 다시 배포하세요. 온라인 랭킹은 Netlify Functions도 함께 배포해야 합니다.

음원·이미지·설정·판정·키 배치는 변경하지 않습니다.
단일 PULSE_SHIFT_Play.html에 적용하는 패치가 아닙니다.
새 채보는 v12 기록으로 구분됩니다. 기존 점수는 삭제하지 않으며 새 채보 점수로 이관하지 않습니다.

4KEY: 핵심 선율과 리듬 압축, 양손 교대와 간결한 동시치기.
5KEY: 중앙 리듬 키와 선율 연결.
6KEY: 프레이즈별 선율/반주 손 배분과 응답.
8KEY: 반주 타격과 복합 동시치기 강화. 들리는 음 이상으로 임의 노트를 채우지 않습니다.

곡별 Expert 노트 수 (4K / 5K / 6K / 8K)
Afterglow Ascent: 853 / 928 / 1016 / 1095
Ivory Daydream: 685 / 722 / 742 / 751
Bassline Riot: 796 / 932 / 963 / 989
Photon Rush: 1175 / 1213 / 1264 / 1318
한 칸 더 가까이: 679 / 719 / 724 / 727
내일의 우리에게: 687 / 717 / 721 / 730
Neon Eclipse: 900 / 1093 / 1145 / 1172

포함 파일:
public/tracks.js
public/game.js
public/charts/metadata.json
netlify/lib/rank-catalog.mjs