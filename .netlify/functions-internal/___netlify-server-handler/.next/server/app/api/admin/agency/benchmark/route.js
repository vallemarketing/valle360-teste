"use strict";(()=>{var e={};e.id=26646,e.ids=[26646],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},17292:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>_,patchFetch:()=>k,requestAsyncStorage:()=>f,routeModule:()=>g,serverHooks:()=>y,staticGenerationAsyncStorage:()=>x});var a={};r.r(a),r.d(a,{POST:()=>h,dynamic:()=>d,maxDuration:()=>p});var s=r(49303),n=r(88716),o=r(60670),i=r(87070),c=r(17478),l=r(52826),m=r(90176),u=r(14065);let d="force-dynamic",p=90;async function h(e){let t;let r=await (0,c.k)(e);if(!r.ok)return r.res;try{t=await e.json()}catch{return i.NextResponse.json({success:!1,error:"Invalid JSON body"},{status:400})}let{client_id:a,industry:s,include_predictions:n=!0}=t;if(!a)return i.NextResponse.json({success:!1,error:"client_id is required"},{status:400});try{let e;let t=(0,m.t)(),r=new Date;r.setDate(r.getDate()-30);let{data:o}=await t.from("content_calendar_posts").select("platform, metrics, scheduled_for").eq("client_id",a).eq("status","published").gte("scheduled_for",r.toISOString()),c={postsPerWeek:((o?.length||0)/4.3).toFixed(1),avgEngagementRate:0,platforms:{}};if(o&&o.length>0){let e=[];for(let t of o){let r=t.metrics,a=r?.engagement_rate||0;e.push(a),c.platforms[t.platform]||(c.platforms[t.platform]={posts:0,avgEngagement:0}),c.platforms[t.platform].posts++,c.platforms[t.platform].avgEngagement+=a}for(let t of(c.avgEngagementRate=e.reduce((e,t)=>e+t,0)/e.length,Object.keys(c.platforms))){let e=c.platforms[t];e.avgEngagement=e.avgEngagement/e.posts}}let d=await (0,u.$y)(a),p=new l.P({id:"benchmark_analyst",name:"Benchmark Analyst",role:"Analista de Benchmark",goal:"Comparar performance com benchmarks do setor e prever crescimento",backstory:`Voc\xea \xe9 um analista de marketing digital com conhecimento profundo de benchmarks por ind\xfastria.
${d?`

CONTEXTO DA MARCA:
${d}`:""}

Benchmarks de refer\xeancia por setor (Instagram):
- E-commerce: 1-3% engagement
- B2B/SaaS: 0.5-1.5% engagement
- Moda: 2-4% engagement
- Alimenta\xe7\xe3o: 2-5% engagement
- Sa\xfade/Fitness: 3-6% engagement
- Servi\xe7os Profissionais: 1-2% engagement`,model:"gpt-4o",temperature:.6,maxTokens:2e3}),h=`Analise o desempenho do cliente comparado ao benchmark do setor:

SETOR: ${s||"N\xe3o especificado"}
M\xc9TRICAS ATUAIS:
- Posts por semana: ${c.postsPerWeek}
- Taxa m\xe9dia de engajamento: ${c.avgEngagementRate.toFixed(2)}%
- Por plataforma: ${JSON.stringify(c.platforms)}

Retorne em JSON:
{
  "benchmark": {
    "industry": "${s||"geral"}",
    "avg_engagement_rate": X,
    "avg_posts_per_week": X,
    "comparison": {
      "engagement": "above|below|average",
      "frequency": "above|below|average",
      "percentage_diff": X
    }
  },
  "analysis": "An\xe1lise comparativa detalhada...",
  ${n?`"predictions": {
    "30_days": {
      "expected_engagement": X,
      "expected_reach_growth": "X%",
      "confidence": "high|medium|low"
    },
    "90_days": {
      "expected_engagement": X,
      "expected_reach_growth": "X%",
      "confidence": "high|medium|low"
    },
    "factors": ["fator 1", "fator 2"]
  },`:""}
  "recommendations": [
    "recomenda\xe7\xe3o para melhorar vs benchmark"
  ]
}`,g=await p.execute(h);try{let t=g.output.match(/\{[\s\S]*\}/);t&&(e=JSON.parse(t[0]))}catch{e={analysis:g.output}}return i.NextResponse.json({success:!0,result:{currentMetrics:c,...e,generatedAt:new Date().toISOString()}})}catch(e){return console.error("Benchmark analysis error:",e),i.NextResponse.json({success:!1,error:e.message||"Analysis failed"},{status:500})}}let g=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/admin/agency/benchmark/route",pathname:"/api/admin/agency/benchmark",filename:"route",bundlePath:"app/api/admin/agency/benchmark/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\admin\\agency\\benchmark\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:f,staticGenerationAsyncStorage:x,serverHooks:y}=g,_="/api/admin/agency/benchmark/route";function k(){return(0,o.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:x})}},90176:(e,t,r)=>{r.d(t,{t:()=>s});var a=r(54128);function s(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase admin n\xe3o configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}})}},14065:(e,t,r)=>{r.d(t,{$y:()=>m,Lw:()=>c,ci:()=>i,jN:()=>l});var a=r(54128);function s(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase env vars not configured");return(0,a.eI)(e,t,{auth:{persistSession:!1}})}async function n(e){let t=process.env.OPENAI_API_KEY;if(!t)throw Error("OPENAI_API_KEY n\xe3o configurada");if(0===e.length)return[];let r=process.env.OPENAI_EMBEDDING_MODEL||"text-embedding-3-small",a=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({model:r,input:e})});if(!a.ok){let e=await a.text();throw Error(`OpenAI embeddings failed: ${a.status} ${e}`)}let s=(await a.json()).data||[];return s.sort((e,t)=>e.index-t.index),s.map(e=>e.embedding)}function o(e){return"["+e.map(e=>e.toFixed(8)).join(",")+"]"}async function i(e){let t=s(),r=e.metadata||{},{data:a,error:i}=await t.from("brand_memory_documents").insert({client_id:e.clientId,title:e.title||null,source_type:e.sourceType||"manual",source_ref:e.sourceRef||null,raw_text:e.content,metadata:r,created_by_user_id:e.createdByUserId||null}).select("id").single();if(i||!a?.id)throw Error(`Falha ao criar documento: ${i?.message}`);let c=String(a.id),l=function(e,t=1200,r=200){let a=(e||"").trim();if(!a)return[];if(t<=0)return[a];let s=[],n=0,o=a.length;for(;n<o;){let e=Math.min(o,n+t);if(s.push(a.slice(n,e)),e>=o)break;n=Math.max(0,e-r)}return s}(e.content);if(0===l.length)return{documentId:c,chunksCreated:0};let m=await n(l),u=l.map((t,a)=>({client_id:e.clientId,document_id:c,chunk_index:a,content:t,metadata:{title:e.title,...r,chunk_size:t.length},embedding:o(m[a])})),{error:d}=await t.from("brand_memory_chunks").insert(u);if(d)throw Error(`Falha ao inserir chunks: ${d.message}`);return{documentId:c,chunksCreated:u.length}}async function c(e){let t=s(),r=e.matchCount??8,a=e.similarityThreshold??.7,[i]=await n([e.query]),{data:c,error:l}=await t.rpc("match_brand_memory_chunks",{p_client_id:e.clientId,query_embedding:o(i),match_count:r,similarity_threshold:a});if(l)throw Error(`Falha na busca: ${l.message}`);return{matches:c||[]}}async function l(e,t,r=5){if(!t)return[];try{return(await c({clientId:t,query:e,matchCount:r,similarityThreshold:.65})).matches}catch(e){return console.error("searchMemory error:",e),[]}}async function m(e){if(!e)return null;try{let t=[];for(let r of["tom de voz e personalidade da marca","valores e miss\xe3o da empresa","p\xfablico-alvo e personas","diretrizes visuais e identidade"]){let a=await l(r,e,3);t.push(...a)}if(0===t.length)return null;let r=Array.from(new Map(t.map(e=>[e.id,e])).values());return r.sort((e,t)=>t.similarity-e.similarity),r.slice(0,8).map(e=>e.content).join("\n\n---\n\n")}catch(e){return console.error("getBrandContext error:",e),null}}},52826:(e,t,r)=>{r.d(t,{P:()=>s});var a=r(54214);class s{constructor(e){this.id=e.id,this.name=e.name,this.role=e.role,this.goal=e.goal,this.backstory=e.backstory,this.model=e.model??"gpt-4o",this.temperature=e.temperature??.7,this.maxTokens=e.maxTokens??2e3,this.tools=e.tools??[],this.openai=new a.ZP({apiKey:process.env.OPENAI_API_KEY})}async execute(e,t){let r=Date.now(),a=this.buildSystemPrompt(),s=this.buildUserPrompt(e,t);try{let n="";if(this.tools.length>0&&t)for(let t of this.tools)try{let r=await t.execute({query:e});r&&(n+=`

[${t.name}]:
${r}`)}catch(e){console.warn(`Tool ${t.name} failed:`,e)}let o=n?`${s}

--- INFORMA\xc7\xd5ES RELEVANTES ---${n}`:s,i=await this.openai.chat.completions.create({model:this.model,temperature:this.temperature,max_tokens:this.maxTokens,messages:[{role:"system",content:a},{role:"user",content:o}]}),c=i.choices[0]?.message?.content??"",l=Date.now()-r;return{agentId:this.id,agentName:this.name,output:c,tokenUsage:{input:i.usage?.prompt_tokens??0,output:i.usage?.completion_tokens??0,total:i.usage?.total_tokens??0},executionTime:l}}catch(t){let e=Date.now()-r;return{agentId:this.id,agentName:this.name,output:`Erro na execu\xe7\xe3o: ${t.message}`,executionTime:e}}}buildSystemPrompt(){return`Voc\xea \xe9 ${this.name}, um profissional especializado em ${this.role}.

SEU OBJETIVO:
${this.goal}

SUA HIST\xd3RIA/CONTEXTO:
${this.backstory}

INSTRU\xc7\xd5ES:
- Responda sempre em portugu\xeas brasileiro
- Seja direto e objetivo
- Use sua expertise para entregar resultados de alta qualidade
- Se precisar de mais informa\xe7\xf5es, especifique claramente`}buildUserPrompt(e,t){let r=`TAREFA:
${e}`;return t&&(r+=`

CONTEXTO ADICIONAL:
${t}`),r}}},17478:(e,t,r)=>{r.d(t,{k:()=>i});var a=r(87070),s=r(20344),n=r(71615),o=r(54128);async function i(e){let t=(0,n.cookies)(),r=(0,s.createRouteHandlerClient)({cookies:()=>t}),i=e.headers.get("authorization")||"",c=i.toLowerCase().startsWith("bearer ")?i.slice(7).trim():null,l=c?(0,o.eI)("https://ikjgsqtykkhqimypacro.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI",{global:{headers:{Authorization:`Bearer ${c}`}},auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}}):r,{data:m}=await l.auth.getUser();if(!m.user?.id)return{ok:!1,res:a.NextResponse.json({error:"N\xe3o autorizado"},{status:401})};let{data:u,error:d}=await l.rpc("is_admin");return d||!u?{ok:!1,res:a.NextResponse.json({error:"Acesso negado (admin)"},{status:403})}:{ok:!0,userId:m.user.id}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[89276,55972,54128,20958,54214],()=>r(17292));module.exports=a})();