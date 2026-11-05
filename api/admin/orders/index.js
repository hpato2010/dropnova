import {db,only,json,fail,requireAdmin,allowedStatuses} from '../../../lib/common.js';
export default async function handler(req,res){
 if(!only(req,res,'GET')||!await requireAdmin(req,res))return;
 const page=Math.min(10000,Math.max(1,parseInt(req.query.page||'1',10)||1));const limit=40;
 const search=String(req.query.search||'').trim().slice(0,80).replace(/[%,.()]/g,'');const status=String(req.query.status||'');
 if(status&&!allowedStatuses.includes(status))return json(res,400,{error:'Estado inválido.'});
 try{
  let q=db().from('pedidos').select('id,created_at,nombre,telefono,comuna,region,total,estado,pedido_items(nombre_producto,cantidad)',{count:'exact'}).order('created_at',{ascending:false});
  if(status)q=q.eq('estado',status);
  if(search)q=q.or(`nombre.ilike.%${search}%,telefono.ilike.%${search}%`);
  const {data,count,error}=await q.range((page-1)*limit,page*limit-1);if(error)throw error;
  return json(res,200,{orders:(data||[]).map(o=>({id:o.id,created_at:o.created_at,customer:o.nombre,phone:o.telefono,commune:o.comuna,region:o.region,total:o.total,status:o.estado,items:(o.pedido_items||[]).map(i=>({name:i.nombre_producto,qty:i.cantidad}))})),count:count||0,page,limit});
 }catch(e){return fail(res,e)}
}
