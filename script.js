/* ==========================================================
   Paróquia Nova Jerusalém — interatividade
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initLiveStatus();
  initSermonLightbox();
  setFooterYear();
});



/* ---------- Menu mobile ---------- */

function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Fecha o menu ao clicar num link (mobile)
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Estado "ao vivo" ----------
   Horário dos cultos: Domingo 09h00-11h00, Quarta 18h30-19h30,
   Sexta 19h00-20h30 (hora local do visitante).
   Ajuste os horários abaixo conforme a agenda real da paróquia. */
  const SERVICE_SCHEDULE = [
  { day: 0, startHour: 9, startMin: 0, endHour: 11, endMin: 0, label: 'Culto de Domingo' },
  { day: 3, startHour: 18, startMin: 30, endHour: 19, endMin: 30, label: 'Culto de Oração' },
  { day: 5, startHour: 19, startMin: 0, endHour: 20, endMin: 30, label: 'Encontro de Jovens' },
];

/* ---------- Configuração da transmissão ao vivo ----------
   Preencha UM dos dois métodos abaixo (o que a paróquia usar):

   1) YouTube — mais simples, funciona mesmo sem saber o ID do vídeo:
      troque pelo ID do canal (começa por "UC..."). Encontra-se em
      YouTube Studio → Personalização → Informações básicas → ID do canal.
        const YOUTUBE_CHANNEL_ID = 'UCxxxxxxxxxxxxxxxxxxxxxx';

   2) Facebook Live — cole o link da página/vídeo de transmissão:
        const FACEBOOK_VIDEO_URL = 'https://www.facebook.com/suapagina/videos/xxxxxxxx';

   Deixe o outro como string vazia ''. */
const YOUTUBE_CHANNEL_ID = '';
const FACEBOOK_VIDEO_URL = '';

function buildLiveEmbedHTML() {
  if (YOUTUBE_CHANNEL_ID) {
    return `<iframe
      src="https://www.youtube.com/embed/live_stream?channel=${YOUTUBE_CHANNEL_ID}&autoplay=1"
      title="Transmissão ao vivo"
      style="width:100%;height:100%;border:0;border-radius:10px;"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen></iframe>`;
  }
  if (FACEBOOK_VIDEO_URL) {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(FACEBOOK_VIDEO_URL)}&show_text=0&autoplay=1`;
    return `<iframe
      src="${src}"
      title="Transmissão ao vivo"
      style="width:100%;height:100%;border:0;border-radius:10px;"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen></iframe>`;
  }
  return null; // nenhum dos dois configurado ainda
}

function initLiveStatus() {
  const badge = document.getElementById('liveBadge');
  const badgeText = document.getElementById('liveBadgeText');
  const playerFrame = document.getElementById('playerFrame');
  if (!badge || !badgeText) return;

  const now = new Date();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();

  const liveService = SERVICE_SCHEDULE.find((s) => {
    if (s.day !== today) return false;
    const start = s.startHour * 60 + s.startMin;
    const end = s.endHour * 60 + s.endMin;
    return minutesNow >= start && minutesNow <= end;
  });

  if (liveService) {
    badge.classList.add('is-live');
    badgeText.textContent = `Ao vivo agora — ${liveService.label}`;

    if (playerFrame) {
      const embed = buildLiveEmbedHTML();
      if (embed) {
        playerFrame.innerHTML = embed;
      } else {
        // Sem YOUTUBE_CHANNEL_ID nem FACEBOOK_VIDEO_URL configurados ainda
        const msg = playerFrame.querySelector('#playerMessage');
        if (msg) msg.textContent = `${liveService.label} em transmissão — configure o canal em js/script.js para o vídeo aparecer aqui.`;
      }
    }
  } else {
    const next = getNextService();
    badgeText.textContent = next
      ? `Próxima transmissão: ${next.label} · ${next.when}`
      : 'Consulte os horários de culto abaixo';
  }
}

function getNextService() {
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const now = new Date();
  const today = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  // Ordena por distância até ao próximo horário, incluindo os que já passaram hoje (semana seguinte)
  let best = null;
  let bestDelta = Infinity;

  SERVICE_SCHEDULE.forEach((s) => {
    const start = s.startHour * 60 + s.startMin;
    let dayDelta = (s.day - today + 7) % 7;
    if (dayDelta === 0 && start <= minutesNow) dayDelta = 7; // já passou hoje
    const totalDelta = dayDelta * 1440 + start;
    if (totalDelta < bestDelta) {
      bestDelta = totalDelta;
      best = s;
    }
  });

  if (!best) return null;
  const hh = String(best.startHour).padStart(2, '0');
  const mm = String(best.startMin).padStart(2, '0');
  return { label: best.label, when: `${dayNames[best.day]}, ${hh}h${mm}` };
}

/* ---------- Lightbox de sermões ---------- */
function initSermonLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightboxClose');
  const body = document.getElementById('lightboxBody');
  const cards = document.querySelectorAll('.sermon-card');
  if (!lightbox || !body) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const title = card.querySelector('.sermon-title')?.textContent || 'Sermão';
      const videoUrl = card.dataset.video;

      if (videoUrl) {
        body.innerHTML = `<iframe src="${videoUrl}" style="width:100%;height:100%;border:0;border-radius:10px;" allowfullscreen></iframe>`;
      } else {
        // Placeholder até cada sermão ter um link de vídeo real (YouTube/Vimeo)
        body.innerHTML = `<p>Vídeo de "${title}" em breve. Adicione o link em <code>data-video</code> no HTML.</p>`;
      }
      lightbox.classList.add('open');
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    body.innerHTML = '';
  }

  closeBtn?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

/* ---------- Ano no rodapé ---------- */
function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

