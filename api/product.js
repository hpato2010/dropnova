import {db,only,json,fail} from '../lib/common.js';
const arr=v=>Array.isArray(v)?v:[];
export default async function handler(req,res){
 if(!only(req,res,'GET'))return;
 const slug=String(req.query.slug||'');
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||slug.length>120)return json(res,400,{error:'Producto no válido.'});
 try{
  const {data,error}=await db().from('productos').select('id,slug,nombre,descripcion,detalle,marca,categoria,precio,imagen_url,galeria,video_url,caracteristicas,preguntas,stock').eq('slug',slug).eq('activo',true).gt('stock',0).maybeSingle();
  if(error)throw error;
  if(!data)return json(res,404,{error:'Producto no encontrado.'});
  const imgs=[data.imagen_url,...arr(data.galeria)].filter(u=>typeof u==='string'&&(/^https:\/\//.test(u)||/^\/[a-z0-9\-_.\/]+$/i.test(u)));
  const video=typeof data.video_url==='string'&&(/^https:\/\//.test(data.video_url)||/^\/[a-z0-9\-_.\/]+$/i.test(data.video_url))?data.video_url:null;
  return json(res,200,{id:data.id,slug:data.slug,name:data.nombre,description:data.descripcion||'',detail:data.detalle||data.descripcion||'',category:data.categoria||'General',brand:data.marca||'',price:data.precio,images:[...new Set(imgs)],video,features:arr(data.caracteristicas).filter(x=>typeof x==='string'),faq:arr(data.preguntas).filter(x=>x&&typeof x.q==='string'&&typeof x.a==='string'),stock:data.stock});
 }catch(e){return fail(res,e)}
}
