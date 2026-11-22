import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
  const {slug}=await req.json(); if(typeof slug!=='string'||slug.length>100)return NextResponse.json({error:'Invalid product.'},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:'Demo session service is not configured.'},{status:503});
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data:product,error:productError}=await db.from('products').select('id,slug').eq('slug',slug).eq('publication_status','published').maybeSingle();
  if(productError||!product)return NextResponse.json({error:'Product is not available for live demo.'},{status:404});
  const {data:policy,error:policyError}=await db.from('demo_policies').select('*').eq('product_id',product.id).eq('enabled',true).maybeSingle();
  if(policyError||!policy)return NextResponse.json({error:'Live demo has not been enabled for this product.'},{status:403});
  const userAgent=req.headers.get('user-agent')||'unknown';const forwarded=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const visitorHash=createHash('sha256').update(userAgent+'|'+forwarded).digest('hex');
  const {count}=await db.from('demo_sessions').select('id',{count:'exact',head:true}).eq('visitor_hash',visitorHash).eq('status','active').gt('expires_at',new Date().toISOString());
  if((count||0)>=policy.max_active_sessions_per_visitor)return NextResponse.json({error:'An active demo session already exists.'},{status:429});
  const token=randomBytes(32).toString('base64url');const tokenHash=createHash('sha256').update(token).digest('hex');const expiresAt=new Date(Date.now()+policy.duration_seconds*1000).toISOString();
  const {data:session,error}=await db.from('demo_sessions').insert({product_id:product.id,token_hash:tokenHash,visitor_hash:visitorHash,expires_at:expiresAt}).select('id,started_at,expires_at').single();
  if(error||!session)throw error||new Error('Could not create session');
  await db.from('demo_activity_logs').insert({session_id:session.id,event_type:'session_started'});
  return NextResponse.json({sessionId:session.id,token,startedAt:session.started_at,expiresAt,durationSeconds:policy.duration_seconds,watermark:policy.watermark_text},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Unable to create demo session.'},{status:500});}
}
