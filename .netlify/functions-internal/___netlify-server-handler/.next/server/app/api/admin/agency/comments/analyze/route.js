"use strict";(()=>{var e={};e.id=64096,e.ids=[64096],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},91082:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>I,requestAsyncStorage:()=>x,routeModule:()=>h,serverHooks:()=>g,staticGenerationAsyncStorage:()=>y});var a={};r.r(a),r.d(a,{POST:()=>p,dynamic:()=>m,maxDuration:()=>d});var s=r(49303),o=r(88716),n=r(60670),i=r(87070),u=r(17478),c=r(52826),l=r(14065);let m="force-dynamic",d=60;async function p(e){let t;let r=await (0,u.k)(e);if(!r.ok)return r.res;try{t=await e.json()}catch{return i.NextResponse.json({success:!1,error:"Invalid JSON body"},{status:400})}let{client_id:a,comments:s,post_context:o,generate_responses:n=!0}=t;if(!a||!s||!Array.isArray(s))return i.NextResponse.json({success:!1,error:"client_id and comments array are required"},{status:400});try{let e;let t=await (0,l.$y)(a),r=new c.P({id:"comment_analyzer",name:"Comment Analyzer",role:"Analista de Coment\xe1rios",goal:"Analisar sentimento e sugerir respostas apropriadas",backstory:`Voc\xea analisa coment\xe1rios de redes sociais.
${t?`

CONTEXTO DA MARCA:
${t}`:""}

Voc\xea identifica:
- Sentimento (positivo, negativo, neutro)
- Inten\xe7\xe3o (elogio, d\xfavida, reclama\xe7\xe3o, sugest\xe3o, spam)
- Prioridade de resposta
- Tom adequado para resposta`,model:"gpt-4o",temperature:.6,maxTokens:3e3}),u=`Analise os seguintes coment\xe1rios:

${o?`CONTEXTO DO POST: ${o}`:""}

COMENT\xc1RIOS:
${s.map((e,t)=>`${t+1}. @${e.author||"user"}: "${e.text}"`).join("\n")}

Para cada coment\xe1rio, retorne em JSON:
{
  "analyses": [
    {
      "index": 1,
      "sentiment": "positive|negative|neutral",
      "sentiment_score": -1 a 1,
      "intent": "elogio|duvida|reclamacao|sugestao|spam|outro",
      "priority": "high|medium|low|none",
      "needs_response": true/false,
      ${n?'"suggested_response": "...",':""}
      "response_tone": "agradecido|emp\xe1tico|informativo|casual"
    }
  ],
  "summary": {
    "total": X,
    "positive": X,
    "negative": X,
    "neutral": X,
    "needs_attention": X
  }
}`,m=await r.execute(u);try{let t=m.output.match(/\{[\s\S]*\}/);t&&(e=JSON.parse(t[0]))}catch{e={analyses:[],summary:{}}}let d=(e.analyses||[]).map((e,t)=>({...e,original:s[t]}));return i.NextResponse.json({success:!0,result:{analyses:d,summary:e.summary||{},executionTime:m.executionTime}})}catch(e){return console.error("Comment analysis error:",e),i.NextResponse.json({success:!1,error:e.message||"Analysis failed"},{status:500})}}let h=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/admin/agency/comments/analyze/route",pathname:"/api/admin/agency/comments/analyze",filename:"route",bundlePath:"app/api/admin/agency/comments/analyze/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\admin\\agency\\comments\\analyze\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:x,staticGenerationAsyncStorage:y,serverHooks:g}=h,f="/api/admin/agency/comments/analyze/route";function I(){return(0,n.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:y})}},14065:(e,t,r)=>{r.d(t,{$y:()=>l,Lw:()=>u,ci:()=>i,jN:()=>c});var a=r(54128);function s(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase env vars not configured");return(0,a.eI)(e,t,{auth:{persistSession:!1}})}async function o(e){let t=process.env.OPENAI_API_KEY;if(!t)throw Error("OPENAI_API_KEY n\xe3o configurada");if(0===e.length)return[];let r=process.env.OPENAI_EMBEDDING_MODEL||"text-embedding-3-small",a=await fetch("https://api.openai.com/v1/embeddings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({model:r,input:e})});if(!a.ok){let e=await a.text();throw Error(`OpenAI embeddings failed: ${a.status} ${e}`)}let s=(await a.json()).data||[];return s.sort((e,t)=>e.index-t.index),s.map(e=>e.embedding)}function n(e){return"["+e.map(e=>e.toFixed(8)).join(",")+"]"}async function i(e){let t=s(),r=e.metadata||{},{data:a,error:i}=await t.from("brand_memory_documents").insert({client_id:e.clientId,title:e.title||null,source_type:e.sourceType||"manual",source_ref:e.sourceRef||null,raw_text:e.content,metadata:r,created_by_user_id:e.createdByUserId||null}).select("id").single();if(i||!a?.id)throw Error(`Falha ao criar documento: ${i?.message}`);let u=String(a.id),c=function(e,t=1200,r=200){let a=(e||"").trim();if(!a)return[];if(t<=0)return[a];let s=[],o=0,n=a.length;for(;o<n;){let e=Math.min(n,o+t);if(s.push(a.slice(o,e)),e>=n)break;o=Math.max(0,e-r)}return s}(e.content);if(0===c.length)return{documentId:u,chunksCreated:0};let l=await o(c),m=c.map((t,a)=>({client_id:e.clientId,document_id:u,chunk_index:a,content:t,metadata:{title:e.title,...r,chunk_size:t.length},embedding:n(l[a])})),{error:d}=await t.from("brand_memory_chunks").insert(m);if(d)throw Error(`Falha ao inserir chunks: ${d.message}`);return{documentId:u,chunksCreated:m.length}}async function u(e){let t=s(),r=e.matchCount??8,a=e.similarityThreshold??.7,[i]=await o([e.query]),{data:u,error:c}=await t.rpc("match_brand_memory_chunks",{p_client_id:e.clientId,query_embedding:n(i),match_count:r,similarity_threshold:a});if(c)throw Error(`Falha na busca: ${c.message}`);return{matches:u||[]}}async function c(e,t,r=5){if(!t)return[];try{return(await u({clientId:t,query:e,matchCount:r,similarityThreshold:.65})).matches}catch(e){return console.error("searchMemory error:",e),[]}}async function l(e){if(!e)return null;try{let t=[];for(let r of["tom de voz e personalidade da marca","valores e miss\xe3o da empresa","p\xfablico-alvo e personas","diretrizes visuais e identidade"]){let a=await c(r,e,3);t.push(...a)}if(0===t.length)return null;let r=Array.from(new Map(t.map(e=>[e.id,e])).values());return r.sort((e,t)=>t.similarity-e.similarity),r.slice(0,8).map(e=>e.content).join("\n\n---\n\n")}catch(e){return console.error("getBrandContext error:",e),null}}},52826:(e,t,r)=>{r.d(t,{P:()=>s});var a=r(54214);class s{constructor(e){this.id=e.id,this.name=e.name,this.role=e.role,this.goal=e.goal,this.backstory=e.backstory,this.model=e.model??"gpt-4o",this.temperature=e.temperature??.7,this.maxTokens=e.maxTokens??2e3,this.tools=e.tools??[],this.openai=new a.ZP({apiKey:process.env.OPENAI_API_KEY})}async execute(e,t){let r=Date.now(),a=this.buildSystemPrompt(),s=this.buildUserPrompt(e,t);try{let o="";if(this.tools.length>0&&t)for(let t of this.tools)try{let r=await t.execute({query:e});r&&(o+=`

[${t.name}]:
${r}`)}catch(e){console.warn(`Tool ${t.name} failed:`,e)}let n=o?`${s}

--- INFORMA\xc7\xd5ES RELEVANTES ---${o}`:s,i=await this.openai.chat.completions.create({model:this.model,temperature:this.temperature,max_tokens:this.maxTokens,messages:[{role:"system",content:a},{role:"user",content:n}]}),u=i.choices[0]?.message?.content??"",c=Date.now()-r;return{agentId:this.id,agentName:this.name,output:u,tokenUsage:{input:i.usage?.prompt_tokens??0,output:i.usage?.completion_tokens??0,total:i.usage?.total_tokens??0},executionTime:c}}catch(t){let e=Date.now()-r;return{agentId:this.id,agentName:this.name,output:`Erro na execu\xe7\xe3o: ${t.message}`,executionTime:e}}}buildSystemPrompt(){return`Voc\xea \xe9 ${this.name}, um profissional especializado em ${this.role}.

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
${t}`),r}}},17478:(e,t,r)=>{r.d(t,{k:()=>i});var a=r(87070),s=r(20344),o=r(71615),n=r(54128);async function i(e){let t=(0,o.cookies)(),r=(0,s.createRouteHandlerClient)({cookies:()=>t}),i=e.headers.get("authorization")||"",u=i.toLowerCase().startsWith("bearer ")?i.slice(7).trim():null,c=u?(0,n.eI)("https://ikjgsqtykkhqimypacro.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI",{global:{headers:{Authorization:`Bearer ${u}`}},auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}}):r,{data:l}=await c.auth.getUser();if(!l.user?.id)return{ok:!1,res:a.NextResponse.json({error:"N\xe3o autorizado"},{status:401})};let{data:m,error:d}=await c.rpc("is_admin");return d||!m?{ok:!1,res:a.NextResponse.json({error:"Acesso negado (admin)"},{status:403})}:{ok:!0,userId:l.user.id}}}};var t=require("../../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[89276,55972,54128,20958,54214],()=>r(91082));module.exports=a})();