// Template e-mail de connexion ALTImates — HTML "email-safe" (tables + styles
// inline) pour un rendu correct sur Gmail/Outlook/Apple Mail. Pas de SVG ni de
// flex/grid (ignorés par les clients mail). Fichier privé (préfixe _), non routé.

export const SIGNIN_SUBJECT = '🏔️ Ton lien pour rejoindre la cordée ALTImates'

export function renderSignInEmail(link: string, email: string): string {
  const safeLink = escapeHtml(link)
  const safeEmail = escapeHtml(email)
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Connexion ALTImates</title>
</head>
<body style="margin:0;padding:0;background:#efe9db;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Un clic et tu rejoins la cordée — sans mot de passe.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe9db;">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#fbf8f0;border:1px solid #e4dccb;border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">

          <!-- HEADER BAND -->
          <tr>
            <td style="background:#23221e;padding:30px 40px 26px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                      <td style="width:40px;height:40px;background:#000;border-radius:10px;text-align:center;vertical-align:middle;font-size:20px;">⛰️</td>
                      <td style="padding-left:12px;font-size:24px;font-weight:800;color:#fbf8f0;letter-spacing:.5px;">ALTI<span style="color:#e6c356;font-style:italic;font-weight:700;">mates</span></td>
                    </tr></table>
                  </td>
                  <td align="right" style="vertical-align:top;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;color:rgba(230,195,86,.6);">2&nbsp;500&nbsp;M</td>
                </tr>
              </table>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;color:rgba(251,248,240,.45);margin-top:10px;text-transform:uppercase;">Plan&nbsp;·&nbsp;Gear&nbsp;up&nbsp;·&nbsp;Summit&nbsp;together</div>
            </td>
          </tr>
          <!-- gold ridge separator -->
          <tr><td style="height:4px;background:#e6c356;line-height:4px;font-size:0;">&nbsp;</td></tr>

          <!-- BODY -->
          <tr>
            <td style="padding:34px 40px 6px;">
              <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#c9a12f;margin-bottom:12px;">Ton sésame pour la cordée</div>
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;font-weight:800;color:#2b2a26;">Prêt·e à t'encorder&nbsp;?</h1>
              <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:#57544b;">
                Ton lien de connexion est arrivé au camp de base. Un seul clic et tu rejoins la cordée — aucun mot de passe à retenir, juste l'essentiel pour préparer la prochaine sortie.
              </p>

              <!-- bulletproof button -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" bgcolor="#c9a12f" style="border-radius:12px;">
                    <a href="${safeLink}" target="_blank"
                       style="display:inline-block;padding:15px 30px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:800;color:#23221e;text-decoration:none;border-radius:12px;">
                      ⛰&nbsp;&nbsp;Me connecter à ALTImates
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 4px;font-family:'Courier New',monospace;font-size:11px;line-height:1.6;color:#8a8578;">
                Lien valable une seule fois, et pour un temps limité.<br>
                Demandé pour <span style="color:#2b2a26;">${safeEmail}</span>.
              </p>

              <hr style="border:none;border-top:1px dashed #e4dccb;margin:28px 0;">

              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a8578;margin-bottom:14px;">Au sommet t'attendent</div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size:13px;color:#2b2a26;padding:4px 0;">⛰️&nbsp; <b>Proposer une rando</b> <span style="color:#8a8578;">— la prochaine, c'est toi</span></td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#2b2a26;padding:4px 0;">✅&nbsp; <b>Voter les sorties</b> <span style="color:#8a8578;">— partant ou peut-être</span></td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#2b2a26;padding:4px 0;">☀️&nbsp; <b>Météo &amp; kit</b> <span style="color:#8a8578;">— prêt pour le sommet</span></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:22px 40px 32px;">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:10.5px;line-height:1.7;color:#8a8578;">
                Tu n'as rien demandé&nbsp;? Ignore ce message — personne ne peut se connecter sans ce lien.
              </p>
              <p style="margin:12px 0 0;font-family:'Courier New',monospace;font-size:11px;color:#2b2a26;">Belle grimpe,<br><span style="color:#c9a12f;">La cordée ALTImates</span> 🧗</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
