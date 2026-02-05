"use strict";(()=>{var e={};e.id=46343,e.ids=[46343],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},43583:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>_,patchFetch:()=>k,requestAsyncStorage:()=>x,routeModule:()=>g,serverHooks:()=>I,staticGenerationAsyncStorage:()=>y});var a={};r.r(a),r.d(a,{GET:()=>h,POST:()=>f,dynamic:()=>m,maxDuration:()=>p});var s=r(49303),o=r(88716),i=r(60670),n=r(87070),c=r(17478),d=r(52826),u=r(14065),l=r(90176);let m="force-dynamic",p=60;async function h(e){let t=await (0,c.k)(e);if(!t.ok)return t.res;let{searchParams:r}=new URL(e.url),a=r.get("client_id"),s=r.get("status"),o=parseInt(r.get("limit")||"20");if(!a)return n.NextResponse.json({success:!1,error:"client_id is required"},{status:400});try{let e=(0,l.t)().from("content_ideas").select("*").eq("client_id",a).order("created_at",{ascending:!1}).limit(o);s&&(e=e.eq("status",s));let{data:t,error:r}=await e;if(r)throw r;return n.NextResponse.json({success:!0,ideas:t||[]})}catch(e){return console.error("Error fetching ideas:",e),n.NextResponse.json({success:!1,error:e.message||"Failed to fetch ideas"},{status:500})}}async function f(e){let t;let r=await (0,c.k)(e);if(!r.ok)return r.res;try{t=await e.json()}catch{return n.NextResponse.json({success:!1,error:"Invalid JSON body"},{status:400})}let{client_id:a,topic:s,platforms:o=["instagram","linkedin"],count:i=10,content_types:m=["post","carousel","video","story"],save_to_bank:p=!0}=t;if(!a)return n.NextResponse.json({success:!1,error:"client_id is required"},{status:400});try{let e=await (0,u.$y)(a),t=new d.P({id:"ideas_generator",name:"Content Ideas Generator",role:"Gerador de Ideias de Conte\xfado",goal:"Gerar ideias criativas e estrat\xe9gicas de conte\xfado",backstory:`Voc\xea \xe9 um estrategista de conte\xfado criativo.
${e?`

CONTEXTO DA MARCA:
${e}`:""}

Voc\xea gera ideias que s\xe3o:
- Relevantes para o p\xfablico-alvo
- Alinhadas com a marca
- Variadas em formato e abordagem
- Acion\xe1veis e espec\xedficas`,model:"gpt-4o",temperature:.9,maxTokens:2500}),r=`Gere ${i} ideias de conte\xfado:

${s?`TEMA PRINCIPAL: ${s}`:"Gere ideias variadas"}
PLATAFORMAS: ${o.join(", ")}
FORMATOS: ${m.join(", ")}

Para cada ideia, inclua:
- T\xedtulo/conceito
- Formato ideal
- Plataforma recomendada
- Hook sugerido
- Por que funcionaria

Retorne em formato JSON:
{
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "format": "post|carousel|video|story|reels",
      "platform": "instagram|linkedin|...",
      "hook": "...",
      "rationale": "...",
      "priority": "high|medium|low"
    }
  ]
}`,c=await t.execute(r),h=[];try{let e=c.output.match(/\{[\s\S]*\}/);e&&(h=JSON.parse(e[0]).ideas||[])}catch{console.error("Failed to parse ideas JSON")}if(p&&h.length>0){let e=(0,l.t)(),t=h.map(e=>({client_id:a,title:e.title,description:e.description,format:e.format,platform:e.platform,hook:e.hook,rationale:e.rationale,priority:e.priority,status:"draft",created_at:new Date().toISOString()}));await e.from("content_ideas").insert(t)}return n.NextResponse.json({success:!0,ideas:h,saved:p,executionTime:c.executionTime})}catch(e){return console.error("Ideas generation error:",e),n.NextResponse.json({success:!1,error:e.message||"Generation failed"},{status:500})}}let g=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/admin/agency/ideas/route",pathname:"/api/admin/agency/ideas",filename:"route",bundlePath:"app/api/admin/agency/ideas/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\admin\\agency\\ideas\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:x,staticGenerationAsyncStorage:y,serverHooks:I}=g,_="/api/admin/agency/ideas/route";function k(){return(0,i.patchFetch)({serverHooks:I,staticGenerationAsyncStorage:y})}},90176:(e,t,r)=>{r.d(t,{t:()=>s});var a=r(54128);function s(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase admin n\xe3o configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}})}},14065:(e,t,r)=>{r.d(t,{$y:()=>u,Lw:()=>c,ci:()=>n,jN:()=>d});var a=r(54128);function s(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase env vars not configured");return(0,a.eI)(e,t,{auth:{persistSession:!1}})}async function o(e){let t=process.env.OPENAI_API_KEY;if(!t)throw Error("OPENAI_API_KEY n\xe3o configurada");if(0===e.length)return[];let r=process.env.OPENAI_EMBEDDING_MODEL||"text-embedding-3-small",a=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({model:r,input:e})});if(!a.ok){let e=await a.text();throw Error(`OpenAI embeddings failed: ${a.status} ${e}`)}let s=(await a.json()).data||[];return s.sort((e,t)=>e.index-t.index),s.map(e=>e.embedding)}function i(e){return"["+e.map(e=>e.toFixed(8)).join(",")+"]"}async function n(e){let t=s(),r=e.metadata||{},{data:a,error:n}=await t.from("brand_memory_documents").insert({client_id:e.clientId,title:e.title||null,source_type:e.sourceType||"manual",source_ref:e.sourceRef||null,raw_text:e.content,metadata:r,created_by_user_id:e.createdByUserId||null}).select("id").single();if(n||!a?.id)throw Error(`Falha ao criar documento: ${n?.message}`);let c=String(a.id),d=function(e,t=1200,r=200){let a=(e||"").trim();if(!a)return[];if(t<=0)return[a];let s=[],o=0,i=a.length;for(;o<i;){let e=Math.min(i,o+t);if(s.push(a.slice(o,e)),e>=i)break;o=Math.max(0,e-r)}return s}(e.content);if(0===d.length)return{documentId:c,chunksCreated:0};let u=await o(d),l=d.map((t,a)=>({client_id:e.clientId,document_id:c,chunk_index:a,content:t,metadata:{title:e.title,...r,chunk_size:t.length},embedding:i(u[a])})),{error:m}=await t.from("brand_memory_chunks").insert(l);if(m)throw Error(`Falha ao inserir chunks: ${m.message}`);return{documentId:c,chunksCreated:l.length}}async function c(e){let t=s(),r=e.matchCount??8,a=e.similarityThreshold??.7,[n]=await o([e.query]),{data:c,error:d}=await t.rpc("match_brand_memory_chunks",{p_client_id:e.clientId,query_embedding:i(n),match_count:r,similarity_threshold:a});if(d)throw Error(`Falha na busca: ${d.message}`);return{matches:c||[]}}async function d(e,t,r=5){if(!t)return[];try{return(await c({clientId:t,query:e,matchCount:r,similarityThreshold:.65})).matches}catch(e){return console.error("searchMemory error:",e),[]}}async function u(e){if(!e)return null;try{let t=[];for(let r of["tom de voz e personalidade da marca","valores e miss\xe3o da empresa","p\xfablico-alvo e personas","diretrizes visuais e identidade"]){let a=await d(r,e,3);t.push(...a)}if(0===t.length)return null;let r=Array.from(new Map(t.map(e=>[e.id,e])).values());return r.sort((e,t)=>t.similarity-e.similarity),r.slice(0,8).map(e=>e.content).join("\n\n---\n\n")}catch(e){return console.error("getBrandContext error:",e),null}}},52826:(e,t,r)=>{r.d(t,{P:()=>s});var a=r(54214);class s{constructor(e){this.id=e.id,this.name=e.name,this.role=e.role,this.goal=e.goal,this.backstory=e.backstory,this.model=e.model??"gpt-4o",this.temperature=e.temperature??.7,this.maxTokens=e.maxTokens??2e3,this.tools=e.tools??[],this.openai=new a.ZP({apiKey:process.env.OPENAI_API_KEY})}async execute(e,t){let r=Date.now(),a=this.buildSystemPrompt(),s=this.buildUserPrompt(e,t);try{let o="";if(this.tools.length>0&&t)for(let t of this.tools)try{let r=await t.execute({query:e});r&&(o+=`

[${t.name}]:
${r}`)}catch(e){console.warn(`Tool ${t.name} failed:`,e)}let i=o?`${s}

--- INFORMA\xc7\xd5ES RELEVANTES ---${o}`:s,n=await this.openai.chat.completions.create({model:this.model,temperature:this.temperature,max_tokens:this.maxTokens,messages:[{role:"system",content:a},{role:"user",content:i}]}),c=n.choices[0]?.message?.content??"",d=Date.now()-r;return{agentId:this.id,agentName:this.name,output:c,tokenUsage:{input:n.usage?.prompt_tokens??0,output:n.usage?.completion_tokens??0,total:n.usage?.total_tokens??0},executionTime:d}}catch(t){let e=Date.now()-r;return{agentId:this.id,agentName:this.name,output:`Erro na execu\xe7\xe3o: ${t.message}`,executionTime:e}}}buildSystemPrompt(){return`Voc\xea \xe9 ${this.name}, um profissional especializado em ${this.role}.

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
${t}`),r}}},17478:(e,t,r)=>{r.d(t,{k:()=>n});var a=r(87070),s=r(20344),o=r(71615),i=r(54128);async function n(e){let t=(0,o.cookies)(),r=(0,s.createRouteHandlerClient)({cookies:()=>t}),n=e.headers.get("authorization")||"",c=n.toLowerCase().startsWith("bearer ")?n.slice(7).trim():null,d=c?(0,i.eI)("https://ikjgsqtykkhqimypacro.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI",{global:{headers:{Authorization:`Bearer ${c}`}},auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}}):r,{data:u}=await d.auth.getUser();if(!u.user?.id)return{ok:!1,res:a.NextResponse.json({error:"N\xe3o autorizado"},{status:401})};let{data:l,error:m}=await d.rpc("is_admin");return m||!l?{ok:!1,res:a.NextResponse.json({error:"Acesso negado (admin)"},{status:403})}:{ok:!0,userId:u.user.id}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[89276,55972,54128,20958,54214],()=>r(43583));module.exports=a})();