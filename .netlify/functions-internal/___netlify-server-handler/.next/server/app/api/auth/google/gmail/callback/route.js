"use strict";(()=>{var e={};e.id=56114,e.ids=[56114],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},32694:e=>{e.exports=require("http2")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},35816:e=>{e.exports=require("process")},86624:e=>{e.exports=require("querystring")},76162:e=>{e.exports=require("stream")},82452:e=>{e.exports=require("tls")},74175:e=>{e.exports=require("tty")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},72254:e=>{e.exports=require("node:buffer")},87561:e=>{e.exports=require("node:fs")},83074:e=>{e.exports=require("node:http")},22286:e=>{e.exports=require("node:https")},87503:e=>{e.exports=require("node:net")},49411:e=>{e.exports=require("node:path")},97742:e=>{e.exports=require("node:process")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},41041:e=>{e.exports=require("node:url")},47261:e=>{e.exports=require("node:util")},65628:e=>{e.exports=require("node:zlib")},6192:(e,r,o)=>{o.r(r),o.d(r,{originalPathname:()=>g,patchFetch:()=>m,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>h,staticGenerationAsyncStorage:()=>x});var t={};o.r(t),o.d(t,{GET:()=>d,dynamic:()=>l});var a=o(49303),n=o(88716),i=o(60670),s=o(87070),p=o(97816);let l="force-dynamic";async function d(e){let{searchParams:r}=new URL(e.url),o=r.get("code"),t=r.get("error");if(t)return new s.NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro na Autoriza\xe7\xe3o</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ Erro na Autoriza\xe7\xe3o</h1>
        <p>O Google retornou um erro: <strong>${t}</strong></p>
        <a href="/api/auth/google/gmail">Tentar novamente</a>
      </body>
      </html>
    `,{headers:{"Content-Type":"text/html"}});if(!o)return new s.NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><title>C\xf3digo n\xe3o encontrado</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ C\xf3digo n\xe3o encontrado</h1>
        <p>O par\xe2metro 'code' n\xe3o foi retornado pelo Google.</p>
        <a href="/api/auth/google/gmail">Tentar novamente</a>
      </body>
      </html>
    `,{headers:{"Content-Type":"text/html"}});try{let e=function(){let e=process.env.GOOGLE_CLIENT_ID,r=process.env.GOOGLE_CLIENT_SECRET,o=process.env.GOOGLE_REDIRECT_URI||`${process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000"}/api/auth/google/gmail/callback`;return new p.lkr.auth.OAuth2(e,r,o)}(),{tokens:r}=await e.getToken(o);return console.log("✅ Tokens Gmail obtidos:",{has_access_token:!!r.access_token,has_refresh_token:!!r.refresh_token,expiry_date:r.expiry_date}),new s.NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gmail Autorizado!</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
          .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          h1 { color: #10b981; }
          .token-box { background: #1e293b; color: #10b981; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 10px 0; }
          .warning { background: #fef3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .copy-btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
          .copy-btn:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Gmail Autorizado com Sucesso!</h1>
          
          <p>Agora voc\xea precisa copiar o <strong>Refresh Token</strong> abaixo e adicionar no Vercel.</p>
          
          <h3>🔑 Refresh Token:</h3>
          <div class="token-box" id="refresh-token">${r.refresh_token||"N\xc3O GERADO - Tente novamente"}</div>
          <button class="copy-btn" onclick="copyToken()">📋 Copiar Refresh Token</button>
          
          <div class="warning">
            <strong>⚠️ IMPORTANTE:</strong><br>
            1. Copie o Refresh Token acima<br>
            2. V\xe1 no Vercel → Settings → Environment Variables<br>
            3. Adicione: <code>GOOGLE_REFRESH_TOKEN</code> = (o token copiado)<br>
            4. Adicione: <code>GMAIL_USER</code> = (seu email que autorizou)<br>
            5. Fa\xe7a redeploy
          </div>
          
          <h3>📧 Vari\xe1veis para adicionar no Vercel:</h3>
          <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto;">
GOOGLE_CLIENT_ID=(seu client_id do Google Cloud Console)
GOOGLE_CLIENT_SECRET=(seu client_secret do Google Cloud Console)
GOOGLE_REFRESH_TOKEN=${r.refresh_token||"SEU_TOKEN_AQUI"}
GMAIL_USER=seu-email@gmail.com
          </pre>
          
          <p><a href="/admin/colaboradores">← Voltar para Colaboradores</a></p>
        </div>
        
        <script>
          function copyToken() {
            const token = document.getElementById('refresh-token').innerText;
            navigator.clipboard.writeText(token).then(() => {
              alert('Refresh Token copiado!');
            });
          }
        </script>
      </body>
      </html>
    `,{headers:{"Content-Type":"text/html"}})}catch(e){return console.error("Erro ao trocar c\xf3digo por tokens:",e),new s.NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><title>Erro ao Obter Tokens</title></head>
      <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e74c3c;">❌ Erro ao Obter Tokens</h1>
        <p>${e.message}</p>
        <a href="/api/auth/google/gmail">Tentar novamente</a>
      </body>
      </html>
    `,{headers:{"Content-Type":"text/html"}})}}let u=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/auth/google/gmail/callback/route",pathname:"/api/auth/google/gmail/callback",filename:"route",bundlePath:"app/api/auth/google/gmail/callback/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\auth\\google\\gmail\\callback\\route.ts",nextConfigOutput:"standalone",userland:t}),{requestAsyncStorage:c,staticGenerationAsyncStorage:x,serverHooks:h}=u,g="/api/auth/google/gmail/callback/route";function m(){return(0,i.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:x})}}};var r=require("../../../../../../webpack-runtime.js");r.C(e);var o=e=>r(r.s=e),t=r.X(0,[89276,55972,2749,6684,80843,97816],()=>o(6192));module.exports=t})();