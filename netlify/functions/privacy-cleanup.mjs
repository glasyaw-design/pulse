import {getStore} from '@netlify/blobs';
import {cleanupPrivacy} from '../lib/privacy.mjs';
import {dataStoreName} from '../lib/operations.mjs';
export default async function(){
 if(process.env.PULSE_MAINTENANCE==='1')return;
 const result=await cleanupPrivacy(getStore({name:dataStoreName(),consistency:'strong'}));
 console.log('privacy_cleanup',JSON.stringify(result));
}
export const config={schedule:'0 * * * *'};
