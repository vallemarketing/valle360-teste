"use strict";(()=>{var e={};e.id=23376,e.ids=[23376],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{e.exports=require("buffer")},93082:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>h,patchFetch:()=>b,requestAsyncStorage:()=>x,routeModule:()=>g,serverHooks:()=>v,staticGenerationAsyncStorage:()=>f});var a={};o.r(a),o.d(a,{GET:()=>m,POST:()=>u,dynamic:()=>p});var s=o(49303),r=o(88716),i=o(60670),n=o(87070),l=o(20344),d=o(71615),c=o(10603);let p="force-dynamic";async function u(e){try{let t=(0,d.cookies)(),o=(0,l.createRouteHandlerClient)({cookies:()=>t}),{data:a}=await o.auth.getUser();if(!a.user?.id)return n.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let{data:s}=await o.rpc("is_admin");if(!s)return n.NextResponse.json({error:"Acesso negado"},{status:403});let{emailDestino:r}=await e.json();if(!r)return n.NextResponse.json({error:"emailDestino \xe9 obrigat\xf3rio"},{status:400});console.log(`
${"=".repeat(60)}`),console.log(`🧪 TESTE DE ENVIO DE EMAIL`),console.log(`📧 Destino: ${r}`),console.log(`${"=".repeat(60)}
`);let i={webhook:{configured:!0,url:"https://webhookprod.api01vaiplh.com.br/webhook/enviar-email",from:"valle360marketing@gmail.com"}};console.log("\uD83D\uDCCB Configura\xe7\xf5es dispon\xedveis:",i);let p=`✅ Teste de Email

Este \xe9 um email de teste do sistema Valle 360.
Se voc\xea est\xe1 vendo este email, o envio autom\xe1tico funcionou.

Data: ${new Date().toLocaleString("pt-BR")}
Destino: ${r}

Valle 360 - Sistema de Marketing Inteligente`,u=await (0,c.Px)({to:r,subject:"\uD83E\uDDEA Teste de Email - Valle 360",text:p,html:`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Teste de Email</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Valle 360</p>
          </div>
          <div style="padding: 30px;">
            <p>Este \xe9 um email de teste enviado pelo sistema Valle 360.</p>
            <p>Se voc\xea est\xe1 vendo este email, significa que o envio est\xe1 funcionando! 🎉</p>
            <div style="background: #f0f9ff; border-left: 4px solid #1672d6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>📊 Informa\xe7\xf5es do Teste:</strong><br>
              Data: ${new Date().toLocaleString("pt-BR")}<br>
              Destino: ${r}
            </div>
            <p style="color: #666; font-size: 12px;">
              Valle 360 - Sistema de Marketing Inteligente
            </p>
          </div>
        </body>
        </html>
      `});return console.log(`
📊 Resultado: ${u.success?"✅ SUCESSO":"❌ FALHA"}`),u.provider&&console.log(`📧 Provedor: ${u.provider}`),console.log(`💬 Mensagem: ${u.message}
`),n.NextResponse.json({success:u.success,message:u.message,provider:u.provider,mailtoUrl:u.mailtoUrl,configs:i,emailDestino:r})}catch(e){return console.error("❌ Erro no teste de email:",e),n.NextResponse.json({success:!1,error:e.message},{status:500})}}async function m(e){try{let e=(0,d.cookies)(),t=(0,l.createRouteHandlerClient)({cookies:()=>e}),{data:o}=await t.auth.getUser();if(!o.user?.id)return n.NextResponse.json({error:"N\xe3o autorizado"},{status:401});let{data:a}=await t.rpc("is_admin");if(!a)return n.NextResponse.json({error:"Acesso negado"},{status:403});let s={webhook:{configured:!0,url:"https://webhookprod.api01vaiplh.com.br/webhook/enviar-email",from:"valle360marketing@gmail.com"}},r=Object.entries(s).filter(([,e])=>e.configured).map(([e])=>e);return n.NextResponse.json({success:!0,activeProviders:r,configs:s,fallbackOrder:["webhook","mailto"]})}catch(e){return n.NextResponse.json({error:e.message},{status:500})}}let g=new s.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/admin/test-email/route",pathname:"/api/admin/test-email",filename:"route",bundlePath:"app/api/admin/test-email/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\admin\\test-email\\route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:x,staticGenerationAsyncStorage:f,serverHooks:v}=g,h="/api/admin/test-email/route";function b(){return(0,i.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:f})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),a=t.X(0,[89276,55972,54128,20958,10603],()=>o(93082));module.exports=a})();