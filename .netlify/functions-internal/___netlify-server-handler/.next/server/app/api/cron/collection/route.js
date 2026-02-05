"use strict";(()=>{var e={};e.id=35964,e.ids=[35964],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},91152:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>k,patchFetch:()=>I,requestAsyncStorage:()=>b,routeModule:()=>v,serverHooks:()=>S,staticGenerationAsyncStorage:()=>w});var n={};t.r(n),t.d(n,{GET:()=>_,POST:()=>y,dynamic:()=>x});var o=t(49303),r=t(88716),s=t(60670),i=t(87070),l=t(1926);let c={task_overdue:e=>`Oi ${e.name.split(" ")[0]}! 👋

Notei que a tarefa "${e.taskTitle}" est\xe1 h\xe1 ${e.daysOverdue} dias sem movimenta\xe7\xe3o.

Est\xe1 tudo bem? Precisa de ajuda?

Posso:
1️⃣ Estender o prazo
2️⃣ Pedir ajuda de outro colega
3️⃣ Falar com seu gestor

Me avisa! 💜`,engagement_low:e=>`Oi ${e.name.split(" ")[0]}! 

Percebi que voc\xea n\xe3o tem aparecido muito por aqui ultimamente. 

T\xe1 tudo bem? Se precisar conversar sobre algo, estou aqui!

Que tal respondermos juntos o quebra-gelo de hoje? 😊`,approval_pending:e=>`${e.name.split(" ")[0]}, voc\xea tem ${e.pendingCount} aprova\xe7\xf5es pendentes!

Seus clientes est\xe3o aguardando. Vamos revisar juntos?

👉 Ver aprova\xe7\xf5es: ${e.approvalLink}`},d={payment_overdue:e=>`Ol\xe1 ${e.name}! 😊

Passando para lembrar que a fatura #${e.invoiceNumber} no valor de ${e.amount} venceu h\xe1 ${e.daysOverdue} dias.

💳 Link para pagamento: ${e.paymentLink}

Se precisar de ajuda com parcelamento, \xe9 s\xf3 me avisar!

Atenciosamente,
Val - Valle 360`,approval_pending:e=>`Oi ${e.name}! 

Voc\xea tem ${e.pendingCount} ${1===e.pendingCount?"item":"itens"} aguardando sua aprova\xe7\xe3o h\xe1 ${e.daysWaiting} dias.

${e.pendingCount>1?"Se n\xe3o aprovarmos logo, podemos perder as datas ideais de publica\xe7\xe3o \uD83D\uDCC5":""}

👉 Aprovar agora: ${e.approvalLink}

Leva menos de 2 minutos! 😉`,nps_feedback:e=>`${e.name}, tudo bem?

Faz ${e.daysSinceLastContact} dias que n\xe3o conversamos!

Como est\xe1 sendo sua experi\xeancia com a Valle?

De 0 a 10, qual nota voc\xea daria?

Sua opini\xe3o \xe9 super importante pra gente! 💜`};async function p(){let e=[];try{let{data:a}=await l.O.from("kanban_tasks").select(`
        *,
        assignee:employees(id, full_name, email, phone)
      `).lt("due_date",new Date().toISOString()).eq("status","in_progress");a&&a.forEach(a=>{if(a.assignee){let t=Math.ceil((new Date().getTime()-new Date(a.due_date).getTime())/864e5);e.push({id:a.assignee.id,type:"employee",name:a.assignee.full_name,email:a.assignee.email,phone:a.assignee.phone,reason:"task_overdue",context:{name:a.assignee.full_name,taskTitle:a.title,daysOverdue:t}})}});let{data:t}=await l.O.from("approvals").select(`
        *,
        client:clients(id, name, email, phone)
      `).eq("status","pending").lt("created_at",new Date(Date.now()-1728e5).toISOString());if(t){let a={};t.forEach(e=>{if(e.client){a[e.client.id]||(a[e.client.id]={client:e.client,count:0,oldestDate:new Date}),a[e.client.id].count++;let t=new Date(e.created_at);t<a[e.client.id].oldestDate&&(a[e.client.id].oldestDate=t)}}),Object.values(a).forEach(a=>{let t=Math.ceil((new Date().getTime()-a.oldestDate.getTime())/864e5);e.push({id:a.client.id,type:"client",name:a.client.name,email:a.client.email,phone:a.client.phone,reason:"approval_pending",context:{name:a.client.name,pendingCount:a.count,daysWaiting:t,approvalLink:"/cliente/aprovacoes"}})})}let{data:n}=await l.O.from("employee_gamification").select(`
        *,
        employee:employees(id, full_name, email, phone)
      `).lt("engagement_score",50);n&&n.forEach(a=>{a.employee&&e.push({id:a.employee.id,type:"employee",name:a.employee.full_name,email:a.employee.email,phone:a.employee.phone,reason:"engagement_low",context:{name:a.employee.full_name,engagementScore:a.engagement_score}})})}catch(e){console.error("Erro ao buscar alvos de cobran\xe7a:",e)}return e}async function u(e){try{let a=function(e){let a=[],t="employee"===e.type?c[e.reason]:d[e.reason];if(!t)return console.error(`Template n\xe3o encontrado para: ${e.type} - ${e.reason}`),[];let n=t(e.context);return a.push({platform:"internal",message:n,actions:{task_overdue:["extend_deadline","request_help","notify_manager"],payment_overdue:["send_payment_link","offer_installment","contact_finance"],approval_pending:["view_approvals","send_reminder"],nps_feedback:["send_survey","schedule_call"],engagement_low:["send_icebreaker","schedule_1on1"]}[e.reason]||[]}),e.phone&&function(e){let a="employee"===e.type?2:3;return["task_overdue","payment_overdue","approval_pending"].includes(e.reason)&&(e.context.daysOverdue>=a||e.context.daysWaiting>=a)}(e)&&a.push({platform:"whatsapp",message:n.replace(/\*\*/g,"*").replace(/\n{3,}/g,"\n\n")}),"payment_overdue"===e.reason&&a.push({platform:"email",message:`
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0f1b35 0%, #4370d1 100%); padding: 20px; text-align: center; }
    .header img { max-width: 150px; }
    .content { padding: 30px; background: #fff; }
    .button { display: inline-block; padding: 12px 24px; background: #4370d1; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="color: white; margin: 0;">Valle 360</h2>
    </div>
    <div class="content">
      ${n.replace(/\n/g,"<br>")}
    </div>
    <div class="footer">
      <p>Este \xe9 um email autom\xe1tico da Val - Assistente Virtual Valle 360</p>
      <p>Se n\xe3o deseja mais receber estes emails, <a href="#">clique aqui</a></p>
    </div>
  </div>
</body>
</html>`}),a}(e),t=function(){let e=(process.env.NEXT_PUBLIC_APP_URL||"").trim();if(e)return e.replace(/\/+$/,"");let a=(process.env.VERCEL_URL||"").trim();return a?`https://${a.replace(/\/+$/,"")}`:null}(),n=function(){let e=(process.env.CRON_SECRET||"").trim();return e?`Bearer ${e}`:""}();for(let o of a){if("internal"===o.platform){let a=null;if("employee"===e.type){let{data:t}=await l.O.from("employees").select("user_id").eq("id",e.id).maybeSingle();a=t?.user_id?String(t.user_id):null}else if("client"===e.type){let{data:t}=await l.O.from("clients").select("user_id").eq("id",e.id).maybeSingle();a=t?.user_id?String(t.user_id):null}if(!a)continue;await l.O.from("notifications").insert({user_id:a,type:"reminder",title:"Lembrete da Val",message:o.message.substring(0,200),link:e.context.approvalLink||e.context.taskLink||null,is_read:!1,metadata:{actions:o.actions,target_type:e.type,target_entity_id:e.id,reason:e.reason}})}if("whatsapp"===o.platform&&e.phone){if(null===t)continue;await fetch(`${t}/api/whatsapp/send`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:e.phone,message:o.message})})}if("email"===o.platform){if(null===t)continue;await fetch(`${t}/api/email/send`,{method:"POST",headers:{"Content-Type":"application/json",...n?{Authorization:n}:{}},body:JSON.stringify({to:e.email,subject:{payment_overdue:"Lembrete: Fatura pendente - Valle 360",approval_pending:"Voc\xea tem aprova\xe7\xf5es pendentes - Valle 360",nps_feedback:"Como est\xe1 sua experi\xeancia? - Valle 360"}[e.reason]||"Mensagem da Valle 360",html:o.message})})}}return await l.O.from("collection_logs").insert({target_id:e.id,target_type:e.type,reason:e.reason,platforms:a.map(e=>e.platform),sent_at:new Date().toISOString()}),!0}catch(e){return console.error("Erro ao enviar cobran\xe7a:",e),!1}}async function m(){let e=await p(),a=0,t=0;for(let n of e){let{data:e}=await l.O.from("collection_logs").select("id").eq("target_id",n.id).eq("reason",n.reason).gte("sent_at",new Date(Date.now()-864e5).toISOString()).single();!e&&(await u(n)?a++:t++)}return{sent:a,failed:t}}var g=t(90176),f=t(87881),h=t(17478);let x="force-dynamic";async function _(e){let a=Date.now(),t=(0,f.T)(e);if(t)return t;let n=(0,g.t)();try{console.log("Iniciando cobran\xe7a autom\xe1tica...");let e=await m();return console.log(`Cobran\xe7a finalizada: ${e.sent} enviadas, ${e.failed} falhas`),await (0,f.m)({supabase:n,action:"collection",status:(e?.failed||0)>0?"error":"ok",durationMs:Date.now()-a,responseData:{sent:e.sent,failed:e.failed},errorMessage:(e?.failed||0)>0?"Falhas na cobran\xe7a autom\xe1tica":null}),i.NextResponse.json({success:!0,message:"Cobran\xe7a autom\xe1tica executada",result:e})}catch(e){return console.error("Erro na cobran\xe7a autom\xe1tica:",e),await (0,f.m)({supabase:n,action:"collection",status:"error",durationMs:Date.now()-a,errorMessage:e?.message||"Erro interno ao executar cobran\xe7a"}),i.NextResponse.json({error:"Erro interno ao executar cobran\xe7a"},{status:500})}}async function y(e){let a=Date.now(),t=(0,g.t)();try{let n=await (0,h.k)(e);if(!n.ok)return n.res;let o=await m();return await (0,f.m)({supabase:t,action:"collection",status:(o?.failed||0)>0?"error":"ok",durationMs:Date.now()-a,requestData:{manual:!0,by:n.userId},responseData:{sent:o.sent,failed:o.failed},errorMessage:(o?.failed||0)>0?"Falhas na cobran\xe7a manual":null}),i.NextResponse.json({success:!0,message:"Cobran\xe7a manual executada",result:o})}catch(e){return console.error("Erro na cobran\xe7a manual:",e),await (0,f.m)({supabase:t,action:"collection",status:"error",durationMs:Date.now()-a,errorMessage:e?.message||"Erro interno ao executar cobran\xe7a"}),i.NextResponse.json({error:"Erro interno ao executar cobran\xe7a"},{status:500})}}let v=new o.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/cron/collection/route",pathname:"/api/cron/collection",filename:"route",bundlePath:"app/api/cron/collection/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\cron\\collection\\route.ts",nextConfigOutput:"standalone",userland:n}),{requestAsyncStorage:b,staticGenerationAsyncStorage:w,serverHooks:S}=v,k="/api/cron/collection/route";function I(){return(0,s.patchFetch)({serverHooks:S,staticGenerationAsyncStorage:w})}},90176:(e,a,t)=>{t.d(a,{t:()=>o});var n=t(54128);function o(){let e="https://ikjgsqtykkhqimypacro.supabase.co",a=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!a)throw Error("Supabase admin n\xe3o configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");return(0,n.eI)(e,a,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}})}},17478:(e,a,t)=>{t.d(a,{k:()=>i});var n=t(87070),o=t(20344),r=t(71615),s=t(54128);async function i(e){let a=(0,r.cookies)(),t=(0,o.createRouteHandlerClient)({cookies:()=>a}),i=e.headers.get("authorization")||"",l=i.toLowerCase().startsWith("bearer ")?i.slice(7).trim():null,c=l?(0,s.eI)("https://ikjgsqtykkhqimypacro.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI",{global:{headers:{Authorization:`Bearer ${l}`}},auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}}):t,{data:d}=await c.auth.getUser();if(!d.user?.id)return{ok:!1,res:n.NextResponse.json({error:"N\xe3o autorizado"},{status:401})};let{data:p,error:u}=await c.rpc("is_admin");return u||!p?{ok:!1,res:n.NextResponse.json({error:"Acesso negado (admin)"},{status:403})}:{ok:!0,userId:d.user.id}}},87881:(e,a,t)=>{t.d(a,{T:()=>o,m:()=>r});var n=t(87070);function o(e){let a=String(process.env.CRON_SECRET||"").trim(),t=String(e.headers.get("authorization")||"").trim();return a&&t===`Bearer ${a}`?null:"1"===String(e.headers.get("x-vercel-cron")||"").trim()||String(e.headers.get("user-agent")||"").toLowerCase().includes("vercel-cron")?null:n.NextResponse.json({success:!1,error:"Unauthorized"},{status:401})}async function r(e){try{await e.supabase.from("integration_logs").insert({integration_id:"cron",action:e.action,status:e.status,request_data:e.requestData??null,response_data:e.responseData??null,error_message:e.errorMessage??null,duration_ms:Math.max(0,Math.floor(e.durationMs||0)),created_at:new Date().toISOString()})}catch{}}},1926:(e,a,t)=>{t.d(a,{O:()=>s});var n=t(54128);let o="https://ikjgsqtykkhqimypacro.supabase.co",r="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI";o&&r||console.error("❌ ERRO CR\xcdTICO: Vari\xe1veis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY n\xe3o encontradas!");let s=(0,n.eI)(o||"https://setup-missing.supabase.co",r||"setup-missing",{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}})}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),n=a.X(0,[89276,55972,54128,20958],()=>t(91152));module.exports=n})();