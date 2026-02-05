"use strict";(()=>{var e={};e.id=98326,e.ids=[98326],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},23979:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>v,patchFetch:()=>T,requestAsyncStorage:()=>f,routeModule:()=>x,serverHooks:()=>O,staticGenerationAsyncStorage:()=>A});var r={};a.r(r),a.d(r,{GET:()=>m,POST:()=>g,PUT:()=>_,dynamic:()=>u});var o=a(49303),n=a(88716),s=a(60670),i=a(87070),c=a(1926);let d=[{id:"objeto",title:"DO OBJETO",content:`O presente contrato tem por objeto a presta\xe7\xe3o de servi\xe7os de marketing digital pela CONTRATADA \xe0 CONTRATANTE, conforme especifica\xe7\xf5es detalhadas no Anexo I.`,is_required:!0,category:"general"},{id:"valor",title:"DO VALOR E FORMA DE PAGAMENTO",content:`Pela execu\xe7\xe3o dos servi\xe7os descritos, a CONTRATANTE pagar\xe1 \xe0 CONTRATADA o valor mensal de R$ {{VALOR_MENSAL}} ({{VALOR_EXTENSO}}), com vencimento todo dia {{DIA_VENCIMENTO}} de cada m\xeas.`,is_required:!0,category:"payment"},{id:"prazo",title:"DO PRAZO",content:`O presente contrato ter\xe1 vig\xeancia de {{DURACAO_MESES}} meses, com in\xedcio em {{DATA_INICIO}} e t\xe9rmino em {{DATA_FIM}}, podendo ser renovado mediante acordo entre as partes.`,is_required:!0,category:"general"},{id:"obrigacoes_contratada",title:"DAS OBRIGA\xc7\xd5ES DA CONTRATADA",content:`A CONTRATADA se obriga a:
a) Executar os servi\xe7os contratados com zelo e dedica\xe7\xe3o;
b) Apresentar relat\xf3rios mensais de desempenho;
c) Manter sigilo sobre informa\xe7\xf5es confidenciais da CONTRATANTE;
d) Cumprir os prazos estabelecidos para entregas;
e) Comunicar previamente qualquer impedimento na execu\xe7\xe3o dos servi\xe7os.`,is_required:!0,category:"service"},{id:"obrigacoes_contratante",title:"DAS OBRIGA\xc7\xd5ES DA CONTRATANTE",content:`A CONTRATANTE se obriga a:
a) Efetuar os pagamentos nas datas acordadas;
b) Fornecer materiais e informa\xe7\xf5es necess\xe1rias \xe0 execu\xe7\xe3o dos servi\xe7os;
c) Aprovar ou solicitar altera\xe7\xf5es nos materiais em at\xe9 48 horas \xfateis;
d) Designar respons\xe1vel para comunica\xe7\xe3o com a CONTRATADA.`,is_required:!0,category:"service"},{id:"confidencialidade",title:"DA CONFIDENCIALIDADE",content:`As partes se comprometem a manter sigilo sobre todas as informa\xe7\xf5es confidenciais compartilhadas durante a vig\xeancia deste contrato, por prazo indeterminado, mesmo ap\xf3s seu t\xe9rmino.`,is_required:!0,category:"confidentiality"},{id:"rescisao",title:"DA RESCIS\xc3O",content:`O presente contrato poder\xe1 ser rescindido:
a) Por acordo m\xfatuo entre as partes;
b) Por inadimplemento de qualquer cl\xe1usula, mediante notifica\xe7\xe3o pr\xe9via de {{DIAS_NOTIFICACAO}} dias;
c) Pela CONTRATANTE, mediante aviso pr\xe9vio de 30 dias e pagamento de multa de {{MULTA_RESCISAO}}% sobre o valor restante do contrato.`,is_required:!0,category:"termination"},{id:"multa_atraso",title:"DA MULTA POR ATRASO",content:`Em caso de atraso no pagamento, incidir\xe1 multa de 2% (dois por cento) sobre o valor devido, acrescido de juros de mora de 1% (um por cento) ao m\xeas, calculados pro rata die.`,is_required:!0,category:"payment"},{id:"propriedade_intelectual",title:"DA PROPRIEDADE INTELECTUAL",content:`Todos os materiais desenvolvidos pela CONTRATADA durante a vig\xeancia deste contrato ser\xe3o de propriedade exclusiva da CONTRATANTE ap\xf3s a quita\xe7\xe3o integral dos valores devidos.`,is_required:!1,category:"general"},{id:"foro",title:"DO FORO",content:`Fica eleito o foro da Comarca de {{CIDADE_FORO}}/{{ESTADO_FORO}} para dirimir quaisquer quest\xf5es oriundas deste contrato, com ren\xfancia expressa a qualquer outro, por mais privilegiado que seja.`,is_required:!0,category:"general"}];class l{async generateFromProposal(e,t){try{let{data:a}=await c.O.from("proposals").select("*").eq("id",e).single();if(!a||"accepted"!==a.status)return console.error("Proposta n\xe3o encontrada ou n\xe3o aceita"),null;let r=new Date,o=a.contract_duration||6,n=new Date(r);n.setMonth(n.getMonth()+o);let s=a.items.map(e=>({name:e.service_name,description:e.description||"",monthly_value:e.total/o,deliverables:e.features||[]})),i={proposal_id:e,client_name:a.client_name,client_email:a.client_email,client_company:a.client_company,client_cnpj:a.client_data?.cpf_cnpj,client_address:a.client_data?.address,services:s,total_value:a.total,payment_terms:a.payment_terms||"Mensal, vencimento dia 10",duration_months:o,start_date:r.toISOString(),end_date:n.toISOString(),status:"draft",created_at:new Date().toISOString(),created_by:t,template_used:"standard",renewal_type:"manual",cancellation_fee_percent:30,cancellation_notice_days:30},{data:d,error:l}=await c.O.from("contracts").insert(i).select().single();if(l)return console.error("Erro ao salvar contrato:",l),null;return await this.notifyLegalTeam(d),d}catch(e){return console.error("Erro ao gerar contrato:",e),null}}generateContractDocument(e,t){let a=t?.clauses||d,r=new Date().toLocaleDateString("pt-BR"),o=e.total_value/e.duration_months,n=t=>t.replace(/{{VALOR_MENSAL}}/g,o.toLocaleString("pt-BR",{minimumFractionDigits:2})).replace(/{{VALOR_EXTENSO}}/g,this.numberToWords(o)).replace(/{{DIA_VENCIMENTO}}/g,"10").replace(/{{DURACAO_MESES}}/g,e.duration_months.toString()).replace(/{{DATA_INICIO}}/g,new Date(e.start_date).toLocaleDateString("pt-BR")).replace(/{{DATA_FIM}}/g,new Date(e.end_date).toLocaleDateString("pt-BR")).replace(/{{DIAS_NOTIFICACAO}}/g,(e.cancellation_notice_days||30).toString()).replace(/{{MULTA_RESCISAO}}/g,(e.cancellation_fee_percent||30).toString()).replace(/{{CIDADE_FORO}}/g,"S\xe3o Paulo").replace(/{{ESTADO_FORO}}/g,"SP"),s=e.services.map(e=>`
      <div class="service-item">
        <h4>${e.name}</h4>
        <p>${e.description}</p>
        <p><strong>Valor mensal:</strong> R$ ${e.monthly_value.toLocaleString("pt-BR",{minimumFractionDigits:2})}</p>
        ${e.deliverables.length>0?`
          <p><strong>Entregas:</strong></p>
          <ul>
            ${e.deliverables.map(e=>`<li>${e}</li>`).join("")}
          </ul>
        `:""}
      </div>
    `).join(""),i=a.map((e,t)=>`
      <div class="clause">
        <h3>CL\xc1USULA ${t+1}\xaa - ${e.title}</h3>
        <p>${n(e.content)}</p>
      </div>
    `).join("");return`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Presta\xe7\xe3o de Servi\xe7os - ${e.client_company}</title>
  <style>
    @page { margin: 2cm; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #1672d6;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: #1672d6;
    }
    h1 {
      font-size: 16pt;
      text-align: center;
      margin: 30px 0;
      text-transform: uppercase;
    }
    h2 {
      font-size: 14pt;
      margin-top: 30px;
      color: #1672d6;
    }
    h3 {
      font-size: 12pt;
      margin-top: 20px;
      text-transform: uppercase;
    }
    .parties {
      margin: 30px 0;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .party {
      margin-bottom: 20px;
    }
    .party strong {
      color: #1672d6;
    }
    .clause {
      margin: 20px 0;
      text-align: justify;
    }
    .service-item {
      margin: 15px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    .service-item h4 {
      margin: 0 0 10px 0;
      color: #1672d6;
    }
    .signatures {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 10px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10pt;
      color: #666;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Valle Group</div>
    <p>CNPJ: 00.000.000/0001-00</p>
    <p>Av. Paulista, 1000 - S\xe3o Paulo/SP</p>
  </div>

  <h1>Contrato de Presta\xe7\xe3o de Servi\xe7os de Marketing Digital</h1>

  <div class="parties">
    <div class="party">
      <strong>CONTRATADA:</strong> VALLE GROUP MARKETING DIGITAL LTDA, pessoa jur\xeddica de direito privado, inscrita no CNPJ sob n\xba 00.000.000/0001-00, com sede na Av. Paulista, 1000, S\xe3o Paulo/SP, neste ato representada por seu representante legal.
    </div>
    <div class="party">
      <strong>CONTRATANTE:</strong> ${e.client_company}, ${e.client_cnpj?`inscrita no CNPJ sob n\xba ${e.client_cnpj},`:""} ${e.client_address?`com sede em ${e.client_address},`:""} neste ato representada por ${e.client_name}, doravante denominada simplesmente CONTRATANTE.
    </div>
  </div>

  <p>As partes acima qualificadas t\xeam entre si justo e contratado o presente instrumento, que se reger\xe1 pelas cl\xe1usulas e condi\xe7\xf5es seguintes:</p>

  ${i}

  <h2>ANEXO I - SERVI\xc7OS CONTRATADOS</h2>
  ${s}

  <div class="signatures">
    <div class="signature-box">
      <div class="signature-line">
        <strong>CONTRATADA</strong><br>
        Valle Group Marketing Digital Ltda
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <strong>CONTRATANTE</strong><br>
        ${e.client_name}<br>
        ${e.client_company}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>S\xe3o Paulo, ${r}</p>
    <p>Contrato gerado automaticamente pelo sistema Valle 360</p>
  </div>
</body>
</html>
    `}async sendForSignature(e){try{let{data:t}=await c.O.from("contracts").select("*").eq("id",e).single();if(!t)return!1;return await c.O.from("contracts").update({status:"pending_signature",sent_for_signature_at:new Date().toISOString()}).eq("id",e),console.log(`[CONTRATO] Enviado para assinatura: ${t.client_email}`),!0}catch(e){return console.error("Erro ao enviar contrato:",e),!1}}async signContract(e,t){try{let{error:a}=await c.O.from("contracts").update({status:"signed",signed_at:new Date().toISOString(),signed_by:t.signed_by,signature_ip:t.signature_ip}).eq("id",e);if(a)return console.error("Erro ao assinar contrato:",a),!1;return await this.notifyFinanceTeam(e),!0}catch(e){return console.error("Erro ao assinar contrato:",e),!1}}calculateCancellationFee(e){let t=new Date(e.end_date),a=new Date,r=Math.max(0,Math.ceil((t.getTime()-a.getTime())/2592e6)),o=e.total_value/e.duration_months*r,n=e.cancellation_fee_percent||30;return{remaining_months:r,remaining_value:o,fee_percent:n,fee_value:n/100*o}}async getContracts(e){try{let t=c.O.from("contracts").select("*").order("created_at",{ascending:!1});if(e?.status&&(t=t.eq("status",e.status)),e?.client_id&&(t=t.eq("client_id",e.client_id)),e?.expiring_soon){let e=new Date;e.setDate(e.getDate()+30),t=t.eq("status","active").lte("end_date",e.toISOString())}let{data:a,error:r}=await t;if(r)return console.error("Erro ao buscar contratos:",r),[];return a||[]}catch(e){return console.error("Erro ao buscar contratos:",e),[]}}async notifyLegalTeam(e){try{let{data:t}=await c.O.from("user_profiles").select("user_id, user_type").in("user_type",["super_admin","admin"]),a=(t||[]).map(e=>e.user_id).filter(Boolean).map(e=>String(e));if(0===a.length)return;await c.O.from("notifications").insert(a.map(t=>({user_id:t,type:"contract_review",title:"Novo contrato para revis\xe3o",message:`Contrato de ${e.client_company} aguardando revis\xe3o jur\xeddica`,link:"/admin/contratos",metadata:{contract_id:e.id,target_role:"juridico"},is_read:!1,created_at:new Date().toISOString()})))}catch{}}async notifyFinanceTeam(e){let{data:t}=await c.O.from("contracts").select("*").eq("id",e).single();if(t)try{let{data:a}=await c.O.from("user_profiles").select("user_id, user_type").in("user_type",["finance","super_admin","admin"]),r=(a||[]).map(e=>e.user_id).filter(Boolean).map(e=>String(e));if(0===r.length)return;await c.O.from("notifications").insert(r.map(a=>({user_id:a,type:"contract_signed",title:"Contrato assinado - Iniciar faturamento",message:`Contrato de ${t.client_company} assinado.`,link:"/admin/financeiro",metadata:{contract_id:e,target_role:"financeiro"},is_read:!1,created_at:new Date().toISOString()})))}catch{}}numberToWords(e){let t=e.toLocaleString("pt-BR",{minimumFractionDigits:2});return`${t} reais`}}let p=new l,u="force-dynamic";async function m(e){try{let{searchParams:t}=new URL(e.url),a=t.get("status")||void 0,r=t.get("client_id")||void 0,o="true"===t.get("expiring_soon"),n=t.get("id");if(n){let{data:e,error:t}=await c.O.from("contracts").select("*").eq("id",n).single();if(t)return i.NextResponse.json({success:!1,error:"Contrato n\xe3o encontrado"},{status:404});return i.NextResponse.json({success:!0,contract:e})}let s=await p.getContracts({status:a,client_id:r,expiring_soon:o});return i.NextResponse.json({success:!0,contracts:s})}catch(e){return console.error("Erro ao buscar contratos:",e),i.NextResponse.json({success:!1,error:"Erro ao buscar contratos"},{status:500})}}async function g(e){try{let{action:t,...a}=await e.json();if("generate_from_proposal"===t){let{proposal_id:e,created_by:t}=a;if(!e||!t)return i.NextResponse.json({success:!1,error:"proposal_id e created_by s\xe3o obrigat\xf3rios"},{status:400});let r=await p.generateFromProposal(e,t);if(!r)return i.NextResponse.json({success:!1,error:"Erro ao gerar contrato"},{status:500});return i.NextResponse.json({success:!0,contract:r})}if("generate_document"===t){let{contract_id:e}=a,{data:t,error:r}=await c.O.from("contracts").select("*").eq("id",e).single();if(r||!t)return i.NextResponse.json({success:!1,error:"Contrato n\xe3o encontrado"},{status:404});let o=p.generateContractDocument(t);return i.NextResponse.json({success:!0,document:o})}if("send_for_signature"===t){let{contract_id:e}=a;if(!await p.sendForSignature(e))return i.NextResponse.json({success:!1,error:"Erro ao enviar para assinatura"},{status:500});return i.NextResponse.json({success:!0,message:"Contrato enviado para assinatura"})}if("calculate_cancellation_fee"===t){let{contract_id:e}=a,{data:t,error:r}=await c.O.from("contracts").select("*").eq("id",e).single();if(r||!t)return i.NextResponse.json({success:!1,error:"Contrato n\xe3o encontrado"},{status:404});let o=p.calculateCancellationFee(t);return i.NextResponse.json({success:!0,fee:o})}let r={client_name:a.client_name,client_email:a.client_email,client_company:a.client_company,client_cnpj:a.client_cnpj,client_address:a.client_address,services:a.services||[],total_value:a.total_value,payment_terms:a.payment_terms||"Mensal",duration_months:a.duration_months||6,start_date:a.start_date||new Date().toISOString(),end_date:a.end_date,status:"draft",created_at:new Date().toISOString(),created_by:a.created_by,template_used:a.template||"standard",renewal_type:a.renewal_type||"manual",cancellation_fee_percent:a.cancellation_fee_percent||30,cancellation_notice_days:a.cancellation_notice_days||30};if(!r.end_date&&r.start_date){let e=new Date(r.start_date);e.setMonth(e.getMonth()+(r.duration_months||6)),r.end_date=e.toISOString()}let{data:o,error:n}=await c.O.from("contracts").insert(r).select().single();if(n)return i.NextResponse.json({success:!1,error:"Erro ao criar contrato"},{status:500});return i.NextResponse.json({success:!0,contract:o})}catch(e){return console.error("Erro na API de contratos:",e),i.NextResponse.json({success:!1,error:"Erro ao processar requisi\xe7\xe3o"},{status:500})}}async function _(e){try{let{id:t,action:a,...r}=await e.json();if(!t)return i.NextResponse.json({success:!1,error:"ID do contrato \xe9 obrigat\xf3rio"},{status:400});if("sign"===a){if(!await p.signContract(t,{signed_by:r.signed_by,signature_ip:r.signature_ip,signature_hash:r.signature_hash}))return i.NextResponse.json({success:!1,error:"Erro ao assinar contrato"},{status:500});return i.NextResponse.json({success:!0,message:"Contrato assinado com sucesso"})}if("cancel"===a){let{data:e}=await c.O.from("contracts").select("*").eq("id",t).single();if(e){let a=p.calculateCancellationFee(e);await c.O.from("contracts").update({status:"cancelled",cancelled_at:new Date().toISOString(),cancellation_fee:a.fee_value,cancellation_reason:r.reason}).eq("id",t)}return i.NextResponse.json({success:!0,message:"Contrato cancelado"})}if("activate"===a)return await c.O.from("contracts").update({status:"active"}).eq("id",t),i.NextResponse.json({success:!0,message:"Contrato ativado"});let{error:o}=await c.O.from("contracts").update(r).eq("id",t);if(o)return i.NextResponse.json({success:!1,error:"Erro ao atualizar contrato"},{status:500});return i.NextResponse.json({success:!0,message:"Contrato atualizado"})}catch(e){return console.error("Erro ao atualizar contrato:",e),i.NextResponse.json({success:!1,error:"Erro ao atualizar contrato"},{status:500})}}let x=new o.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/contracts/route",pathname:"/api/contracts",filename:"route",bundlePath:"app/api/contracts/route"},resolvedPagePath:"C:\\Users\\User\\Downloads\\valle-360-main\\valle-360-main\\src\\app\\api\\contracts\\route.ts",nextConfigOutput:"standalone",userland:r}),{requestAsyncStorage:f,staticGenerationAsyncStorage:A,serverHooks:O}=x,v="/api/contracts/route";function T(){return(0,s.patchFetch)({serverHooks:O,staticGenerationAsyncStorage:A})}},1926:(e,t,a)=>{a.d(t,{O:()=>s});var r=a(54128);let o="https://ikjgsqtykkhqimypacro.supabase.co",n="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlramdzcXR5a2tocWlteXBhY3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTE4OTksImV4cCI6MjA3ODc4Nzg5OX0.vgVCpFIt-5ajFhcXg65dqrEw915pqW8fGZ8xgJxrnxI";o&&n||console.error("❌ ERRO CR\xcdTICO: Vari\xe1veis de ambiente NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY n\xe3o encontradas!");let s=(0,r.eI)(o||"https://setup-missing.supabase.co",n||"setup-missing",{auth:{persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}})}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[89276,55972,54128],()=>a(23979));module.exports=r})();