import {dataStoreName,maintenanceResponse} from '../lib/operations.mjs';
import { getStore } from '@netlify/blobs';
import { handleBlobRanking } from '../lib/ranking.mjs';
export default async function ranking(request){const paused=maintenanceResponse();if(paused)return paused;return handleBlobRanking(request,getStore({name:dataStoreName(),consistency:'strong'}))}
export const config={path:'/api/ranking/:action'};
