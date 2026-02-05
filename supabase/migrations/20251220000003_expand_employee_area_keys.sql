-- Expandir mapeamento de texto → area_key para RLS por área (Kanban)
-- Isso alimenta `employee_area_keys()` usado nas políticas de kanban_*.

CREATE OR REPLACE FUNCTION public._map_area_text_to_area_key(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
declare
  s text;
begin
  s := public._normalize_text(input);

  -- Financeiro (prioridade para desambiguar pagar/receber)
  if s like '%financeiro%pagar%' or (s like '%financeiro%' and s like '%pagar%') or s like '%contas%pagar%' then
    return 'financeiro_pagar';
  end if;

  if s like '%financeiro%receber%' or (s like '%financeiro%' and s like '%receber%') or s like '%contas%receber%' then
    return 'financeiro_receber';
  end if;

  -- Marketing / Head
  if (s like '%head%' and s like '%marketing%') or s like '%marketing%' or s like '%estrateg%' or s like '%coorden%' then
    return 'head_marketing';
  end if;

  -- Social
  if s like '%social%' then
    return 'social_media';
  end if;

  -- Tráfego / Performance
  if s like '%trafego%' or s like '%performance%' or s like '%ads%' then
    return 'trafego_pago';
  end if;

  -- Vídeo
  if s like '%video%' or s like '%editor%' then
    return 'video_maker';
  end if;

  -- Web
  if s like '%web%' then
    return 'webdesigner';
  end if;

  -- Copy
  if s like '%copy%' or s like '%redacao%' or s like '%redator%' then
    return 'copywriting';
  end if;

  -- Design (depois de web para não capturar webdesign)
  if s like '%designer%' or s like '%design%' then
    return 'designer_grafico';
  end if;

  -- Backoffice / Hub
  if s like '%juridico%' then
    return 'juridico';
  end if;

  if s like '%contrat%' then
    return 'contratos';
  end if;

  if s like '%operac%' then
    return 'operacao';
  end if;

  if s like '%notific%' then
    return 'notificacoes';
  end if;

  -- Comercial
  if s like '%comercial%' or s like '%vendas%' then
    return 'comercial';
  end if;

  -- RH
  if s = 'rh' or s like '%recursos%humanos%' or s like '%people%' or s like '%pessoas%' then
    return 'rh';
  end if;

  return null;
end;
$function$;


