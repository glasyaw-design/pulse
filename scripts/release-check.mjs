import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const checks=['validate-deploy.mjs','check-auth.mjs','check-netlify-ranking.mjs','check-runtime-account.cjs','check-touch-play.cjs','check-background-play.cjs','check-loading-dialog.cjs','check-song-filters.cjs','check-compact-ranking.cjs','check-frame-pacing.cjs','check-playback-performance.cjs','check-chart-insights.cjs','check-clear-badges.cjs','check-full-chart-playthrough.cjs','check-release-config.mjs','check-backup.mjs','check-privacy.mjs'];
const results=[];
for(const script of checks){
 console.log('\nChecking '+script);
 const start=Date.now(),r=spawnSync(process.execPath,['scripts/'+script],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
 process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');
 results.push({script,passed:r.status===0,milliseconds:Date.now()-start,error:r.error?.message||null});
}
mkdirSync(root+'release-reports',{recursive:true});
writeFileSync(root+'release-reports/latest.json',JSON.stringify({checkedAt:new Date().toISOString(),automatedOnly:true,results},null,2));
const failed=results.filter(x=>!x.passed);
console.log(`\n${results.length-failed.length}/${results.length} automated checks passed. Manual release checklist remains required.`);
process.exitCode=failed.length?1:0;
