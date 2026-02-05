"use strict";(()=>{var e={};e.id=42259,e.ids=[42259],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},76721:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>E,patchFetch:()=>k,requestAsyncStorage:()=>v,routeModule:()=>h,serverHooks:()=>b,staticGenerationAsyncStorage:()=>_});var o={};t.r(o),t.d(o,{GET:()=>f,POST:()=>y,dynamic:()=>g});var n=t(49303),r=t(88716),s=t(60670),i=t(87070),l=t(20344),c=t(71615),u=t(51547),m=t(10603);let p={collection:{subject:"Lembrete de Pagamento - {{companyName}}",body:`Ol\xe1 {{name}},

Esperamos que esteja tudo bem!

Gostar\xedamos de lembrar que o pagamento referente aos servi\xe7os de {{month}} est\xe1 pendente.

**Valor:** R$ {{value}}
**Vencimento:** {{dueDate}}

Para sua conveni\xeancia, voc\xea pode realizar o pagamento atrav\xe9s do link abaixo:
{{paymentLink}}

Se j\xe1 efetuou o pagamento, por favor desconsidere este e-mail.

Qualquer d\xfavida, estamos \xe0 disposi\xe7\xe3o!

Atenciosamente,
Equipe Valle 360`,variables:["name","companyName","month","value","dueDate","paymentLink"]},collection_reminder:{subject:"⚠️ Pagamento em Atraso - {{companyName}}",body:`Ol\xe1 {{name}},

Notamos que o pagamento referente a {{month}} ainda n\xe3o foi identificado em nosso sistema.

**Valor:** R$ {{value}}
**Vencimento original:** {{dueDate}}
**Dias em atraso:** {{daysOverdue}}

Pedimos que regularize a situa\xe7\xe3o o mais breve poss\xedvel para evitar interrup\xe7\xe3o dos servi\xe7os.

Link para pagamento: {{paymentLink}}

Caso tenha alguma dificuldade ou precise de condi\xe7\xf5es especiais, entre em contato conosco.

Atenciosamente,
Equipe Financeira Valle 360`,variables:["name","companyName","month","value","dueDate","daysOverdue","paymentLink"]},collection_urgent:{subject:"\uD83D\uDEA8 URGENTE: Servi\xe7os podem ser suspensos - {{companyName}}",body:`{{name}},

Este \xe9 nosso \xfaltimo aviso antes da suspens\xe3o dos servi\xe7os.

O pagamento de R$ {{value}} est\xe1 em atraso h\xe1 {{daysOverdue}} dias.

**Para evitar a suspens\xe3o, regularize at\xe9 {{deadline}}.**

Link para pagamento imediato: {{paymentLink}}

Ap\xf3s a suspens\xe3o, a reativa\xe7\xe3o estar\xe1 sujeita a an\xe1lise e poss\xedveis taxas.

Se j\xe1 realizou o pagamento ou precisa negociar, responda este e-mail urgentemente.

Atenciosamente,
Diretoria Valle 360`,variables:["name","companyName","value","daysOverdue","deadline","paymentLink"]},welcome:{subject:"\uD83C\uDF89 Bem-vindo(a) \xe0 Valle 360, {{name}}!",body:`Ol\xe1 {{name}},

\xc9 com grande prazer que damos as boas-vindas a voc\xea e \xe0 {{companyName}} \xe0 fam\xedlia Valle 360!

Estamos muito animados em come\xe7ar essa parceria e ajudar voc\xea a alcan\xe7ar resultados incr\xedveis.

**Seus pr\xf3ximos passos:**
1. Acesse sua \xe1rea do cliente: {{clientAreaLink}}
2. Complete seu perfil
3. Agende uma reuni\xe3o de kickoff com nossa equipe

**Seu gestor de conta:** {{accountManager}}
**Email:** {{managerEmail}}
**WhatsApp:** {{managerPhone}}

Qualquer d\xfavida, estamos \xe0 disposi\xe7\xe3o!

Vamos juntos! 🚀

Equipe Valle 360`,variables:["name","companyName","clientAreaLink","accountManager","managerEmail","managerPhone"]},followup:{subject:"Como foi sua experi\xeancia? - Valle 360",body:`Ol\xe1 {{name}},

Espero que esteja tudo bem!

Gostaria de saber como est\xe3o as coisas por a\xed e se h\xe1 algo em que possamos ajudar.

{{customMessage}}

Estou \xe0 disposi\xe7\xe3o para uma conversa r\xe1pida se precisar!

Um abra\xe7o,
{{senderName}}
Valle 360`,variables:["name","customMessage","senderName"]},nps:{subject:"Sua opini\xe3o \xe9 muito importante! ⭐",body:`Ol\xe1 {{name}},

Queremos saber: de 0 a 10, o quanto voc\xea recomendaria a Valle 360 para um amigo ou colega?

Clique no n\xfamero que representa sua avalia\xe7\xe3o:

{{npsButtons}}

Sua resposta nos ajuda a melhorar continuamente!

Obrigado pela parceria,
Equipe Valle 360`,variables:["name","npsButtons"]},report:{subject:"\uD83D\uDCCA Relat\xf3rio Mensal de {{month}} - {{companyName}}",body:`Ol\xe1 {{name}},

Seu relat\xf3rio de performance de {{month}} est\xe1 pronto!

**Destaques do m\xeas:**
{{highlights}}

**M\xe9tricas principais:**
{{metrics}}

Acesse o relat\xf3rio completo: {{reportLink}}

Agende uma reuni\xe3o para discutirmos os resultados: {{scheduleLink}}

Atenciosamente,
Equipe Valle 360`,variables:["name","companyName","month","highlights","metrics","reportLink","scheduleLink"]},task_assigned:{subject:"\uD83D\uDCCB Nova tarefa atribu\xedda: {{taskTitle}}",body:`Ol\xe1 {{name}},

Uma nova tarefa foi atribu\xedda a voc\xea:

**Tarefa:** {{taskTitle}}
**Cliente:** {{clientName}}
**Prioridade:** {{priority}}
**Prazo:** {{deadline}}

**Descri\xe7\xe3o:**
{{description}}

Acesse o Kanban para mais detalhes: {{kanbanLink}}

Bom trabalho!`,variables:["name","taskTitle","clientName","priority","deadline","description","kanbanLink"]},task_completed:{subject:"✅ Tarefa conclu\xedda: {{taskTitle}}",body:`Ol\xe1 {{name}},

A tarefa "{{taskTitle}}" foi conclu\xedda com sucesso!

**Conclu\xedda por:** {{completedBy}}
**Data:** {{completedDate}}

Acesse para revisar: {{taskLink}}

Equipe Valle 360`,variables:["name","taskTitle","completedBy","completedDate","taskLink"]},contract_reminder:{subject:"\uD83D\uDCC4 Seu contrato vence em {{daysUntil}} dias",body:`Ol\xe1 {{name}},

Gostar\xedamos de informar que seu contrato com a Valle 360 vence em {{daysUntil}} dias ({{expirationDate}}).

Que tal renovarmos nossa parceria?

Preparamos condi\xe7\xf5es especiais de renova\xe7\xe3o para voc\xea!

Agende uma conversa: {{scheduleLink}}

Atenciosamente,
Equipe Comercial Valle 360`,variables:["name","daysUntil","expirationDate","scheduleLink"]},meeting_reminder:{subject:"⏰ Lembrete: Reuni\xe3o em {{timeUntil}}",body:`Ol\xe1 {{name}},

Lembrete da sua reuni\xe3o:

**Assunto:** {{meetingTitle}}
**Data:** {{meetingDate}}
**Hor\xe1rio:** {{meetingTime}}
**Link:** {{meetingLink}}

At\xe9 logo!`,variables:["name","timeUntil","meetingTitle","meetingDate","meetingTime","meetingLink"]},birthday:{subject:"\uD83C\uDF82 Feliz Anivers\xe1rio, {{name}}!",body:`Ol\xe1 {{name}},

Toda a equipe Valle 360 deseja a voc\xea um feliz anivers\xe1rio! 🎉

Que seu dia seja repleto de alegrias e realiza\xe7\xf5es.

Obrigado por fazer parte da nossa hist\xf3ria!

Com carinho,
Equipe Valle 360`,variables:["name"]},inactive_client:{subject:"Sentimos sua falta! \uD83D\uDC99",body:`Ol\xe1 {{name}},

Notamos que faz {{daysSinceLastContact}} dias que n\xe3o nos falamos.

Est\xe1 tudo bem? Gostariamos de saber como podemos ajudar.

{{customMessage}}

Podemos agendar uma conversa r\xe1pida?

Abra\xe7os,
{{senderName}}
Valle 360`,variables:["name","daysSinceLastContact","customMessage","senderName"]}};class d{markdownToHtml(e){return e.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>").replace(/^/,"<p>").replace(/$/,"</p>")}renderTemplate(e,a){let t=e;for(let[e,o]of Object.entries(a))t=t.replace(RegExp(`{{${e}}}`,"g"),String(o));return t}async generatePersonalizedContent(e,a,t){let o=p[e];if(!o)throw Error(`Template n\xe3o encontrado: ${e}`);try{let n=(await (0,u.F)({task:"copywriting",json:!0,temperature:.7,maxTokens:900,entityType:"email_personalization",entityId:null,messages:[{role:"system",content:`Voc\xea \xe9 um especialista em comunica\xe7\xe3o empresarial.
Personalize o email abaixo para ser mais humano e efetivo, mantendo o tom profissional.
Adapte a mensagem ao contexto do destinat\xe1rio.

Template original:
Assunto: ${o.subject}
Corpo: ${o.body}

Retorne JSON: { "subject": "assunto personalizado", "body": "corpo personalizado em markdown" }`},{role:"user",content:JSON.stringify({recipient:a,context:t,type:e})}]})).json||null;if(!n?.subject||!n?.body)throw Error("Resposta inv\xe1lida");return{subject:this.renderTemplate(n.subject,{...a,...t}),body:this.renderTemplate(n.body,{...a,...t})}}catch{return{subject:this.renderTemplate(o.subject,{...a,...t}),body:this.renderTemplate(o.body,{...a,...t})}}}async sendEmail(e){try{let{subject:a,body:t}=await this.generatePersonalizedContent(e.type,e.recipient,e.context),o=this.markdownToHtml(t),n=await (0,m.Px)({to:e.recipient.email,subject:a,text:t,html:o});return{success:n.success,error:n.error,mailtoUrl:n.mailtoUrl}}catch(e){return console.error("Erro ao enviar email:",e),{success:!1,error:e.message}}}async scheduleEmail(e,a,t,o){return{type:e,recipient:a,context:t,scheduledFor:o,status:"pending"}}async sendCollectionEmail(e,a){let t="collection";return a.daysOverdue&&(a.daysOverdue>15?t="collection_urgent":a.daysOverdue>0&&(t="collection_reminder")),this.sendEmail({type:t,recipient:e,context:{...a,value:a.value.toLocaleString("pt-BR",{minimumFractionDigits:2}),month:new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})},status:"pending"})}async sendWelcomeEmail(e,a){return this.sendEmail({type:"welcome",recipient:e,context:{...a,clientAreaLink:a.clientAreaLink||"https://valle360.com.br/cliente"},status:"pending"})}async sendNPSEmail(e,a){let t=Array.from({length:11},(e,t)=>`<a href="${a}?score=${t}" style="display:inline-block;padding:10px 15px;margin:2px;background:${t<=6?"#ef4444":t<=8?"#f59e0b":"#22c55e"};color:white;text-decoration:none;border-radius:5px;">${t}</a>`).join("");return this.sendEmail({type:"nps",recipient:e,context:{npsButtons:t},status:"pending"})}async sendMonthlyReport(e,a){return this.sendEmail({type:"report",recipient:e,context:{...a,highlights:a.highlights.map(e=>`• ${e}`).join("\n"),metrics:Object.entries(a.metrics).map(([e,a])=>`• ${e}: ${a}`).join("\n")},status:"pending"})}}let x=new d,g="force-dynamic";async function y(e){try{let a;let t=(0,c.cookies)(),o=(0,l.createRouteHandlerClient)({cookies:()=>t}),{data:{user:n},error:r}=await o.auth.getUser();if(r||!n)return i.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let{type:s,recipient:u,context:m,schedule:p}=await e.json();if(!s||!u?.email||!u?.name)return i.NextResponse.json({error:"type, recipient.email e recipient.name s\xe3o obrigat\xf3rios"},{status:400});switch(s){case"collection":case"collection_reminder":case"collection_urgent":if(!m?.value||!m?.dueDate)return i.NextResponse.json({error:"context.value e context.dueDate s\xe3o obrigat\xf3rios para cobran\xe7a"},{status:400});a=await x.sendCollectionEmail(u,m);break;case"welcome":if(!m?.accountManager)return i.NextResponse.json({error:"context.accountManager \xe9 obrigat\xf3rio para boas-vindas"},{status:400});a=await x.sendWelcomeEmail(u,m);break;case"nps":if(!m?.npsLink)return i.NextResponse.json({error:"context.npsLink \xe9 obrigat\xf3rio para NPS"},{status:400});a=await x.sendNPSEmail(u,m.npsLink);break;case"report":if(!m?.month||!m?.reportLink)return i.NextResponse.json({error:"context.month e context.reportLink s\xe3o obrigat\xf3rios para relat\xf3rio"},{status:400});a=await x.sendMonthlyReport(u,m);break;default:if(p){let e=await x.scheduleEmail(s,u,m||{},new Date(p));return i.NextResponse.json({success:!0,scheduled:!0,email:e})}a=await x.sendEmail({type:s,recipient:u,context:m||{},status:"pending"})}try{await o.from("email_logs").insert({user_id:n.id,type:s,recipient_email:u.email,recipient_name:u.name,success:a.success,message_id:a.messageId,error:a.error})}catch{}return i.NextResponse.json({success:a.success,messageId:a.messageId,mailtoUrl:a.mailtoUrl,error:a.error})}catch(e){return console.error("Erro na automa\xe7\xe3o de email:",e),i.NextResponse.json({error:"Erro ao enviar email",details:e.message},{status:500})}}async function f(e){try{let a=(0,c.cookies)(),t=(0,l.createRouteHandlerClient)({cookies:()=>a}),{data:{user:o},error:n}=await t.auth.getUser();if(n||!o)return i.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let{searchParams:r}=new URL(e.url),s=r.get("status")||"pending",{data:u,error:m}=await t.from("scheduled_emails").select("*").eq("status",s).order("scheduled_for",{ascending:!0}).limit(50);if(m)throw m;return i.NextResponse.json({success:!0,emails:u||[]})}catch(e){return console.error("Erro ao listar emails:",e),i.NextResponse.json({error:"Erro ao listar emails",details:e.message},{status:500})}}let h=new n.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/automations/email/route",pathname:"/api/automations/email",filename:"route",bundlePath:"app/api/automations/email/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\automations\\email\\route.ts",nextConfigOutput:"standalone",userland:o}),{requestAsyncStorage:v,staticGenerationAsyncStorage:_,serverHooks:b}=h,E="/api/automations/email/route";function k(){return(0,s.patchFetch)({serverHooks:b,staticGenerationAsyncStorage:_})}},90176:(e,a,t)=>{t.d(a,{t:()=>n});var o=t(54128);function n(){let e="https://ikjgsqtykkhqimypacro.supabase.co",a=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!a)throw Error("Supabase admin n\xe3o configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");return(0,o.eI)(e,a,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}})}},51547:(e,a,t)=>{t.d(a,{F:()=>b,getProviderStatus:()=>_});var o=t(90176);function n(e){let a=e.match(/\{[\s\S]*\}|\[[\s\S]*\]/);if(!a)throw Error("Resposta n\xe3o cont\xe9m JSON");return JSON.parse(a[0])}function r(e){if(!e)return null;try{return JSON.parse(e)}catch{return null}}function s(e){return e?Array.isArray(e)?e.map(e=>String(e).trim()).filter(Boolean):"string"==typeof e?[e.trim()].filter(Boolean):[]:[]}async function i(e){try{let a=(0,o.t)();await a.from("audit_logs").insert({user_id:e.userId||null,action:e.action,entity_type:e.entityType||"ai",entity_id:e.entityId||null,old_values:null,new_values:e.newValues,ip_address:null,user_agent:null,created_at:new Date().toISOString()})}catch{}}let l=null;async function c(){if(l&&Date.now()-l.fetchedAt<6e4)return{apiKey:l.apiKey,config:l.config};let e=null,a=null;try{let t=(0,o.t)(),{data:n}=await t.from("integration_configs").select("api_key, config").eq("integration_id","openrouter").single();e=n?.api_key||null,a=n?.config||null}catch{}return e=e||process.env.OPENROUTER_API_KEY||null,l={fetchedAt:Date.now(),apiKey:e,config:a},{apiKey:e,config:a}}function u(e){return e?"string"==typeof e?r(e):"object"==typeof e?e:null:null}async function m(e="general"){let a=process.env.OPENROUTER_MODEL;if(a)return[a].filter(Boolean);let{config:t}=await c(),o=t?.model?String(t.model).trim():"";if(o)return[o];let n=r(process.env.OPENROUTER_MODEL_POLICY_JSON),i=u(t?.model_policy)||u(t?.modelPolicy)||n||{default:["openrouter/auto"],general:["openrouter/auto"],analysis:["anthropic/claude-3.5-sonnet","openrouter/auto"],strategy:["anthropic/claude-3.5-sonnet","openrouter/auto"],kanban_insights:["anthropic/claude-3.5-sonnet","openrouter/auto"],kanban_message:["openai/gpt-4o","openrouter/auto"],copywriting:["openai/gpt-4o","openrouter/auto"],sales:["openai/gpt-4o","openrouter/auto"],sentiment:["google/gemini-1.5-pro","openrouter/auto"],classification:["google/gemini-1.5-pro","openrouter/auto"],hr:["anthropic/claude-3.5-sonnet","openrouter/auto"]},l=[...s(i[e]),...s(i.default),"openrouter/auto"],m=new Set,p=[];for(let e of l){let a=String(e).trim();!a||m.has(a)||(m.add(a),p.push(a))}return p.length?p:["openrouter/auto"]}async function p(){try{let e=(0,o.t)(),{data:a}=await e.from("integration_configs").select("api_key").eq("integration_id","anthropic").single();if(a?.api_key)return a.api_key}catch{}return process.env.ANTHROPIC_API_KEY||null}async function d(){try{let e=(0,o.t)(),{data:a}=await e.from("integration_configs").select("api_key").eq("integration_id","openai").single();if(a?.api_key)return a.api_key}catch{}return process.env.OPENAI_API_KEY||null}async function x(){try{let e=(0,o.t)(),{data:a}=await e.from("integration_configs").select("api_key").eq("integration_id","gemini").single();if(a?.api_key)return a.api_key}catch{}return process.env.GOOGLE_GEMINI_API_KEY||process.env.GOOGLE_CLOUD_API_KEY||null}async function g(e,a,t){let o=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json","HTTP-Referer":process.env.NEXT_PUBLIC_APP_URL||"http://localhost","X-Title":"Valle 360"},body:JSON.stringify({model:a,messages:e.messages,temperature:e.temperature??.7,max_tokens:e.maxTokens??1024,response_format:e.json?{type:"json_object"}:void 0})}),n=await o.text();if(!o.ok)throw Error(`OpenRouter error (${o.status}): ${n.slice(0,500)}`);let r=JSON.parse(n),s=r?.choices?.[0]?.message?.content||"";return{provider:"openrouter",model:r?.model||a,text:s,usage:r?.usage}}async function y(e){let{apiKey:a}=await c();if(!a)throw Error("OPENROUTER_API_KEY n\xe3o configurada");let t=await m(e.task),o=Date.now(),r=[];for(let l of t)try{let r=await g(e,l,a);return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:r.provider,model:r.model,ok:!0,ms:Date.now()-o,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json,openrouter_models_tried:t}}),e.json&&(r.json=n(r.text)),r}catch(a){var s;let e=a?.message||String(a);if(r.push({model:l,error:e}),!(!(s=function(e){let a=e.match(/OpenRouter error \\((\\d+)\\):/);if(!a?.[1])return null;let t=Number(a[1]);return Number.isFinite(t)?t:null}(e))||401!==s&&403!==s&&(429===s||408===s||s>=500&&s<=599||400===s&&/model|not found|no such|invalid/i.test(e))))break}let l=r.map(e=>`${e.model}: ${e.error}`).join(" | ");throw Error(`OpenRouter falhou em ${r.length} tentativa(s). ${l}`)}async function f(e){let a=await p();if(!a)throw Error("ANTHROPIC_API_KEY n\xe3o configurada");let t=function(e="general"){return process.env.ANTHROPIC_MODEL||"claude-3-5-sonnet-20241022"}(e.task),o=Date.now(),r=e.messages.find(e=>"system"===e.role)?.content,s=e.messages.filter(e=>"system"!==e.role).map(e=>`${e.role.toUpperCase()}: ${e.content}`).join("\n\n"),l=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":a,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:t,max_tokens:e.maxTokens??1024,temperature:e.temperature??.7,system:e.json?`${r||""}

Responda APENAS com um JSON v\xe1lido, sem texto extra.`:r,messages:[{role:"user",content:s}]})}),c=await l.text();if(!l.ok)throw Error(`Claude error (${l.status}): ${c.slice(0,500)}`);let u=JSON.parse(c),m=u?.content?.[0]?.text||"",d={provider:"claude",model:t,text:m,usage:u?.usage};return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:d.provider,model:d.model,ok:!0,ms:Date.now()-o,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json}}),e.json&&(d.json=n(m)),d}async function h(e){let a=await d();if(!a)throw Error("OPENAI_API_KEY n\xe3o configurada");let t=function(e="general"){return process.env.OPENAI_MODEL||"gpt-4o-mini"}(e.task),o=Date.now(),r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${a}`,"Content-Type":"application/json"},body:JSON.stringify({model:t,messages:e.messages,temperature:e.temperature??.7,max_tokens:e.maxTokens??1024,response_format:e.json?{type:"json_object"}:void 0})}),s=await r.text();if(!r.ok)throw Error(`OpenAI error (${r.status}): ${s.slice(0,500)}`);let l=JSON.parse(s),c=l?.choices?.[0]?.message?.content||"",u={provider:"openai",model:l?.model||t,text:c,usage:l?.usage};return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:u.provider,model:u.model,ok:!0,ms:Date.now()-o,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json}}),e.json&&(u.json=n(c)),u}async function v(e){let a=await x();if(!a)throw Error("GOOGLE_GEMINI_API_KEY/GOOGLE_CLOUD_API_KEY n\xe3o configurada");let t=function(e="general"){return process.env.GEMINI_MODEL||"gemini-1.5-flash"}(e.task),o=Date.now(),r=e.messages.find(e=>"system"===e.role)?.content,s=e.messages.filter(e=>"system"!==e.role).map(e=>`${e.role.toUpperCase()}: ${e.content}`).join("\n\n"),l=e.json?`${r||""}

Responda APENAS com um JSON v\xe1lido, sem texto extra.

${s}`:`${r||""}

${s}`,c=`https://generativelanguage.googleapis.com/v1beta/models/${t}:generateContent?key=${encodeURIComponent(a)}`,u=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:l}]}],generationConfig:{temperature:e.temperature??.7,maxOutputTokens:e.maxTokens??1024}})}),m=await u.text();if(!u.ok)throw Error(`Gemini error (${u.status}): ${m.slice(0,500)}`);let p=JSON.parse(m),d=p?.candidates?.[0]?.content?.parts?.map(e=>e.text).join("")||"",g={provider:"gemini",model:t,text:d,usage:p?.usageMetadata};return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:g.provider,model:g.model,ok:!0,ms:Date.now()-o,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json}}),e.json&&(g.json=n(d)),g}function _(){return{openrouter:!!process.env.OPENROUTER_API_KEY,claude:!!process.env.ANTHROPIC_API_KEY,openai:!!process.env.OPENAI_API_KEY,gemini:!!(process.env.GOOGLE_GEMINI_API_KEY||process.env.GOOGLE_CLOUD_API_KEY)}}async function b(e){let a=e.correlationId||"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let a=16*Math.random()|0;return("x"===e?a:3&a|8).toString(16)}),t={...e,correlationId:a},o=[];for(let e of[{provider:"openrouter",fn:y},{provider:"claude",fn:f},{provider:"openai",fn:h},{provider:"gemini",fn:v}])try{return await e.fn(t)}catch(r){let n=r?.message||String(r);o.push({provider:e.provider,error:n}),await i({userId:t.actorUserId||null,action:"ai.request_failed",entityType:t.entityType||"ai",entityId:t.entityId||null,newValues:{provider:e.provider,ok:!1,error:n.slice(0,500),task:t.task||"general",correlation_id:a,json:!!t.json}})}let n=o.map(e=>`${e.provider}: ${e.error}`).join(" | ");throw Error(`Falha em todos os provedores. ${n}`)}}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),o=a.X(0,[89276,55972,54128,20958,10603],()=>t(76721));module.exports=o})();