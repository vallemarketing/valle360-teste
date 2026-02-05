"use strict";(()=>{var e={};e.id=49622,e.ids=[49622],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},43055:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>x,patchFetch:()=>b,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>g,staticGenerationAsyncStorage:()=>m});var r={};a.r(r),a.d(r,{GET:()=>p,dynamic:()=>d});var o=a(49303),i=a(88716),s=a(60670),n=a(87070),l=a(10603);let d="force-dynamic";async function p(e){let{searchParams:t}=new URL(e.url),a=t.get("secret"),r=t.get("email");if("valle360-test-2026"!==a)return n.NextResponse.json({error:"Chave inv\xe1lida"},{status:403});let o={webhook:{configured:!0,url:"https://webhookprod.api01vaiplh.com.br/webhook/enviar-email",from:"valle360marketing@gmail.com"}},i=Object.entries(o).filter(([,e])=>e.configured).map(([e])=>e);if(!r)return n.NextResponse.json({success:!0,message:"Adicione ?email=seu@email.com para enviar teste",configs:o,activeProviders:i,fallbackOrder:["webhook","mailto"]});console.log(`
${"=".repeat(60)}`),console.log(`🧪 TESTE DE EMAIL`),console.log(`📧 Para: ${r}`),console.log(`📋 Provedores: ${i.join(", ")||"nenhum"}`),console.log(`${"=".repeat(60)}
`);try{let e=`✅ Email Funcionando!
Parab\xe9ns! O sistema de email est\xe1 funcionando.

📅 ${new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}
📧 ${r}

Valle 360`,t=await (0,l.Px)({to:r,subject:"\uD83E\uDDEA Teste Valle 360 - Email Funcionando!",text:e,html:`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); padding: 40px; border-radius: 16px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Email Funcionando!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0;">Valle 360</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; border: 1px solid #eee;">
            <p>Parab\xe9ns! O sistema de email est\xe1 funcionando. 🎉</p>
            <div style="background: #e8f4fd; border-left: 4px solid #1672d6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>📊 Detalhes:</strong><br>
              📅 ${new Date().toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}<br>
              📧 ${r}
            </div>
          </div>
        </body>
        </html>
      `});return n.NextResponse.json({success:t.success,message:t.message,provider:t.provider,mailtoUrl:t.mailtoUrl,error:t.error,configs:o,activeProviders:i,emailDestino:r,timestamp:new Date().toISOString()})}catch(e){return console.error("❌ Erro:",e),n.NextResponse.json({success:!1,error:e.message,configs:o,activeProviders:i},{status:500})}}let u=new o.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/public/test-email/route",pathname:"/api/public/test-email",filename:"route",bundlePath:"app/api/public/test-email/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\public\\test-email\\route.ts",nextConfigOutput:"standalone",userland:r}),{requestAsyncStorage:c,staticGenerationAsyncStorage:m,serverHooks:g}=u,x="/api/public/test-email/route";function b(){return(0,s.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:m})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[89276,55972,10603],()=>a(43055));module.exports=r})();