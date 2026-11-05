import {authClient,db,only,json,fail} from '../../lib/common.js';
export default async function handler(req,res){
 if(!only(req,res,'POST'))return;
 const email=typeof req.body?.email==='string'?req.body.email.trim().slice(0,254):'';
 const password=typeof req.body?.password==='string'?req.body.password:'';
 if(!email.includes('@')||password.length<8||password.length>256)return json(res,400,{error:'Credenciales inválidas.'});
 try{
  const {data,error}=await authClient().auth.signInWithPassword({email,password});
  if(error||!data.user||!data.session)return json(res,401,{error:'Correo o contraseña incorrectos.'});
  const {data:admin,error:ae}=await db().from('administradores').select('user_id').eq('user_id',data.user.id).maybeSingle();if(ae)throw ae;
  if(!admin)return json(res,403,{error:'Usuario sin autorización administrativa.'});
  return json(res,200,{access_token:data.session.access_token,expires_at:data.session.expires_at});
 }catch(e){return fail(res,e)}
}
