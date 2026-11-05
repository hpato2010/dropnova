import {only,json} from '../lib/common.js';
export default function handler(req,res){
  if(!only(req,res,'GET'))return;
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_ANON_KEY)
    return json(res,503,{error:'Configuración de autenticación pendiente.'});
  return json(res,200,{url:process.env.SUPABASE_URL,publicKey:process.env.SUPABASE_ANON_KEY});
}
