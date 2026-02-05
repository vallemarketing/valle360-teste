"use strict";(()=>{var e={};e.id=59772,e.ids=[59772],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},23111:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>v,requestAsyncStorage:()=>x,routeModule:()=>g,serverHooks:()=>f,staticGenerationAsyncStorage:()=>h});var s={};r.r(s),r.d(s,{POST:()=>m,dynamic:()=>d,maxDuration:()=>l});var a=r(49303),o=r(88716),n=r(60670),i=r(87070),u=r(17478),c=r(52826),p=r(90176);let d="force-dynamic",l=60;async function m(e){let t;let r=await (0,u.k)(e);if(!r.ok)return r.res;try{t=await e.json()}catch{return i.NextResponse.json({success:!1,error:"Invalid JSON body"},{status:400})}let{client_id:s,min_days_old:a=60,min_engagement_rate:o=3,limit:n=20}=t;if(!s)return i.NextResponse.json({success:!1,error:"client_id is required"},{status:400});try{let e=(0,p.t)(),t=new Date;t.setDate(t.getDate()-a);let{data:r}=await e.from("content_calendar_posts").select("id, caption, media_url, platform, scheduled_for, metrics").eq("client_id",s).eq("status","published").lt("scheduled_for",t.toISOString()).order("scheduled_for",{ascending:!1}).limit(100);if(!r||0===r.length)return i.NextResponse.json({success:!0,evergreen:[],message:"No posts old enough to analyze"});let o=new c.P({id:"evergreen_detector",name:"Evergreen Content Detector",role:"Detector de Conte\xfado Evergreen",goal:"Identificar conte\xfados atemporais que podem ser repostados",backstory:`Voc\xea analisa posts para identificar conte\xfado evergreen.

Conte\xfado evergreen:
- N\xe3o menciona datas espec\xedficas
- N\xe3o faz refer\xeancia a eventos passados
- Aborda temas atemporais
- Ainda \xe9 relevante hoje
- Teve bom engajamento`,model:"gpt-4o",temperature:.5,maxTokens:2e3}),u=r.slice(0,30).map(e=>({id:e.id,caption:e.caption?.substring(0,300),platform:e.platform,age_days:Math.floor((Date.now()-new Date(e.scheduled_for).getTime())/864e5)})),d=`Analise estes posts e identifique quais s\xe3o EVERGREEN (podem ser repostados):

POSTS:
${u.map((e,t)=>`${t+1}. [${e.platform}] ${e.caption} (${e.age_days} dias atr\xe1s)`).join("\n\n")}

Retorne em JSON:
{
  "evergreen": [
    {
      "index": 1,
      "id": "...",
      "is_evergreen": true,
      "reason": "...",
      "repost_suggestion": "Como atualizar para repostar",
      "best_time_to_repost": "semana/m\xeas sugerido"
    }
  ]
}`,l=await o.execute(d),m=[];try{let e=l.output.match(/\{[\s\S]*\}/);e&&(m=(JSON.parse(e[0]).evergreen||[]).filter(e=>e.is_evergreen).map(e=>({...e,originalPost:u[e.index-1]})))}catch{}return i.NextResponse.json({success:!0,evergreen:m.slice(0,n),analyzedCount:u.length})}catch(e){return console.error("Evergreen detection error:",e),i.NextResponse.json({success:!1,error:e.message||"Detection failed"},{status:500})}}let g=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/admin/agency/evergreen/route",pathname:"/api/admin/agency/evergreen",filename:"route",bundlePath:"app/api/admin/agency/evergreen/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\admin\\agency\\evergreen\\route.ts",nextConfigOutput:"standalone",userland:s}),{requestAsyncStorage:x,staticGenerationAsyncStorage:h,serverHooks:f}=g,y="/api/admin/agency/evergreen/route";function v(){return(0,n.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:h})}},90176:(e,t,r)=>{r.d(t,{t:()=>a});var s=r(54128);function a(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase admin n\xe3o configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");return(0,s.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}})}},52826:(e,t,r)=>{r.d(t,{P:()=>a});var s=r(54214);class a{constructor(e){this.id=e.id,this.name=e.name,this.role=e.role,this.goal=e.goal,this.backstory=e.backstory,this.model=e.model??"gpt-4o",this.temperature=e.temperature??.7,this.maxTokens=e.maxTokens??2e3,this.tools=e.tools??[],this.openai=new s.ZP({apiKey:process.env.OPENAI_API_KEY})}async execute(e,t){let r=Date.now(),s=this.buildSystemPrompt(),a=this.buildUserPrompt(e,t);try{let o="";if(this.tools.length>0&&t)for(let t of this.tools)try{let r=await t.execute({query:e});r&&(o+=`

[${t.name}]:
${r}`)}catch(e){console.warn(`Tool ${t.name} failed:`,e)}let n=o?`${a}

--- INFORMA\xc7\xd5ES RELEVANTES ---${o}`:a,i=await this.openai.chat.completions.create({model:this.model,temperature:this.temperature,max_tokens:this.maxTokens,messages:[{role:"system",content:s},{role:"user",content:n}]}),u=i.choices[0]?.message?.content??"",c=Date.now()-r;return{agentId:this.id,agentName:this.name,output:u,tokenUsage:{input:i.usage?.prompt_tokens??0,output:i.usage?.completion_tokens??0,total:i.usage?.total_tokens??0},executionTime:c}}catch(t){let e=Date.now()-r;return{agentId:this.id,agentName:this.name,output:`Erro na execu\xe7\xe3o: ${t.message}`,executionTime:e}}}buildSystemPrompt(){return`Voc\xea \xe9 ${this.name}, um profissional especializado em ${this.role}.

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
${t}`),r}}},17478:(e,t,r)=>{r.d(t,{k:()=>i});var s=r(87070),a=r(20344),o=r(71615),n=r(54128);async function i(e){let t=(0,o.cookies)(),r=(0,a.createRouteHandlerClient)({cookies:()=>t}),i=e.headers.get("authorization")||"",u=i.toLowerCase().startsWith("bearer ")?i.slice(7).trim():null,c=u?(0,n.eI)("https://ikjgsqtykkhqimypacro.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI",{global:{headers:{Authorization:`Bearer ${u}`}},auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}}):r,{data:p}=await c.auth.getUser();if(!p.user?.id)return{ok:!1,res:s.NextResponse.json({error:"N\xe3o autorizado"},{status:401})};let{data:d,error:l}=await c.rpc("is_admin");return l||!d?{ok:!1,res:s.NextResponse.json({error:"Acesso negado (admin)"},{status:403})}:{ok:!0,userId:p.user.id}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[89276,55972,54128,20958,54214],()=>r(23111));module.exports=s})();