import {db,only,json,fail} from '../lib/common.js';
const regions=new Set(['Arica y Parinacota','Tarapacá','Antofagasta','Atacama','Coquimbo','Valparaíso','Metropolitana de Santiago','Libertador General Bernardo O’Higgins','Maule','Ñuble','Biobío','La Araucanía','Los Ríos','Los Lagos','Aysén','Magallanes']);
const clean=(x,n)=>typeof x==='string'?x.trim().slice(0,n):'';
export default async function handler(req,res){
 if(!only(req,res,'POST'))return;
 if(process.env.ACCEPT_ORDERS!=='true')return json(res,503,{error:'Todavía no recibimos pedidos. Puedes consultar por WhatsApp.'});
 const raw=JSON.stringify(req.body||{});if(raw.length>12000)return json(res,413,{error:'Solicitud demasiado grande.'});
 const b=req.body||{};
 if(b.website)return json(res,400,{error:'Solicitud rechazada.'});
 const nombre=clean(b.customer,150),telefono=clean(b.phone,30),region=clean(b.region,100),comuna=clean(b.commune,100),direccion=clean(b.address,150),referencia=clean(b.reference,200);
 const dig=telefono.replace(/\D/g,'');const tel=dig.startsWith('56')?dig:dig.startsWith('9')?'56'+dig:'';
 if(nombre.length<2||!/^569\d{8}$/.test(tel)||!regions.has(region)||comuna.length<2||direccion.length<5||b.consent!==true)return json(res,400,{error:'Revisa tus datos y acepta el tratamiento de datos del pedido.'});
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>20)return json(res,400,{error:'Carrito inválido.'});
 const ids=[];let qty=0;
 for(const i of b.items){if(!i||typeof i.id!=='string'||!Number.isInteger(i.qty)||i.qty<1||i.qty>20||ids.includes(i.id))return json(res,400,{error:'Productos o cantidades inválidos.'});ids.push(i.id);qty+=i.qty}
 if(qty>30)return json(res,400,{error:'Cantidad máxima excedida.'});
 let orderId;
 try{
  const c=db();const {data:products,error:e}=await c.from('productos').select('id,nombre,precio,stock,activo').in('id',ids);if(e)throw e;
  if(!products||products.length!==ids.length)return json(res,409,{error:'Uno o más productos ya no están disponibles.'});
  const map=new Map(products.map(p=>[p.id,p]));
  const lines=b.items.map(i=>{const p=map.get(i.id);return {producto_id:i.id,nombre_producto:p?.nombre,cantidad:i.qty,precio_unitario:p?.precio,subtotal:p?.precio*i.qty,valid:!!p?.activo&&p.stock>=i.qty&&Number.isSafeInteger(p.precio)&&p.precio>0}});
  if(lines.some(l=>!l.valid))return json(res,409,{error:'Hay productos sin disponibilidad suficiente.'});
  const total=lines.reduce((s,l)=>s+l.subtotal,0);if(!Number.isSafeInteger(total)||total<=0)return json(res,400,{error:'Total inválido.'});
  const {data:order,error:oe}=await c.from('pedidos').insert({nombre,telefono:tel,region,comuna,direccion,referencia,total,estado:'pendiente',metodo_pago:'contra_entrega'}).select('id,total').single();if(oe)throw oe;
  orderId=order.id;
  const {error:ie}=await c.from('pedido_items').insert(lines.map(({valid,...l})=>({...l,pedido_id:orderId})));if(ie)throw ie;
  const {error:he}=await c.from('historial_pedidos').insert({pedido_id:orderId,estado_nuevo:'pendiente',comentario:'Solicitud ingresada desde la web'});if(he)console.error('historial inicial',he.message);
  return json(res,201,{id:order.id,total:order.total,status:'pendiente'});
 }catch(e){
  // Si falla detalle, intentar borrar pedido incompleto. No confirmar nunca pedido parcial.
  if(orderId){const {error:rollback}=await db().from('pedidos').delete().eq('id',orderId);if(rollback)console.error('Revisar pedido incompleto',orderId)}
  return fail(res,e)
 }
}
