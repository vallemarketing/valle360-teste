"use strict";(()=>{var e={};e.id=40744,e.ids=[40744],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},23727:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>y,patchFetch:()=>_,requestAsyncStorage:()=>x,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>g});var a={};o.r(a),o.d(a,{GET:()=>p,POST:()=>d,dynamic:()=>l});var r=o(49303),n=o(88716),s=o(60670),i=o(87070),c=o(51547);let l="force-dynamic",u=(e,t)=>{let o=`Voc\xea \xe9 Val, a assistente de IA da Valle 360, uma ag\xeancia de marketing digital inovadora.

Caracter\xedsticas da Val:
- Profissional, amig\xe1vel e prestativa
- Especialista em marketing digital, redes sociais, tr\xe1fego pago e design
- Sempre fornece respostas pr\xe1ticas e acion\xe1veis
- Usa emojis ocasionalmente para tornar a conversa mais agrad\xe1vel
- Responde em portugu\xeas brasileiro
- Conhece bem a Valle 360 e seus servi\xe7os`,a={"Social Media":`${o}

Como especialista em Social Media, voc\xea ajuda com:
- Estrat\xe9gias de conte\xfado para redes sociais
- Cria\xe7\xe3o de calend\xe1rio editorial
- M\xe9tricas e an\xe1lise de performance
- Tend\xeancias e melhores pr\xe1ticas
- Engajamento e crescimento de audi\xeancia`,"Tr\xe1fego Pago":`${o}

Como especialista em Tr\xe1fego Pago, voc\xea ajuda com:
- Estrat\xe9gias de an\xfancios no Facebook Ads, Google Ads e outras plataformas
- Otimiza\xe7\xe3o de campanhas e or\xe7amento
- An\xe1lise de m\xe9tricas (CPC, CPM, ROAS, CTR)
- Segmenta\xe7\xe3o de p\xfablico e remarketing
- Testes A/B e otimiza\xe7\xe3o de convers\xe3o`,Design:`${o}

Como especialista em Design, voc\xea ajuda com:
- Diretrizes de identidade visual
- Tend\xeancias de design gr\xe1fico
- Ferramentas e softwares de design
- Composi\xe7\xe3o, tipografia e teoria das cores
- Design para redes sociais e materiais de marketing`,Comercial:`${o}

Como especialista Comercial, voc\xea ajuda com:
- Estrat\xe9gias de vendas e fechamento de neg\xf3cios
- An\xe1lise de funil de vendas
- Propostas comerciais e precifica\xe7\xe3o
- Gest\xe3o de clientes e p\xf3s-venda
- T\xe9cnicas de negocia\xe7\xe3o e persuas\xe3o`,RH:`${o}

Como especialista em RH, voc\xea ajuda com:
- Recrutamento e sele\xe7\xe3o de talentos
- Gest\xe3o de performance e desenvolvimento
- Clima organizacional e engajamento
- Processos de onboarding e treinamento
- Legisla\xe7\xe3o trabalhista e benef\xedcios`,Finance:`${o}

Como especialista em Finan\xe7as, voc\xea ajuda com:
- An\xe1lise financeira e indicadores
- Fluxo de caixa e planejamento financeiro
- Precifica\xe7\xe3o e an\xe1lise de rentabilidade
- Controle de custos e or\xe7amento
- Relat\xf3rios gerenciais e KPIs financeiros`};return"client"===t?`${o}

Como assistente para clientes, voc\xea ajuda com:
- Informa\xe7\xf5es sobre o desempenho das campanhas
- Explica\xe7\xf5es sobre m\xe9tricas e resultados
- Sugest\xf5es de estrat\xe9gias de marketing
- D\xfavidas sobre servi\xe7os da Valle 360
- An\xe1lise de competidores e mercado

Seja especialmente atencioso e did\xe1tico ao explicar conceitos t\xe9cnicos.`:a[e||""]||`${o}

Voc\xea ajuda colaboradores e gestores com:
- D\xfavidas sobre processos internos
- Sugest\xf5es de melhorias e boas pr\xe1ticas
- An\xe1lise de dados e m\xe9tricas
- Suporte em decis\xf5es estrat\xe9gicas
- Automa\xe7\xe3o e otimiza\xe7\xe3o de tarefas`};async function d(e){try{let{message:t,area:o,userType:a,conversationHistory:r=[]}=await e.json();if(!t)return i.NextResponse.json({error:"Mensagem n\xe3o fornecida"},{status:400});let n=[{role:"system",content:u(o,a)},...r,{role:"user",content:t}],s=await (0,c.F)({messages:n,task:"Comercial"===o?"sales":"RH"===o?"hr":"general",temperature:.7,maxTokens:800,json:!1,entityType:"chat",entityId:null,actorUserId:null});return i.NextResponse.json({success:!0,message:s.text,model:s.model,provider:s.provider,usage:s.usage})}catch(e){if(console.error("Erro na API de chat:",e),e?.code==="insufficient_quota")return i.NextResponse.json({error:"Limite de uso da OpenAI atingido. Por favor, verifique sua conta."},{status:402});if(e?.code==="invalid_api_key")return i.NextResponse.json({error:"API key da OpenAI inv\xe1lida"},{status:401});return i.NextResponse.json({error:"Erro ao processar mensagem",details:e.message},{status:500})}}async function p(){let{getProviderStatus:e}=await Promise.resolve().then(o.bind(o,51547)),t=e();return i.NextResponse.json({status:"ok",service:"Valle 360 AI Chat API",timestamp:new Date().toISOString(),providers:t})}let m=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/chat/route",pathname:"/api/chat",filename:"route",bundlePath:"app/api/chat/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\chat\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:x,staticGenerationAsyncStorage:g,serverHooks:f}=m,y="/api/chat/route";function _(){return(0,s.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:g})}},90176:(e,t,o)=>{o.d(t,{t:()=>r});var a=o(54128);function r(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase admin n\xe3o configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}})}},51547:(e,t,o)=>{o.d(t,{F:()=>E,getProviderStatus:()=>h});var a=o(90176);function r(e){let t=e.match(/\{[\s\S]*\}|\[[\s\S]*\]/);if(!t)throw Error("Resposta n\xe3o cont\xe9m JSON");return JSON.parse(t[0])}function n(e){if(!e)return null;try{return JSON.parse(e)}catch{return null}}function s(e){return e?Array.isArray(e)?e.map(e=>String(e).trim()).filter(Boolean):"string"==typeof e?[e.trim()].filter(Boolean):[]:[]}async function i(e){try{let t=(0,a.t)();await t.from("audit_logs").insert({user_id:e.userId||null,action:e.action,entity_type:e.entityType||"ai",entity_id:e.entityId||null,old_values:null,new_values:e.newValues,ip_address:null,user_agent:null,created_at:new Date().toISOString()})}catch{}}let c=null;async function l(){if(c&&Date.now()-c.fetchedAt<6e4)return{apiKey:c.apiKey,config:c.config};let e=null,t=null;try{let o=(0,a.t)(),{data:r}=await o.from("integration_configs").select("api_key, config").eq("integration_id","openrouter").single();e=r?.api_key||null,t=r?.config||null}catch{}return e=e||process.env.OPENROUTER_API_KEY||null,c={fetchedAt:Date.now(),apiKey:e,config:t},{apiKey:e,config:t}}function u(e){return e?"string"==typeof e?n(e):"object"==typeof e?e:null:null}async function d(e="general"){let t=process.env.OPENROUTER_MODEL;if(t)return[t].filter(Boolean);let{config:o}=await l(),a=o?.model?String(o.model).trim():"";if(a)return[a];let r=n(process.env.OPENROUTER_MODEL_POLICY_JSON),i=u(o?.model_policy)||u(o?.modelPolicy)||r||{default:["openrouter/auto"],general:["openrouter/auto"],analysis:["anthropic/claude-3.5-sonnet","openrouter/auto"],strategy:["anthropic/claude-3.5-sonnet","openrouter/auto"],kanban_insights:["anthropic/claude-3.5-sonnet","openrouter/auto"],kanban_message:["openai/gpt-4o","openrouter/auto"],copywriting:["openai/gpt-4o","openrouter/auto"],sales:["openai/gpt-4o","openrouter/auto"],sentiment:["google/gemini-1.5-pro","openrouter/auto"],classification:["google/gemini-1.5-pro","openrouter/auto"],hr:["anthropic/claude-3.5-sonnet","openrouter/auto"]},c=[...s(i[e]),...s(i.default),"openrouter/auto"],d=new Set,p=[];for(let e of c){let t=String(e).trim();!t||d.has(t)||(d.add(t),p.push(t))}return p.length?p:["openrouter/auto"]}async function p(){try{let e=(0,a.t)(),{data:t}=await e.from("integration_configs").select("api_key").eq("integration_id","anthropic").single();if(t?.api_key)return t.api_key}catch{}return process.env.ANTHROPIC_API_KEY||null}async function m(){try{let e=(0,a.t)(),{data:t}=await e.from("integration_configs").select("api_key").eq("integration_id","openai").single();if(t?.api_key)return t.api_key}catch{}return process.env.OPENAI_API_KEY||null}async function x(){try{let e=(0,a.t)(),{data:t}=await e.from("integration_configs").select("api_key").eq("integration_id","gemini").single();if(t?.api_key)return t.api_key}catch{}return process.env.GOOGLE_GEMINI_API_KEY||process.env.GOOGLE_CLOUD_API_KEY||null}async function g(e,t,o){let a=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json","HTTP-Referer":process.env.NEXT_PUBLIC_APP_URL||"http://localhost","X-Title":"Valle 360"},body:JSON.stringify({model:t,messages:e.messages,temperature:e.temperature??.7,max_tokens:e.maxTokens??1024,response_format:e.json?{type:"json_object"}:void 0})}),r=await a.text();if(!a.ok)throw Error(`OpenRouter error (${a.status}): ${r.slice(0,500)}`);let n=JSON.parse(r),s=n?.choices?.[0]?.message?.content||"";return{provider:"openrouter",model:n?.model||t,text:s,usage:n?.usage}}async function f(e){let{apiKey:t}=await l();if(!t)throw Error("OPENROUTER_API_KEY n\xe3o configurada");let o=await d(e.task),a=Date.now(),n=[];for(let c of o)try{let n=await g(e,c,t);return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:n.provider,model:n.model,ok:!0,ms:Date.now()-a,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json,openrouter_models_tried:o}}),e.json&&(n.json=r(n.text)),n}catch(t){var s;let e=t?.message||String(t);if(n.push({model:c,error:e}),!(!(s=function(e){let t=e.match(/OpenRouter error \\((\\d+)\\):/);if(!t?.[1])return null;let o=Number(t[1]);return Number.isFinite(o)?o:null}(e))||401!==s&&403!==s&&(429===s||408===s||s>=500&&s<=599||400===s&&/model|not found|no such|invalid/i.test(e))))break}let c=n.map(e=>`${e.model}: ${e.error}`).join(" | ");throw Error(`OpenRouter falhou em ${n.length} tentativa(s). ${c}`)}async function y(e){let t=await p();if(!t)throw Error("ANTHROPIC_API_KEY n\xe3o configurada");let o=function(e="general"){return process.env.ANTHROPIC_MODEL||"claude-3-5-sonnet-20241022"}(e.task),a=Date.now(),n=e.messages.find(e=>"system"===e.role)?.content,s=e.messages.filter(e=>"system"!==e.role).map(e=>`${e.role.toUpperCase()}: ${e.content}`).join("\n\n"),c=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":t,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:o,max_tokens:e.maxTokens??1024,temperature:e.temperature??.7,system:e.json?`${n||""}

Responda APENAS com um JSON v\xe1lido, sem texto extra.`:n,messages:[{role:"user",content:s}]})}),l=await c.text();if(!c.ok)throw Error(`Claude error (${c.status}): ${l.slice(0,500)}`);let u=JSON.parse(l),d=u?.content?.[0]?.text||"",m={provider:"claude",model:o,text:d,usage:u?.usage};return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:m.provider,model:m.model,ok:!0,ms:Date.now()-a,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json}}),e.json&&(m.json=r(d)),m}async function _(e){let t=await m();if(!t)throw Error("OPENAI_API_KEY n\xe3o configurada");let o=function(e="general"){return process.env.OPENAI_MODEL||"gpt-4o-mini"}(e.task),a=Date.now(),n=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({model:o,messages:e.messages,temperature:e.temperature??.7,max_tokens:e.maxTokens??1024,response_format:e.json?{type:"json_object"}:void 0})}),s=await n.text();if(!n.ok)throw Error(`OpenAI error (${n.status}): ${s.slice(0,500)}`);let c=JSON.parse(s),l=c?.choices?.[0]?.message?.content||"",u={provider:"openai",model:c?.model||o,text:l,usage:c?.usage};return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:u.provider,model:u.model,ok:!0,ms:Date.now()-a,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json}}),e.json&&(u.json=r(l)),u}async function v(e){let t=await x();if(!t)throw Error("GOOGLE_GEMINI_API_KEY/GOOGLE_CLOUD_API_KEY n\xe3o configurada");let o=function(e="general"){return process.env.GEMINI_MODEL||"gemini-1.5-flash"}(e.task),a=Date.now(),n=e.messages.find(e=>"system"===e.role)?.content,s=e.messages.filter(e=>"system"!==e.role).map(e=>`${e.role.toUpperCase()}: ${e.content}`).join("\n\n"),c=e.json?`${n||""}

Responda APENAS com um JSON v\xe1lido, sem texto extra.

${s}`:`${n||""}

${s}`,l=`https://generativelanguage.googleapis.com/v1beta/models/${o}:generateContent?key=${encodeURIComponent(t)}`,u=await fetch(l,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:c}]}],generationConfig:{temperature:e.temperature??.7,maxOutputTokens:e.maxTokens??1024}})}),d=await u.text();if(!u.ok)throw Error(`Gemini error (${u.status}): ${d.slice(0,500)}`);let p=JSON.parse(d),m=p?.candidates?.[0]?.content?.parts?.map(e=>e.text).join("")||"",g={provider:"gemini",model:o,text:m,usage:p?.usageMetadata};return await i({userId:e.actorUserId||null,action:"ai.request",entityType:e.entityType||"ai",entityId:e.entityId||null,newValues:{provider:g.provider,model:g.model,ok:!0,ms:Date.now()-a,task:e.task||"general",correlation_id:e.correlationId,json:!!e.json}}),e.json&&(g.json=r(m)),g}function h(){return{openrouter:!!process.env.OPENROUTER_API_KEY,claude:!!process.env.ANTHROPIC_API_KEY,openai:!!process.env.OPENAI_API_KEY,gemini:!!(process.env.GOOGLE_GEMINI_API_KEY||process.env.GOOGLE_CLOUD_API_KEY)}}async function E(e){let t=e.correlationId||"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{let t=16*Math.random()|0;return("x"===e?t:3&t|8).toString(16)}),o={...e,correlationId:t},a=[];for(let e of[{provider:"openrouter",fn:f},{provider:"claude",fn:y},{provider:"openai",fn:_},{provider:"gemini",fn:v}])try{return await e.fn(o)}catch(n){let r=n?.message||String(n);a.push({provider:e.provider,error:r}),await i({userId:o.actorUserId||null,action:"ai.request_failed",entityType:o.entityType||"ai",entityId:o.entityId||null,newValues:{provider:e.provider,ok:!1,error:r.slice(0,500),task:o.task||"general",correlation_id:t,json:!!o.json}})}let r=a.map(e=>`${e.provider}: ${e.error}`).join(" | ");throw Error(`Falha em todos os provedores. ${r}`)}}};var t=require("../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),a=t.X(0,[89276,55972,54128],()=>o(23727));module.exports=a})();