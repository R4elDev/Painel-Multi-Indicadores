/** Aceita somente endereços HTTP(S); vazio representa bloco ainda não configurado. */
export function normalizeUrl(input: string): string {
  const value = input.trim()
  if (!value) return ''
  const hostPort = /^(localhost|127\.0\.0\.1|(?:[a-z\d-]+\.)+[a-z\d-]+):\d+(?=[/?#]|$)/i.test(value)
  const localHost = /^(localhost|127\.0\.0\.1)(?=[:/?#]|$)/i.test(value)
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value)
  const candidate = hasScheme && !hostPort ? value : `${localHost ? 'http' : 'https'}://${value}`
  const url = new URL(candidate)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use uma URL http:// ou https:// válida.')
  return url.href
}
export const normalizeRefresh = (value: number): number =>
  Number.isFinite(value) && value > 0 ? Math.min(1440, Math.max(1, value)) : 0
export const GENERIC_EMBED_HINT = 'Use um link de incorporação HTTP(S). CSP, X-Frame-Options ou login podem impedir o iframe; uma página vazia não confirma a causa.'
export type EmbedService = 'Power BI' | 'Google Sheets' | 'Google Slides' | 'Looker Studio' | 'Google Drive' | 'Excel / SharePoint' | 'Grafana' | 'Metabase' | 'Tableau';
export type EmbedHint = { service: EmbedService; message: string };
const domain = (host: string, suffix: string) => host === suffix || host.endsWith(`.${suffix}`);
/** Detection is advisory: custom Grafana/Metabase hosts need recognizable paths. */
export function getEmbedHint(value: string): EmbedHint | null {
  let u: URL;
  try { u = new URL(value.trim()); } catch { return null; }
  if (!['https:', 'http:'].includes(u.protocol)) return null;
  const h = u.hostname.toLowerCase(), p = u.pathname.toLowerCase();
  if (domain(h, 'powerbi.com')) return { service: 'Power BI', message: 'Para uso corporativo, use https://app.powerbi.com/reportEmbed?reportId=...&autoAuth=true. Exige login Microsoft, acesso e licença Pro ou PPU por visualizador (salvo capacidade compatível), além de pop-ups de login; o painel deve usar HTTPS e não enviar COOP: same-origin. Publicar na web torna os dados públicos: não use para dados sensíveis.' };
  if (h === 'docs.google.com' && p.startsWith('/spreadsheets/')) return { service: 'Google Sheets', message: 'Use Arquivo → Compartilhar → Publicar na web → Incorporar (pubhtml). Compartilhar o arquivo não é o mesmo que publicar. A publicação expõe os dados ao público permitido; não publique dados sensíveis.' };
  if (h === 'docs.google.com' && p.startsWith('/presentation/')) return { service: 'Google Slides', message: 'Use Arquivo → Compartilhar → Publicar na web → Incorporar. A publicação é pública; confirme o acesso em aba anônima. O administrador pode bloquear a publicação.' };
  if (domain(h, 'lookerstudio.google.com') || h === 'datastudio.google.com') return { service: 'Looker Studio', message: 'Ative Arquivo → Incorporar relatório e copie o link de embed. Relatórios restritos exigem conta Google com acesso; públicos expõem os dados. Marca e botão de tela cheia são obrigatórios.' };
  if (h === 'drive.google.com') return { service: 'Google Drive', message: 'Tente /file/d/ID/preview. Para acesso anônimo, o arquivo precisa permitir qualquer pessoa com o link. Esse formato tem compatibilidade não confirmada oficialmente; arquivos restritos podem falhar por login ou bloqueio de iframe.' };
  if (domain(h, 'sharepoint.com') || domain(h, 'onedrive.live.com') || h === '1drv.ms' || domain(h, 'office.com') || domain(h, 'officeapps.live.com') || domain(h, 'excel.cloud.microsoft')) return { service: 'Excel / SharePoint', message: 'Use o link de incorporação gerado pelo Excel com action=embedview e wdAllowInteractivity=True. Acesso anônimo depende do administrador e pode expor o arquivo. Login/CSP podem impedir o iframe; a versão incorporada não permite editar.' };
  if (domain(h, 'grafana.net') || /(^|[.-])grafana([.-]|$)/.test(h) || p.startsWith('/d-solo/')) return { service: 'Grafana', message: 'A instância precisa permitir allow_embedding=true (desligado por padrão). Login e cookies podem impedir o iframe. Acesso anônimo expõe os dados; confirme /d-solo e a configuração na instância real. Grafana Cloud pode restringir incorporação.' };
  if (/(^|[.-])metabase([.-]|$)/.test(h) || /^\/(public|embed)\/(dashboard|question)\//.test(p)) return { service: 'Metabase', message: 'Copie Compartilhar → Incorporar → código de incorporação. Links /public/dashboard são públicos e seus filtros podem ser removidos. Para restringir acesso, use embedding assinado; o MVP não gera tokens.' };
  if (domain(h, 'tableau.com') || domain(h, 'tableauusercontent.com')) return { service: 'Tableau', message: 'Use Share → Embed Code e valide o formato: versões atuais podem gerar um web component, não um iframe simples. Tableau Public expõe todos os dados sem controle de acesso; valide a URL no serviço.' };
  return null;
}

export function embedHint(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' && globalThis.location?.protocol === 'https:') return 'Este endereço HTTP pode ser bloqueado nesta página HTTPS. Use HTTPS.'
    const hint = getEmbedHint(value)
    if (hint) return `${hint.service}: ${hint.message}`
    if (/(^|\.)youtube\.com$/.test(url.hostname) || url.hostname === 'youtu.be') return 'YouTube: use https://www.youtube.com/embed/ID_DO_VIDEO.'
  } catch { return null }
  return null
}
