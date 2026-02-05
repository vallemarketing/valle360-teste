"use strict";exports.id=10603,exports.ids=[10603],exports.modules={10603:(e,o,a)=>{function t(e){let o=e.to||"",a=encodeURIComponent(e.subject||""),t=encodeURIComponent(e.text||(e.html?e.html.replace(/<[^>]+>/g,"").trim():"")||"");return`mailto:${o}?subject=${a}&body=${t}`}async function r(e){let o=e.html||e.text||"";try{let a=await fetch("https://webhookprod.api01vaiplh.com.br/webhook/enviar-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({from:"valle360marketing@gmail.com",to:e.to,subject:e.subject,body:o})});if(!a.ok){let e=await a.text();return{success:!1,message:"Erro ao enviar email",error:e||"WEBHOOK_ERROR"}}return await a.json(),{success:!0,provider:"webhook",message:"Email enviado via Webhook"}}catch(e){return{success:!1,message:"Erro no webhook",error:e.message}}}async function s(e,o){let a=[],s=t(e),l=process.env.WEBMAIL_URL||"https://webmail.vallegroup.com.br/",n=`${process.env.NEXT_PUBLIC_APP_URL||"https://valle-360-platform.vercel.app"}/login`,i=await r(e);return(a.push(`Webhook: ${i.success?"✅":"❌"} ${i.error||i.message}`),i.success)?{...i,mailtoUrl:s}:{success:!1,provider:"mailto",message:"Falha no envio autom\xe1tico. Use o mailto.",mailtoUrl:s,fallbackMode:!0,credentials:o?{email:o.email,senha:o.senha,webmailUrl:l,loginUrl:n}:void 0,error:a.join(" | ")}}a.d(o,{Pi:()=>i,Px:()=>s,xC:()=>t});let l=process.env.NEXT_PUBLIC_APP_URL||"https://valle-360-platform.vercel.app",n=process.env.WEBMAIL_URL||"https://webmail.vallegroup.com.br/";async function i(e){var o;let a="cliente"===(o={nome:e.nome,emailCorporativo:e.emailCorporativo,senha:e.senha,areasTexto:e.areasTexto,tipo:e.tipo}).tipo?`Ol\xe1 ${o.nome},

\\uD83D\\uDD10 Seus Dados de Acesso
   📧 Email: ${o.emailCorporativo}
   🔑 Senha: ${o.senha}
URL: ${l}

[Bot\xe3o: Acessar Valle 360]

⚠️ Altere sua senha no primeiro acesso!

\xa9 ${new Date().getFullYear()} Valle 360`:`Ol\xe1 ${o.nome},

💼 \xc1rea: ${o.areasTexto||"-"}

\\uD83D\\uDD10 Seus Dados de Acesso
   📧 Email: ${o.emailCorporativo}
   🔑 Senha: ${o.senha}
URL: ${l}

[Bot\xe3o: Acessar Valle 360]

📬 Webmail: ${n}

⚠️ Altere sua senha no primeiro acesso!

\xa9 ${new Date().getFullYear()} Valle 360`,t=function(e){let o=`${l}/login`,a="cliente"===e.tipo;return`
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 ${a?"Bem-vindo ao Valle 360!":"Bem-vindo \xe0 Fam\xedlia Valle 360!"}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #2c3e50; font-size: 16px; margin: 0 0 20px 0;">Ol\xe1 <strong>${e.nome}</strong>,</p>
              
              ${e.areasTexto?`
              <div style="background-color: #f0f6ff; border-left: 4px solid #1672d6; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #2c3e50; font-size: 14px; margin: 0;">
                  <strong>💼 \xc1rea:</strong> <span style="color: #1672d6;">${e.areasTexto}</span>
                </p>
              </div>
              `:""}

              <div style="background: linear-gradient(135deg, #1672d6 0%, #001533 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 20px; text-align: center;">🔐 Seus Dados de Acesso</h2>
                <div style="background-color: rgba(255,255,255,0.95); border-radius: 8px; padding: 20px;">
                  <p style="margin: 0 0 10px 0;"><strong>📧 Email:</strong> <span style="color: #1672d6;">${e.emailCorporativo}</span></p>
                  <p style="margin: 0;"><strong>🔑 Senha:</strong> <span style="color: #e74c3c; font-family: monospace;">${e.senha}</span></p>
                </div>
                <div style="text-align: center; margin: 25px 0 10px 0;">
                  <a href="${o}" style="display: inline-block; background-color: #ffffff; color: #1672d6; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 700;">➜ Acessar Valle 360</a>
                </div>
                ${a?"":`
                <div style="background-color: rgba(255,255,255,0.95); border-radius: 8px; padding: 15px; margin-top: 15px;">
                  <p style="margin: 0; font-size: 14px;"><strong>📬 Webmail:</strong> <a href="${n}" style="color: #1672d6;">${n}</a></p>
                </div>
                `}
              </div>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                <p style="color: #856404; font-size: 14px; margin: 0; font-weight: 600;">⚠️ Altere sua senha no primeiro acesso!</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px; margin: 0;">\xa9 ${new Date().getFullYear()} Valle 360</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}({nome:e.nome,emailCorporativo:e.emailCorporativo,senha:e.senha,areasTexto:e.areasTexto,tipo:e.tipo}),r="cliente"===e.tipo?"\uD83C\uDF89 Bem-vindo ao Valle 360! Seus Dados de Acesso":"\uD83C\uDF89 Bem-vindo \xe0 Fam\xedlia Valle 360!";return s({to:e.emailDestino,subject:r,html:t,text:a},{email:e.emailCorporativo,senha:e.senha})}}};