import { getStore } from '@netlify/blobs';
import { handleBlobRanking } from '../lib/ranking.mjs';
export default async function ranking(request){return handleBlobRanking(request,getStore({name:'pulse-five-ranking-v1',consistency:'strong'}))}
export const config={path:'/api/ranking/:action'};
