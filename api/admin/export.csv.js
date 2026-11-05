import {db,only,requireAdmin,fail} from '../../lib/common.js';
const csv=v=>{const s=String(v??'');const safe=/^[=+@\-\t\r]/.test(s)?"'"+s:s;return '"'+safe.replaceAll('"','""')+'"'};
export default async function handler(req,res){
 if(!only(req,res,'GET')||!await requireAdmin(req,res))return;
 try{const keys=['id','created_at','nombre','telefono','region','comuna','direccion','referencia','total','estado','notas_admin'];const {data,error}=await db().from('pedidos').select(keys.join(',')).order('created_at',{ascending:false}).limit(1000);if(error)throw error;
 const lines=[keys.join(','),...(data||[]).map(row=>keys.map(k=>csv(row[k])).join(','))];res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="dropnova-pedidos.csv"');res.setHeader('Cache-Control','no-store');return res.status(200).send('\ufeff'+lines.join('\r\n'));
 }catch(e){return fail(res,e)}
}
