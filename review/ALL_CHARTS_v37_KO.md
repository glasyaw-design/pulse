# PULSE SHIFT v37 전곡 채보 감수

8곡 × 5키 모드 × 4난이도 = 160개 검사. 18개 채보에서 선율 노트 170개 배치를 수정했습니다.

- 음원·노트 수·타격 시점·음높이 데이터·롱노트 길이 유지.
- 짧은 선율 구간을 통째로 이동하여 오르내림을 유지하고 손 집중을 완화.
- 2초 창 기준 한 손 85% 이상 집중 검출: 282 → 262개. 겹치는 창을 포함하며 서로 독립적인 구간 수는 아닙니다.
- 선율 역방향 연결 32건은 증가하지 않았습니다. 다른 충돌을 만드는 강제 수정은 하지 않았습니다.
- 같은 레인 겹침, 편집점 횡단 롱노트, 밀도 상한, 7키 중앙 반복 제한 검사 통과.
- 현재 음원에서 추출한 선율 이벤트와 전 노트 대조; 반주 노트는 대응 이벤트에서 26ms 이내. 이 검사는 청감상 싱크의 보증이 아닙니다.
- 전체 스크립트 실행, 키 입력, 오토 기록 격리, Netlify 랭킹 계약 검사 통과.
- 변경된 채보만 새 ID; 변경 없는 142개 채보는 기존 ID 유지.

혼합 음원의 자동 추출 음높이를 기준으로 한 분석입니다. 청음·사람의 플레이 감수는 완료하지 않았습니다.

|곡|키|난이도|이동한 선율 노트|
|---|---:|---|---:|
|Afterglow Ascent|5|Hard|9|
|Afterglow Ascent|4|Hard|21|
|Afterglow Ascent|7|Hard|13|
|Ivory Daydream|4|Hard|7|
|Ivory Daydream|7|Normal|6|
|Bassline Riot|5|Hard|12|
|Bassline Riot|4|Hard|12|
|Photon Rush|7|Normal|1|
|한 칸 더 가까이|5|Normal|10|
|한 칸 더 가까이|4|Normal|17|
|한 칸 더 가까이|6|Normal|6|
|한 칸 더 가까이|8|Normal|6|
|Neon Eclipse|5|Hard|11|
|Neon Eclipse|5|Expert|12|
|Neon Eclipse|4|Normal|1|
|Open Blue Sky|4|Normal|10|
|Open Blue Sky|6|Normal|8|
|Open Blue Sky|8|Normal|8|
