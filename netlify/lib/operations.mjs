export function dataStoreName(){return process.env.PULSE_DATA_STORE||'pulse-five-ranking-v1'}
export function maintenanceResponse(){return process.env.PULSE_MAINTENANCE==='1'?Response.json({error:'데이터 점검 중입니다. 잠시 후 다시 시도해 주세요.'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}}):null}
