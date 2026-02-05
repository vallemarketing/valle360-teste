"use strict";(()=>{var e={};e.id=9540,e.ids=[9540],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},12322:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>y,patchFetch:()=>k,requestAsyncStorage:()=>x,routeModule:()=>h,serverHooks:()=>f,staticGenerationAsyncStorage:()=>g});var r={};a.r(r),a.d(r,{POST:()=>m,dynamic:()=>l,maxDuration:()=>p});var o=a(49303),s=a(88716),i=a(60670),n=a(87070),c=a(17478),u=a(52826),d=a(14065);let l="force-dynamic",p=60;async function m(e){let t;let a=await (0,c.k)(e);if(!a.ok)return a.res;try{t=await e.json()}catch{return n.NextResponse.json({success:!1,error:"Invalid JSON body"},{status:400})}let{client_id:r,original_content:o,original_platform:s,target_platforms:i=["linkedin","facebook","twitter"]}=t;if(!r||!o||!s)return n.NextResponse.json({success:!1,error:"client_id, original_content, and original_platform are required"},{status:400});try{let e;let t=await (0,d.$y)(r),a=new u.P({id:"platform_adapter",name:"Platform Adapter",role:"Adaptador de Conte\xfado Multi-plataforma",goal:"Adaptar conte\xfado mantendo a ess\xeancia mas otimizando para cada plataforma",backstory:`Voc\xea \xe9 um especialista em adaptar conte\xfado para diferentes plataformas.
${t?`

CONTEXTO DA MARCA:
${t}`:""}

Voc\xea sabe que:
- Instagram: Visual-first, hooks curtos, emojis estrat\xe9gicos, 30 hashtags
- LinkedIn: Profissional, insights, storytelling, poucas hashtags (3-5)
- Facebook: Conversacional, mais longo, perguntas engajantes
- Twitter/X: Conciso (280 chars), provocativo, threads quando necess\xe1rio
- TikTok: Casual, trend-aware, CTA para a\xe7\xe3o`,model:"gpt-4o",temperature:.7,maxTokens:2e3}),c=`Adapte o seguinte conte\xfado de ${s} para: ${i.join(", ")}

CONTE\xdaDO ORIGINAL:
${o}

Para cada plataforma, ajuste:
- Tom e linguagem
- Tamanho do texto
- Hashtags (quantidade e tipo)
- CTAs apropriados
- Formata\xe7\xe3o

Retorne em formato JSON:
{
  "adaptations": {
    "linkedin": {
      "content": "...",
      "hashtags": [...],
      "cta": "..."
    },
    "facebook": {...},
    ...
  },
  "tips": ["dica 1", "dica 2"]
}`,l=await a.execute(c);try{let t=l.output.match(/\{[\s\S]*\}/);t&&(e=JSON.parse(t[0]))}catch{e={adaptations:{},raw:l.output}}return n.NextResponse.json({success:!0,result:{...e,executionTime:l.executionTime}})}catch(e){return console.error("Platform adaptation error:",e),n.NextResponse.json({success:!1,error:e.message||"Adaptation failed"},{status:500})}}let h=new o.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/admin/agency/editor/adapt-platform/route",pathname:"/api/admin/agency/editor/adapt-platform",filename:"route",bundlePath:"app/api/admin/agency/editor/adapt-platform/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\admin\\agency\\editor\\adapt-platform\\route.ts",nextConfigOutput:"standalone",userland:r}),{requestAsyncStorage:x,staticGenerationAsyncStorage:g,serverHooks:f}=h,y="/api/admin/agency/editor/adapt-platform/route";function k(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:g})}},14065:(e,t,a)=>{a.d(t,{$y:()=>d,Lw:()=>c,ci:()=>n,jN:()=>u});var r=a(54128);function o(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase env vars not configured");return(0,r.eI)(e,t,{auth:{persistSession:!1}})}async function s(e){let t=process.env.OPENAI_API_KEY;if(!t)throw Error("OPENAI_API_KEY n\xe3o configurada");if(0===e.length)return[];let a=process.env.OPENAI_EMBEDDING_MODEL||"text-embedding-3-small",r=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({model:a,input:e})});if(!r.ok){let e=await r.text();throw Error(`OpenAI embeddings failed: ${r.status} ${e}`)}let o=(await r.json()).data||[];return o.sort((e,t)=>e.index-t.index),o.map(e=>e.embedding)}function i(e){return"["+e.map(e=>e.toFixed(8)).join(",")+"]"}async function n(e){let t=o(),a=e.metadata||{},{data:r,error:n}=await t.from("brand_memory_documents").insert({client_id:e.clientId,title:e.title||null,source_type:e.sourceType||"manual",source_ref:e.sourceRef||null,raw_text:e.content,metadata:a,created_by_user_id:e.createdByUserId||null}).select("id").single();if(n||!r?.id)throw Error(`Falha ao criar documento: ${n?.message}`);let c=String(r.id),u=function(e,t=1200,a=200){let r=(e||"").trim();if(!r)return[];if(t<=0)return[r];let o=[],s=0,i=r.length;for(;s<i;){let e=Math.min(i,s+t);if(o.push(r.slice(s,e)),e>=i)break;s=Math.max(0,e-a)}return o}(e.content);if(0===u.length)return{documentId:c,chunksCreated:0};let d=await s(u),l=u.map((t,r)=>({client_id:e.clientId,document_id:c,chunk_index:r,content:t,metadata:{title:e.title,...a,chunk_size:t.length},embedding:i(d[r])})),{error:p}=await t.from("brand_memory_chunks").insert(l);if(p)throw Error(`Falha ao inserir chunks: ${p.message}`);return{documentId:c,chunksCreated:l.length}}async function c(e){let t=o(),a=e.matchCount??8,r=e.similarityThreshold??.7,[n]=await s([e.query]),{data:c,error:u}=await t.rpc("match_brand_memory_chunks",{p_client_id:e.clientId,query_embedding:i(n),match_count:a,similarity_threshold:r});if(u)throw Error(`Falha na busca: ${u.message}`);return{matches:c||[]}}async function u(e,t,a=5){if(!t)return[];try{return(await c({clientId:t,query:e,matchCount:a,similarityThreshold:.65})).matches}catch(e){return console.error("searchMemory error:",e),[]}}async function d(e){if(!e)return null;try{let t=[];for(let a of["tom de voz e personalidade da marca","valores e miss\xe3o da empresa","p\xfablico-alvo e personas","diretrizes visuais e identidade"]){let r=await u(a,e,3);t.push(...r)}if(0===t.length)return null;let a=Array.from(new Map(t.map(e=>[e.id,e])).values());return a.sort((e,t)=>t.similarity-e.similarity),a.slice(0,8).map(e=>e.content).join("\n\n---\n\n")}catch(e){return console.error("getBrandContext error:",e),null}}},52826:(e,t,a)=>{a.d(t,{P:()=>o});var r=a(54214);class o{constructor(e){this.id=e.id,this.name=e.name,this.role=e.role,this.goal=e.goal,this.backstory=e.backstory,this.model=e.model??"gpt-4o",this.temperature=e.temperature??.7,this.maxTokens=e.maxTokens??2e3,this.tools=e.tools??[],this.openai=new r.ZP({apiKey:process.env.OPENAI_API_KEY})}async execute(e,t){let a=Date.now(),r=this.buildSystemPrompt(),o=this.buildUserPrompt(e,t);try{let s="";if(this.tools.length>0&&t)for(let t of this.tools)try{let a=await t.execute({query:e});a&&(s+=`

[${t.name}]:
${a}`)}catch(e){console.warn(`Tool ${t.name} failed:`,e)}let i=s?`${o}

--- INFORMA\xc7\xd5ES RELEVANTES ---${s}`:o,n=await this.openai.chat.completions.create({model:this.model,temperature:this.temperature,max_tokens:this.maxTokens,messages:[{role:"system",content:r},{role:"user",content:i}]}),c=n.choices[0]?.message?.content??"",u=Date.now()-a;return{agentId:this.id,agentName:this.name,output:c,tokenUsage:{input:n.usage?.prompt_tokens??0,output:n.usage?.completion_tokens??0,total:n.usage?.total_tokens??0},executionTime:u}}catch(t){let e=Date.now()-a;return{agentId:this.id,agentName:this.name,output:`Erro na execu\xe7\xe3o: ${t.message}`,executionTime:e}}}buildSystemPrompt(){return`Voc\xea \xe9 ${this.name}, um profissional especializado em ${this.role}.

SEU OBJETIVO:
${this.goal}

SUA HIST\xd3RIA/CONTEXTO:
${this.backstory}

INSTRU\xc7\xd5ES:
- Responda sempre em portugu\xeas brasileiro
- Seja direto e objetivo
- Use sua expertise para entregar resultados de alta qualidade
- Se precisar de mais informa\xe7\xf5es, especifique claramente`}buildUserPrompt(e,t){let a=`TAREFA:
${e}`;return t&&(a+=`

CONTEXTO ADICIONAL:
${t}`),a}}},17478:(e,t,a)=>{a.d(t,{k:()=>n});var r=a(87070),o=a(20344),s=a(71615),i=a(54128);async function n(e){let t=(0,s.cookies)(),a=(0,o.createRouteHandlerClient)({cookies:()=>t}),n=e.headers.get("authorization")||"",c=n.toLowerCase().startsWith("bearer ")?n.slice(7).trim():null,u=c?(0,i.eI)("https://ikjgsqtykkhqimypacro.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI",{global:{headers:{Authorization:`Bearer ${c}`}},auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}}):a,{data:d}=await u.auth.getUser();if(!d.user?.id)return{ok:!1,res:r.NextResponse.json({error:"N\xe3o autorizado"},{status:401})};let{data:l,error:p}=await u.rpc("is_admin");return p||!l?{ok:!1,res:r.NextResponse.json({error:"Acesso negado (admin)"},{status:403})}:{ok:!0,userId:d.user.id}}}};var t=require("../../../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[89276,55972,54128,20958,54214],()=>a(12322));module.exports=r})();