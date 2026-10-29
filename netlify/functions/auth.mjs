import {getStore} from '@netlify/blobs';
import {handleAuth} from '../lib/auth.mjs';
export default async function auth(request){return handleAuth(request,getStore({name:'pulse-five-ranking-v1',consistency:'strong'}))}
export const config={path:'/api/auth/:action'};
