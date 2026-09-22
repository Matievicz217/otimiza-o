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
  var JANELA = 90;      // quantidade de amostras
  var MS_MAX = 44;      // topo do eixo
  var ALVO = 16.7;      // 60 FPS


  /* ---------- Cores ---------- */

  var LARANJA = '#ff6a00';
  var BRANCO = '#ffffff';

  var GRADE = 'rgba(255, 255, 255, 0.08)';
  var TEXTO = 'rgba(255, 255, 255, 0.55)';
  var LINHA_ALVO = 'rgba(255, 255, 255, 0.35)';


  /* ---------- Gerador de amostras ---------- */

  // k = 0: sem o Fluxo
  // k = 1: com o Fluxo

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


    var v =
      base +
      Math.sin(fase * 0.33) * amp * 0.6 +
      (Math.random() - 0.5) * amp * 1.4;


    if (Math.random() < pico) {
      v += picoMin + Math.random() * (picoMax - picoMin);
    }


    return Math.max(
      6,
      Math.min(MS_MAX - 1, v)
    );
  }


  function preencher(kk) {
    amostras = [];

    for (var i = 0; i < JANELA + 1; i++) {
      amostras.push(gerar(kk));
    }
  }


  /* ---------- Números do painel ---------- */

  function atualizarNumeros() {

    var n = amostras.length;
    var soma = 0;
    var i;


    for (i = 0; i < n; i++) {
      soma += amostras[i];
    }


    var media = soma / n;


    var ordenadas = amostras
      .slice()
      .sort(function (a, b) {
        return b - a;
      });


    var qtd = Math.max(
      3,
      Math.ceil(n * 0.05)
    );


    var piores = 0;


    for (i = 0; i < qtd; i++) {
      piores += ordenadas[i];
    }


    piores /= qtd;


    nFps.textContent =
      Math.round(1000 / media) + ' FPS';


    nLow.textContent =
      Math.round(1000 / piores) + ' FPS';


    nMax.textContent =
      Math.round(ordenadas[0]) + ' ms';
  }


  /* ---------- Tamanho do canvas ---------- */

  var W = 0;
  var H = 0;


  function ajustarTamanho() {

    var dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );


    var r = canvas.getBoundingClientRect();


    W = Math.max(
      200,
      Math.round(r.width)
    );


    H = Math.max(
      100,
      Math.round(r.height)
    );


    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);


    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );
  }


  function yDe(ms) {

    return H -
      8 -
      (ms / MS_MAX) *
      (H - 18);
  }


  /* ---------- Desenho ---------- */

  function desenhar(frac) {

    var i;
    var n = amostras.length;


    ctx.clearRect(
      0,
      0,
      W,
      H
    );


    /* =========================
       GRADE
    ========================= */

    ctx.lineWidth = 1;

    ctx.strokeStyle = GRADE;

    ctx.fillStyle = TEXTO;

    ctx.font =
      '500 10px "JetBrains Mono", ui-monospace, monospace';

    ctx.textAlign = 'left';

    ctx.textBaseline = 'bottom';


    for (var g = 10; g <= 40; g += 10) {

      var yg =
        Math.round(yDe(g)) + 0.5;


      ctx.beginPath();

      ctx.moveTo(
        0,
        yg
      );

      ctx.lineTo(
        W,
        yg
      );

      ctx.stroke();


      ctx.fillText(
        g + ' ms',
        8,
        yg - 3
      );
    }


    /* =========================
       LINHA DE 60 FPS
    ========================= */

    var yAlvo = yDe(ALVO);


    ctx.save();


    ctx.setLineDash([
      6,
      5
    ]);


    ctx.lineWidth = 1.2;

    ctx.strokeStyle = LINHA_ALVO;


    ctx.beginPath();

    ctx.moveTo(
      0,
      yAlvo
    );

    ctx.lineTo(
      W,
      yAlvo
    );

    ctx.stroke();


    ctx.restore();


    ctx.fillStyle =
      'rgba(255,255,255,0.7)';


    ctx.textAlign = 'right';


    ctx.font =
      '700 10px "JetBrains Mono", ui-monospace, monospace';


    ctx.fillText(
      '60 FPS',
      W - 8,
      yAlvo - 4
    );


    /* =========================
       LINHA DO GRÁFICO
    ========================= */

    var passo =
      W / (n - 2);


    function trilha() {

      ctx.beginPath();


      for (i = 0; i < n; i++) {

        var x =
          (i - frac) * passo;


        var y =
          yDe(amostras[i]);


        if (i === 0) {

          ctx.moveTo(
            x,
            y
          );

        } else {

          ctx.lineTo(
            x,
            y
          );
        }
      }
    }


    /* =========================
       DESENHAR LINHA
    ========================= */

    function tracar(
      x,
      y,
      w,
      h,
      corLinha,
      intensidadeGlow
    ) {

      ctx.save();


      ctx.beginPath();

      ctx.rect(
        x,
        y,
        w,
        h
      );

      ctx.clip();


      trilha();


      ctx.lineWidth = 3;

      ctx.lineJoin = 'round';

      ctx.lineCap = 'round';


      ctx.strokeStyle =
        corLinha;


      ctx.shadowBlur =
        intensidadeGlow;


      ctx.shadowColor =
        corLinha;


      ctx.stroke();


      ctx.restore();
    }


    /* =========================
       LINHA LARANJA
    ========================= */

    tracar(
      0,
      0,
      W,
      yAlvo,
      LARANJA,
      8
    );


    /* =========================
       LINHA BRANCA
    ========================= */

    tracar(
      0,
      yAlvo,
      W,
      H - yAlvo,
      BRANCO,
      5
    );
  }


  /* ---------- Animação ---------- */

  var raf = 0;
  var ultimo = 0;
  var acum = 0;
  var statsAcum = 0;
  var visivel = true;


  function laco(agora) {

    var dt =
      Math.min(
        200,
        agora - ultimo
      );


    ultimo = agora;


    if (visivel) {

      acum += dt;

      statsAcum += dt;


      while (acum >= TICK) {

        acum -= TICK;


        k +=
          (alvoK - k) * 0.12;


        amostras.push(
          gerar(k)
        );


        amostras.shift();
      }


      if (statsAcum >= 350) {

        statsAcum = 0;

        atualizarNumeros();
      }


      desenhar(
        acum / TICK
      );
    }


    raf =
      requestAnimationFrame(laco);
  }


  function iniciar() {

    if (raf) return;


    ultimo =
      performance.now();


    raf =
      requestAnimationFrame(laco);
  }


  function parar() {

    cancelAnimationFrame(raf);

    raf = 0;
  }


  /* ---------- Retrato sem animação ---------- */

  function retrato() {

    k = alvoK;


    preencher(k);


    desenhar(0);


    atualizarNumeros();
  }


  function aplicarMovimento() {

    if (reduceMQ.matches) {

      parar();

      retrato();

    } else {

      iniciar();
    }
  }


  /* ---------- Botão ligar/desligar ---------- */

  btn.addEventListener(
    'click',
    function () {

      var ligado =
        btn.getAttribute(
          'aria-pressed'
        ) !== 'true';


      btn.setAttribute(
        'aria-pressed',
        ligado
          ? 'true'
          : 'false'
      );


      btn.textContent =
        ligado
          ? 'Desligar o Fluxo'
          : 'Ligar o Fluxo';


      estado.textContent =
        ligado
          ? 'Com o Fluxo'
          : 'Sem o Fluxo';


      estado.classList.toggle(
        'estado-on',
        ligado
      );


      canvas.setAttribute(
        'aria-label',

        ligado

          ? 'Gráfico do tempo de cada quadro em milissegundos. Com o Fluxo, a linha fica baixa e estável, quase sem picos.'

          : 'Gráfico do tempo de cada quadro em milissegundos. Sem o Fluxo, aparecem picos altos e frequentes.'
      );


      alvoK =
        ligado
          ? 1
          : 0;


      if (reduceMQ.matches) {
        retrato();
      }
    }
  );


  /* ---------- Resize ---------- */

  function onResize() {

    ajustarTamanho();


    if (reduceMQ.matches) {
      desenhar(0);
    }
  }


  if (window.ResizeObserver) {

    new ResizeObserver(
      onResize
    ).observe(canvas);

  } else {

    window.addEventListener(
      'resize',
      onResize
    );
  }


  /* ---------- Intersection Observer ---------- */

  if (window.IntersectionObserver) {

    new IntersectionObserver(
      function (entradas) {

        visivel =
          entradas[0].isIntersecting;

      }
    ).observe(canvas);
  }


  /* ---------- Reduced Motion ---------- */

  function onMotionChange() {

    aplicarMovimento();
  }


  if (reduceMQ.addEventListener) {

    reduceMQ.addEventListener(
      'change',
      onMotionChange
    );

  } else if (reduceMQ.addListener) {

    reduceMQ.addListener(
      onMotionChange
    );
  }


  /* ---------- Inicialização ---------- */

  ajustarTamanho();

  preencher(0);

  atualizarNumeros();

  desenhar(0);

  aplicarMovimento();

})();