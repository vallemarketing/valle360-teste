"use strict";exports.id=68546,exports.ids=[68546],exports.modules={90176:(e,t,o)=>{o.d(t,{t:()=>r});var a=o(54128);function r(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e||!t)throw Error("Supabase admin n\xe3o configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");return(0,a.eI)(e,t,{auth:{persistSession:!1,autoRefreshToken:!1,detectSessionInUrl:!1}})}},30233:(e,t,o)=>{o.d(t,{iF:()=>s});var a=o(74211);async function r(e,t){let o=t||process.env.GOOGLE_GEMINI_API_KEY||process.env.GOOGLE_CLOUD_API_KEY;if(!o)throw Error("Google Cloud API Key n\xe3o configurada");try{let t;let a=await fetch(`https://language.googleapis.com/v2/documents:analyzeSentiment?key=${o}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({document:{type:"PLAIN_TEXT",content:e.text,languageCode:e.language||"pt-BR"},encodingType:"UTF8"})});if(!a.ok){let e=await a.json();throw Error(`Google API Error: ${e.error?.message||a.statusText}`)}let r=await a.json(),n=r.documentSentiment?.score||0,s=r.documentSentiment?.magnitude||0;t=n>.25?"positive":n<-.25?"negative":"neutral";let i=(r.sentences||[]).map(e=>({text:e.text?.content||"",score:e.sentiment?.score||0,magnitude:e.sentiment?.magnitude||0}));return{overall:t,score:n,magnitude:s,confidence:Math.min(s/2,1),sentences:i,language:r.languageCode||e.language||"pt-BR"}}catch(e){throw console.error("Erro na an\xe1lise de sentimento Google:",e),Error(`Falha na an\xe1lise Google: ${e.message}`)}}let n={defaultProvider:"openai",fallbackProvider:"google",enableAutoSelect:!0,preferredLanguageProvider:{pt:"google","pt-BR":"google",en:"openai",es:"google"}};async function s(e){let t=Date.now(),o=e.provider||n.defaultProvider;if("auto"===o||n.enableAutoSelect&&!e.provider){var a,r;a=e.text,o=(r=e.language)&&n.preferredLanguageProvider[r]?n.preferredLanguageProvider[r]:/[ãáàâéêíóôõúç]/i.test(a)?"google":a.length<50?"openai":a.length>2e3?"google":n.defaultProvider}try{let a;switch(o){case"google":a=await l(e,t);break;case"claude":a=await c(e,t);break;default:a=await i(e,t)}return a}catch(t){if(n.fallbackProvider&&o!==n.fallbackProvider)return console.warn(`Falha com ${o}, tentando fallback ${n.fallbackProvider}`),s({...e,provider:n.fallbackProvider});throw t}}async function i(e,t){let o=await (0,a.iF)({text:e.text,context:e.context,language:e.language});return{provider:"openai",overall:o.overall,score:o.score,confidence:o.confidence,details:{emotions:o.emotions,keywords:o.keywords},summary:o.summary,processingTime:Date.now()-t,language:e.language||"pt-BR"}}async function l(e,t){let o=await r({text:e.text,language:e.language});return{provider:"google",overall:o.overall,score:o.score,confidence:o.confidence,details:{magnitude:o.magnitude,sentences:o.sentences.map(e=>({text:e.text,score:e.score}))},processingTime:Date.now()-t,language:o.language}}async function c(e,t){let o=process.env.ANTHROPIC_API_KEY;if(!o)throw Error("Anthropic API Key n\xe3o configurada");let a=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":o,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-3-haiku-20240307",max_tokens:1024,messages:[{role:"user",content:`Analise o sentimento do seguinte texto e retorne APENAS um JSON v\xe1lido com esta estrutura:
{
  "overall": "positive" | "neutral" | "negative",
  "score": n\xfamero de -1 (muito negativo) a 1 (muito positivo),
  "confidence": n\xfamero de 0 a 1,
  "emotions": {
    "joy": 0-1, "sadness": 0-1, "anger": 0-1, 
    "fear": 0-1, "surprise": 0-1, "trust": 0-1
  },
  "keywords": ["palavras-chave"],
  "summary": "resumo em uma frase"
}

Texto: ${e.text}`}]})});if(!a.ok){let e=await a.json();throw Error(`Claude API Error: ${e.error?.message||a.statusText}`)}let r=await a.json(),n=(r.content?.[0]?.text||"{}").match(/\{[\s\S]*\}/);if(!n)throw Error("Resposta inv\xe1lida do Claude");let s=JSON.parse(n[0]);return{provider:"claude",overall:s.overall,score:s.score,confidence:s.confidence,details:{emotions:s.emotions,keywords:s.keywords},summary:s.summary,processingTime:Date.now()-t,language:e.language||"pt-BR"}}},98724:(e,t,o)=>{o.d(t,{$J:()=>n,JF:()=>s});var a=o(54214);let r=null;function n(e){let t=e||process.env.OPENAI_API_KEY;if(!t)throw Error("OpenAI API Key n\xe3o configurada");return(!r||e)&&(r=new a.ZP({apiKey:t})),r}let s={chat:"gpt-4-turbo-preview",embedding:"text-embedding-3-small",analysis:"gpt-4-turbo-preview"}},74211:(e,t,o)=>{o.d(t,{UR:()=>n,iF:()=>r,uX:()=>s});var a=o(98724);async function r(e,t){let o=(0,a.$J)(t),r=`Voc\xea \xe9 um especialista em an\xe1lise de sentimentos. Analise o texto fornecido e retorne APENAS um JSON v\xe1lido com a seguinte estrutura:
{
  "overall": "positive" | "neutral" | "negative",
  "score": n\xfamero de -1 (muito negativo) a 1 (muito positivo),
  "confidence": n\xfamero de 0 a 1 indicando confian\xe7a na an\xe1lise,
  "emotions": {
    "joy": 0-1,
    "sadness": 0-1,
    "anger": 0-1,
    "fear": 0-1,
    "surprise": 0-1,
    "trust": 0-1
  },
  "keywords": ["palavras-chave", "relevantes"],
  "summary": "Resumo breve do sentimento em uma frase"
}

${e.context?`Contexto adicional: ${e.context}`:""}
Idioma do texto: ${e.language||"portugu\xeas brasileiro"}`;try{let t=await o.chat.completions.create({model:a.JF.analysis,messages:[{role:"system",content:r},{role:"user",content:e.text}],temperature:.3,response_format:{type:"json_object"}}),n=t.choices[0]?.message?.content;if(!n)throw Error("Resposta vazia da OpenAI");return JSON.parse(n)}catch(e){throw console.error("Erro na an\xe1lise de sentimento:",e),Error(`Falha na an\xe1lise de sentimento: ${e.message}`)}}async function n(e,t){let o;let a=[];for(let o=0;o<e.length;o+=5){let n=e.slice(o,o+5),s=await Promise.all(n.map(e=>r(e,t)));a.push(...s)}let n=a.reduce((e,t)=>e+t.score,0)/a.length;o=n>.2?"positive":n<-.2?"negative":"neutral";let s=Math.floor(a.length/2),i=a.slice(0,s).reduce((e,t)=>e+t.score,0)/s,l=a.slice(s).reduce((e,t)=>e+t.score,0)/(a.length-s)-i;return{results:a,averageScore:n,overallSentiment:o,trendDirection:l>.1?"improving":l<-.1?"declining":"stable"}}async function s(e,t){let o=(0,a.$J)(t),r=`Voc\xea \xe9 um especialista em an\xe1lise de sentimentos de redes sociais. Analise os posts fornecidos e retorne APENAS um JSON v\xe1lido com:
{
  "bySentiment": { "positive": %, "neutral": %, "negative": % },
  "byPlatform": { "plataforma": { "score": -1 a 1, "count": n\xfamero } },
  "topKeywords": ["palavras", "mais", "mencionadas"],
  "recommendations": ["recomenda\xe7\xf5es", "para", "melhorar", "engajamento"]
}`;try{let t=await o.chat.completions.create({model:a.JF.analysis,messages:[{role:"system",content:r},{role:"user",content:JSON.stringify(e)}],temperature:.3,response_format:{type:"json_object"}}),n=t.choices[0]?.message?.content;if(!n)throw Error("Resposta vazia da OpenAI");return JSON.parse(n)}catch(e){throw console.error("Erro na an\xe1lise de redes sociais:",e),Error(`Falha na an\xe1lise: ${e.message}`)}}}};