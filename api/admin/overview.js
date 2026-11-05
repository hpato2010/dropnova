import {db,only,json,fail,requireAdmin} from '../../lib/common.js';
export default async function handler(req,res){
 if(!only(req,res,'GET')||!await requireAdmin(req,res))return;
 try{const {data,error}=await db().from('pedidos').select('estado,total').limit(10000);if(error)throw error;
 const counts={};let subtotal=0;for(const row of data||[]){counts[row.estado]=(counts[row.estado]||0)+1;subtotal+=row.total||0}return json(res,200,{orders:(data||[]).length,subtotal,counts});
 }catch(e){return fail(res,e)}
}
