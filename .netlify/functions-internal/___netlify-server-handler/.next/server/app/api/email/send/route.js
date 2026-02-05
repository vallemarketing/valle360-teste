"use strict";(()=>{var e={};e.id=68194,e.ids=[68194],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},44052:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>v,patchFetch:()=>S,requestAsyncStorage:()=>h,routeModule:()=>f,serverHooks:()=>b,staticGenerationAsyncStorage:()=>y});var s={};r.r(s),r.d(s,{POST:()=>x,dynamic:()=>u,runtime:()=>m});var a=r(49303),i=r(88716),n=r(60670),o=r(87070),l=r(20344),c=r(71615),d=r(54128),p=r(46882);let u="force-dynamic",m="nodejs";async function g(){let e=(0,c.cookies)(),t=(0,l.createRouteHandlerClient)({cookies:()=>e}),{data:r}=await t.auth.getUser();if(!r.user?.id)return!1;let{data:s}=await t.rpc("is_admin");return!!s}async function x(e){try{let t=function(e){let t=process.env.CRON_SECRET;return!!t&&e.headers.get("authorization")===`Bearer ${t}`}(e),r=!t&&await g();if(!t&&!r)return o.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let s=await e.json(),a=function(e){if(Array.isArray(e))return e.map(e=>({email:String(e).trim()})).filter(e=>e.email);let t=String(e||"").trim();return t?[{email:t}]:[]}(s?.to),i=String(s?.subject||"").trim(),n=s?.html?String(s.html):void 0,l=s?.text?String(s.text):void 0;if(0===a.length)return o.NextResponse.json({error:"Destinat\xe1rio \xe9 obrigat\xf3rio"},{status:400});if(!i)return o.NextResponse.json({error:"Assunto \xe9 obrigat\xf3rio"},{status:400});if(!n&&!l)return o.NextResponse.json({error:"Conte\xfado (html ou text) \xe9 obrigat\xf3rio"},{status:400});let c=(process.env.SENDGRID_API_KEY||"").trim(),u=(process.env.SENDGRID_FROM_EMAIL||"").trim(),m=(process.env.SENDGRID_FROM_NAME||"").trim(),x=c,f=u||"noreply@valle360.com.br",h=m||"Valle 360",y=c?"env":"mailto",b=function(){let e="https://ikjgsqtykkhqimypacro.supabase.co",t=process.env.SUPABASE_SERVICE_ROLE_KEY;return e&&t?(0,d.eI)(e,t,{auth:{persistSession:!1}}):null}();if(b){let{data:e}=await b.from("integration_configs").select("status, api_key, config").eq("integration_id","sendgrid").maybeSingle(),t=(e?.status==="connected"?String(e?.api_key||""):"").trim();t&&(x=t,y="db"),e?.config?.fromEmail&&(f=String(e.config.fromEmail)),e?.config?.fromName&&(h=String(e.config.fromName))}x||(x="mailto",y="mailto");let v=(0,p.w2)({apiKey:x,fromEmail:f,fromName:h}),S=Date.now(),$=await v.sendEmail({to:a,subject:i,html:n,text:l,categories:["valle360","transactional"]}),_=Date.now()-S;if(b)try{await b.from("integration_logs").insert({integration_id:"sendgrid",action:"send_custom",status:$.success?"success":"error",request_data:{to:a.length,connectedVia:y},error_message:$.error,duration_ms:_,response_data:{connectedVia:y},created_at:new Date().toISOString()})}catch{}if(!$.success)return o.NextResponse.json({error:"Erro ao preparar email",details:$.error},{status:500});return o.NextResponse.json({success:!0,connectedVia:y,mailtoUrl:$.mailtoUrl})}catch(e){return o.NextResponse.json({error:e?.message||"Erro interno"},{status:500})}}let f=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/email/send/route",pathname:"/api/email/send",filename:"route",bundlePath:"app/api/email/send/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\email\\send\\route.ts",nextConfigOutput:"standalone",userland:s}),{requestAsyncStorage:h,staticGenerationAsyncStorage:y,serverHooks:b}=f,v="/api/email/send/route";function S(){return(0,n.patchFetch)({serverHooks:b,staticGenerationAsyncStorage:y})}},46882:(e,t,r)=>{r.d(t,{Rp:()=>s,qC:()=>i,w2:()=>a});class s{constructor(e){this.apiKey=e.apiKey,this.fromEmail=e.fromEmail,this.fromName=e.fromName}async request(e,t={}){let r=await fetch(`https://api.sendgrid.com/v3${e}`,{...t,headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json",...t.headers}});if(202===r.status||200===r.status||201===r.status){let e=await r.text();return e?JSON.parse(e):{success:!0}}let s=await r.json();throw Error(s.errors?.[0]?.message||"Erro na API SendGrid")}async sendEmail(e){let t=Array.isArray(e.to)?e.to:[e.to],r=t[0]?.email||"",s=e.subject||"",a=(e.text||e.html||"").replace(/<[^>]+>/g,"").trim();return{success:!0,mailtoUrl:`mailto:${r}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(a)}`}}async sendBulkEmail(e,t){return{success:0,failed:e.length,errors:["Envio em lote n\xe3o suportado via mailto. Use envio manual."]}}async listTemplates(){return this.request("/templates?generations=dynamic")}async getTemplate(e){return this.request(`/templates/${e}`)}async getStats(e,t){let r=`/stats?start_date=${e}`;return t&&(r+=`&end_date=${t}`),this.request(r)}async getCategoryStats(e,t,r){let s=`/categories/${e}/stats?start_date=${t}`;return r&&(s+=`&end_date=${r}`),this.request(s)}async addContact(e,t){let r={email:e};t?.firstName&&(r.first_name=t.firstName),t?.lastName&&(r.last_name=t.lastName),t?.customFields&&(r.custom_fields=t.customFields);let s={contacts:[r]};return t?.listIds&&(s.list_ids=t.listIds),this.request("/marketing/contacts",{method:"PUT",body:JSON.stringify(s)})}async searchContacts(e){return this.request("/marketing/contacts/search",{method:"POST",body:JSON.stringify({query:e})})}async deleteContact(e){return this.request(`/marketing/contacts?ids=${e}`,{method:"DELETE"})}async getLists(){return this.request("/marketing/lists")}async createList(e){return this.request("/marketing/lists",{method:"POST",body:JSON.stringify({name:e})})}async addToSuppressionList(e,t){let r="unsubscribes"===t?"/asm/suppressions/global":`/suppression/${t}`;await this.request(r,{method:"POST",body:JSON.stringify({recipient_emails:e})})}async getSuppressionList(e){let t="unsubscribes"===e?"/asm/suppressions/global":`/suppression/${e}`;return this.request(t)}}function a(e){return new s(e)}let i={welcome:(e,t)=>({subject:`Bem-vindo \xe0 ${t}! 🎉`,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4370d1;">Ol\xe1, ${e}!</h1>
        <p>Seja muito bem-vindo(a) \xe0 ${t}!</p>
        <p>Estamos muito felizes em ter voc\xea conosco. A partir de agora, voc\xea ter\xe1 acesso a todas as nossas ferramentas e recursos.</p>
        <p>Se precisar de ajuda, n\xe3o hesite em entrar em contato.</p>
        <p>Abra\xe7os,<br/>Equipe ${t}</p>
      </div>
    `}),notification:(e,t,r,s)=>({subject:e,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${e}</h2>
        <p>${t}</p>
        ${r?`
          <p style="margin-top: 20px;">
            <a href="${r}" style="background-color: #4370d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${s||"Ver mais"}
            </a>
          </p>
        `:""}
      </div>
    `}),meetingScheduled:(e,t,r,s,a)=>({subject:`Reuni\xe3o Agendada - ${t} \xe0s ${r}`,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4370d1;">Reuni\xe3o Confirmada! 📅</h2>
        <p>Ol\xe1 ${e},</p>
        <p>Sua reuni\xe3o foi agendada com sucesso.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Data:</strong> ${t}</p>
          <p><strong>Hor\xe1rio:</strong> ${r}</p>
          ${a?`<p><strong>Descri\xe7\xe3o:</strong> ${a}</p>`:""}
        </div>
        <p>
          <a href="${s}" style="background-color: #4370d1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Entrar na Reuni\xe3o
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Adicione este evento ao seu calend\xe1rio para n\xe3o esquecer!
        </p>
      </div>
    `}),invoice:(e,t,r,s,a)=>({subject:`Fatura #${t} - Pagamento Pendente`,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Fatura #${t}</h2>
        <p>Ol\xe1 ${e},</p>
        <p>Segue sua fatura para pagamento:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Valor:</strong> ${r}</p>
          <p><strong>Vencimento:</strong> ${s}</p>
        </div>
        <p>
          <a href="${a}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Pagar Agora
          </a>
        </p>
      </div>
    `})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[89276,55972,54128,20958],()=>r(44052));module.exports=s})();