import {db,json,fail,requireAdmin,allowedStatuses} from '../../../lib/common.js';
export default async function handler(req,res){
 const user=await requireAdmin(req,res);if(!user)return;
 if(!['GET','PATCH'].includes(req.method))return json(res,405,{error:'Método no permitido'});
 const id=String(req.query.id||'');if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))return json(res,400,{error:'ID inválido'});
 try{
  const c=db();const {data:o,error}=await c.from('pedidos').select('*,pedido_items(nombre_producto,cantidad,precio_unitario,subtotal)').eq('id',id).maybeSingle();if(error)throw error;
  if(!o)return json(res,404,{error:'Pedido no encontrado'});
  if(req.method==='GET'){
   const {data:h,error:he}=await c.from('historial_pedidos').select('created_at,estado_anterior,estado_nuevo,comentario').eq('pedido_id',id).order('created_at');if(he)throw he;
   return json(res,200,{order:{id:o.id,customer:o.nombre,phone:o.telefono,address:o.direccion,commune:o.comuna,region:o.region,reference:o.referencia,admin_note:o.notas_admin,status:o.estado,total:o.total,items:o.pedido_items},events:(h||[]).map(x=>({time:x.created_at,from_status:x.estado_anterior,to_status:x.estado_nuevo,description:x.comentario}))});
  }
  const status=req.body?.status,note=req.body?.admin_note;
  if(!allowedStatuses.includes(status)||typeof note!=='string'||note.length>1000)return json(res,400,{error:'Estado o nota inválidos'});
  const {data:updated,error:ue}=await c.from('pedidos').update({estado:status,notas_admin:note}).eq('id',id).eq('estado',o.estado).select('id').maybeSingle();if(ue)throw ue;
  if(!updated)return json(res,409,{error:'El pedido cambió. Actualiza la página.'});
  const {error:he}=await c.from('historial_pedidos').insert({pedido_id:id,estado_anterior:o.estado,estado_nuevo:status,comentario:'Cambio desde el panel',usuario_admin:user.id});if(he)console.error('Historial pendiente',he.message);
  return json(res,200,{ok:true});
 }catch(e){return fail(res,e)}
}
