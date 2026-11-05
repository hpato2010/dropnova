import {db,only,json,fail} from '../lib/common.js';
export default async function handler(req,res){
 if(!only(req,res,'GET'))return;
 try{
  const {data,error}=await db().from('productos').select('id,nombre,descripcion,marca,categoria,precio,imagen_url,stock').eq('activo',true).gt('stock',0).order('created_at',{ascending:false}).limit(100);
  if(error)throw error;
  return json(res,200,(data||[]).map(p=>({id:p.id,name:p.nombre,description:p.descripcion||'',category:p.categoria||'General',brand:p.marca||'',price:p.precio,image_url:p.imagen_url,stock:p.stock,emoji:'📦'})));
 }catch(e){return fail(res,e)}
}
