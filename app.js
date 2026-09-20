/* =========================================================
   Fluxo — formulário de contato e detalhes da página
   ---------------------------------------------------------
   COMO O ENVIO FUNCIONA:
   Este site é estático (não tem servidor). Ao enviar, o formulário
   abre o app de e-mail do visitante com a mensagem já preenchida,
   endereçada ao e-mail definido em data-email no index.html.

   PARA RECEBER AS MENSAGENS DIRETO, sem depender do app de e-mail
   do visitante, troque o bloco "mailto" mais abaixo por um envio
   com fetch() para um serviço de formulários (Formspree, Getform,
   Web3Forms etc.) ou para o seu próprio servidor.
   ========================================================= */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  /* ---------- Ano do rodapé ---------- */
  var ano = $('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Formulário de contato ---------- */
  var form = $('form-contato');
  if (!form) return;

  var status = $('status');

  var regras = {
    nome: {
      el: $('nome'),
      erro: $('erro-nome'),
      msg: 'Diga seu nome.',
      ok: function (v) { return v.trim().length >= 2; }
    },
    email: {
      el: $('email'),
      erro: $('erro-email'),
      msg: 'Digite um e-mail válido, como nome@exemplo.com.',
      ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
    },
    mensagem: {
      el: $('mensagem'),
      erro: $('erro-mensagem'),
      msg: 'Escreva pelo menos 10 caracteres.',
      ok: function (v) { return v.trim().length >= 10; }
    }
  };

  function mostrarErro(campo, mostrar) {
    var r = regras[campo];
    if (mostrar) {
      r.erro.textContent = r.msg;
      r.erro.hidden = false;
      r.el.setAttribute('aria-invalid', 'true');
      r.el.setAttribute('aria-describedby', r.erro.id);
    } else {
      r.erro.hidden = true;
      r.el.removeAttribute('aria-invalid');
      r.el.removeAttribute('aria-describedby');
    }
  }

  // Valida tudo e devolve o primeiro campo com problema (ou null)
  function validar() {
    var primeiro = null;
    Object.keys(regras).forEach(function (campo) {
      var invalido = !regras[campo].ok(regras[campo].el.value);
      mostrarErro(campo, invalido);
      if (invalido && !primeiro) primeiro = regras[campo].el;
    });
    return primeiro;
  }

  // Some com o erro assim que o campo passa a ser válido
  Object.keys(regras).forEach(function (campo) {
    regras[campo].el.addEventListener('input', function () {
      if (!regras[campo].erro.hidden && regras[campo].ok(regras[campo].el.value)) {
        mostrarErro(campo, false);
      }
    });
  });

  function dizer(texto, tipo) {
    status.textContent = texto;
    status.className = 'status' + (tipo ? ' status-' + tipo : '');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    var invalido = validar();
    if (invalido) {
      dizer('Corrija os campos destacados e envie de novo.', 'erro');
      invalido.focus();
      return;
    }

    var destino = form.dataset.email;
    var nome = regras.nome.el.value.trim();
    var email = regras.email.el.value.trim();
    var assunto = $('assunto').value;
    var mensagem = regras.mensagem.el.value.trim();

    /* ---- Envio por "mailto" (abre o app de e-mail do visitante) ---- */
    var titulo = '[Fluxo] ' + assunto + ' - ' + nome;
    var corpo = mensagem + '\n\n' + nome + '\n' + email;
    window.location.href = 'mailto:' + destino +
      '?subject=' + encodeURIComponent(titulo) +
      '&body=' + encodeURIComponent(corpo);

    dizer('Abrimos o seu app de e-mail com a mensagem pronta. Se nada abriu, escreva direto para ' + destino + '.', 'ok');
  });
})();
