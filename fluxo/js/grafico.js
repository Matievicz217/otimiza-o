/* =========================================================
   Fluxo — gráfico de demonstração
   Simula o tempo de cada quadro (em ms). Sem o Fluxo, aparecem picos
   frequentes; com o Fluxo, a linha fica baixa e estável.
   Os números do painel são calculados a partir da linha desenhada.
   Tudo aqui é ilustrativo: dados simulados, não medições reais.
   ========================================================= */
(function () {
  'use strict';

  var canvas = document.getElementById('grafico');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var btn = document.getElementById('alternar');
  var estado = document.getElementById('estado');
  var nFps = document.getElementById('n-fps');
  var nLow = document.getElementById('n-low');
  var nMax = document.getElementById('n-max');
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Parâmetros ---------- */
  var TICK = 50;        // ms entre uma amostra e outra
  var JANELA = 90;      // quantas amostras aparecem no gráfico
  var MS_MAX = 44;      // topo do eixo, em ms
  var ALVO = 16.7;      // 60 FPS

  /* ---------- Cores (lidas do CSS) ---------- */
  var css = getComputedStyle(document.documentElement);
  function cor(nome) { return css.getPropertyValue(nome).trim(); }
  var COR = {
    tinta: cor('--tinta'),
    suave: cor('--tinta-suave'),
    ultra: cor('--ultra'),
    menta: cor('--menta'),
    coral: cor('--coral')
  };

  function hexParaRgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function misturar(a, b, t) {
    var A = hexParaRgb(a), B = hexParaRgb(b);
    var r = Math.round(A[0] + (B[0] - A[0]) * t);
    var g = Math.round(A[1] + (B[1] - A[1]) * t);
    var bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  /* ---------- Gerador de amostras ---------- */
  // k = 0: sem o Fluxo | k = 1: com o Fluxo | valores intermediários na transição
  var k = 0;
  var alvoK = 0;
  var fase = 0;
  var amostras = [];

  function gerar(kk) {
    fase += 1;
    var base = 17.5 - (17.5 - 12.2) * kk;
    var amp = 2.4 - (2.4 - 0.7) * kk;
    var pico = 0.085 - (0.085 - 0.008) * kk;
    var picoMin = 10 - (10 - 3) * kk;
    var picoMax = 24 - (24 - 7) * kk;

    var v = base + Math.sin(fase * 0.33) * amp * 0.6 + (Math.random() - 0.5) * amp * 1.4;
    if (Math.random() < pico) v += picoMin + Math.random() * (picoMax - picoMin);
    return Math.max(6, Math.min(MS_MAX - 1, v));
  }

  function preencher(kk) {
    amostras = [];
    for (var i = 0; i < JANELA + 1; i++) amostras.push(gerar(kk));
  }

  /* ---------- Números do painel ---------- */
  function atualizarNumeros() {
    var n = amostras.length, soma = 0, i;
    for (i = 0; i < n; i++) soma += amostras[i];
    var media = soma / n;

    var ordenadas = amostras.slice().sort(function (a, b) { return b - a; });
    var qtd = Math.max(3, Math.ceil(n * 0.05));
    var piores = 0;
    for (i = 0; i < qtd; i++) piores += ordenadas[i];
    piores /= qtd;

    nFps.textContent = Math.round(1000 / media) + ' FPS';
    nLow.textContent = Math.round(1000 / piores) + ' FPS';
    nMax.textContent = Math.round(ordenadas[0]) + ' ms';
  }

  /* ---------- Desenho ---------- */
  var W = 0, H = 0;

  function ajustarTamanho() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    W = Math.max(200, Math.round(r.width));
    H = Math.max(100, Math.round(r.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function yDe(ms) { return H - 8 - (ms / MS_MAX) * (H - 18); }

  function desenhar(frac) {
    var i, n = amostras.length;
    ctx.clearRect(0, 0, W, H);

    // Grade e rótulos do eixo
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(18,20,43,.1)';
    ctx.fillStyle = COR.suave;
    ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    for (var g = 10; g <= 40; g += 10) {
      var yg = Math.round(yDe(g)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, yg);
      ctx.lineTo(W, yg);
      ctx.stroke();
      ctx.fillText(g + ' ms', 8, yg - 3);
    }

    // Linha de 60 FPS
    var yAlvo = yDe(ALVO);
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = COR.tinta;
    ctx.beginPath();
    ctx.moveTo(0, yAlvo);
    ctx.lineTo(W, yAlvo);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COR.tinta;
    ctx.textAlign = 'right';
    ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText('60 FPS', W - 8, yAlvo - 4);

    // Linha do tempo de quadro: coral acima do alvo (travou), cor do estado abaixo
    var passo = W / (n - 2);
    function trilha() {
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        var x = (i - frac) * passo;
        var y = yDe(amostras[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    function tracar(x, y, w, h, corLinha) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      trilha();
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = corLinha;
      ctx.stroke();
      ctx.restore();
    }
    tracar(0, 0, W, yAlvo, COR.coral);
    tracar(0, yAlvo, W, H - yAlvo, misturar(COR.ultra, '#0aa67a', k));
  }

  /* ---------- Laço de animação ---------- */
  var raf = 0, ultimo = 0, acum = 0, statsAcum = 0, visivel = true;

  function laco(agora) {
    var dt = Math.min(200, agora - ultimo);
    ultimo = agora;

    if (visivel) {
      acum += dt;
      statsAcum += dt;
      while (acum >= TICK) {
        acum -= TICK;
        k += (alvoK - k) * 0.12;
        amostras.push(gerar(k));
        amostras.shift();
      }
      if (statsAcum >= 350) { statsAcum = 0; atualizarNumeros(); }
      desenhar(acum / TICK);
    }
    raf = requestAnimationFrame(laco);
  }

  function iniciar() { if (raf) return; ultimo = performance.now(); raf = requestAnimationFrame(laco); }
  function parar() { cancelAnimationFrame(raf); raf = 0; }

  // Sem animação: mostra um retrato do estado atual
  function retrato() {
    k = alvoK;
    preencher(k);
    desenhar(0);
    atualizarNumeros();
  }

  function aplicarMovimento() {
    if (reduceMQ.matches) { parar(); retrato(); } else { iniciar(); }
  }

  /* ---------- Botão ligar/desligar ---------- */
  btn.addEventListener('click', function () {
    var ligado = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', ligado ? 'true' : 'false');
    btn.textContent = ligado ? 'Desligar o Fluxo' : 'Ligar o Fluxo';
    estado.textContent = ligado ? 'Com o Fluxo' : 'Sem o Fluxo';
    estado.classList.toggle('estado-on', ligado);
    canvas.setAttribute('aria-label', ligado
      ? 'Gráfico do tempo de cada quadro em milissegundos. Com o Fluxo, a linha fica baixa e estável, quase sem picos.'
      : 'Gráfico do tempo de cada quadro em milissegundos. Sem o Fluxo, aparecem picos altos e frequentes.');
    alvoK = ligado ? 1 : 0;
    if (reduceMQ.matches) retrato();
  });

  /* ---------- Início ---------- */
  function onResize() {
    ajustarTamanho();
    if (reduceMQ.matches) desenhar(0);
  }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(canvas);
  else window.addEventListener('resize', onResize);

  // Economiza processamento quando o gráfico está fora da tela
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entradas) {
      visivel = entradas[0].isIntersecting;
    }).observe(canvas);
  }

  function onMotionChange() { aplicarMovimento(); }
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onMotionChange);
  else if (reduceMQ.addListener) reduceMQ.addListener(onMotionChange);

  ajustarTamanho();
  preencher(0);
  atualizarNumeros();
  desenhar(0);
  aplicarMovimento();
})();
