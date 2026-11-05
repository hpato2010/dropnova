import { createClient } from '@supabase/supabase-js';
const url=process.env.SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey=process.env.SUPABASE_ANON_KEY;
let client;
export function db(){
  if(!url||!serviceKey)throw Error('Supabase servidor sin configurar');
  return client ||= createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function authClient(){
  if(!url||!publicKey)throw Error('Supabase Auth sin configurar');
  return createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function json(res,status,body){return res.status(status).setHeader('Cache-Control','no-store').json(body)}
export function only(req,res,method){if(req.method===method)return true;res.setHeader('Allow',method);json(res,405,{error:'Método no permitido'});return false}
export function fail(res,e){console.error('dropnova API:',e?.code||'error',e?.message||'desconocido');return json(res,500,{error:'No fue posible completar esta operación.'})}
export const allowedStatuses=['pendiente','contactado','confirmado','enviado_dropi','en_transito','entregado','cancelado'];
export async function requireAdmin(req,res){
 const header=req.headers.authorization||'';
 if(!header.startsWith('Bearer ')){json(res,401,{error:'Inicia sesión para continuar.'});return null}
 const token=header.slice(7);
 if(token.length>4096){json(res,401,{error:'Sesión inválida.'});return null}
 try{
  const {data:{user},error:e}=await db().auth.getUser(token);
  if(e||!user){json(res,401,{error:'Sesión vencida o inválida.'});return null}
  const {data,error}=await db().from('administradores').select('user_id').eq('user_id',user.id).maybeSingle();
  if(error)throw error;
  if(!data){json(res,403,{error:'Esta cuenta no tiene acceso administrativo.'});return null}
  return user;
 }catch(e){fail(res,e);return null}
}
