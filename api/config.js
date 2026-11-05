import {only,json} from '../lib/common.js';
export default function handler(req,res){if(!only(req,res,'GET'))return;return json(res,200,{shopName:process.env.SHOP_NAME||'dropnova',whatsapp:process.env.WHATSAPP_NUMBER||'56934998960',affiliateUrl:process.env.AFFILIATE_URL||'https://app.dropi.cl/auth/register?afl=107911',ordersEnabled:process.env.ACCEPT_ORDERS==='true'})}
