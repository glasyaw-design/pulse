import {dataStoreName,maintenanceResponse} from '../lib/operations.mjs';
import {getStore} from '@netlify/blobs';
import {handleAuth} from '../lib/auth.mjs';
export default async function auth(request){const paused=maintenanceResponse();if(paused)return paused;return handleAuth(request,getStore({name:dataStoreName(),consistency:'strong'}))}
export const config={path:'/api/auth/:action'};
