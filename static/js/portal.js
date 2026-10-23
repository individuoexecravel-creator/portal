/* Portal: menu, busca, filtros, sumário, progresso, compartilhar e voltar ao topo. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var esc = function (t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- Menu do celular ---------- */
  var botaoMenu = $('[data-menu]'), menu = $('#menu-movel');
  function fecharMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; botaoMenu.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-aberto');
  }
  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', function () {
      var abrir = menu.hidden;
      menu.hidden = !abrir; botaoMenu.setAttribute('aria-expanded', String(abrir));
      document.documentElement.classList.toggle('menu-aberto', abrir);
      if (abrir) { var a = $('a', menu); if (a) a.focus(); }
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', fecharMenu); });
    window.addEventListener('resize', function () { if (innerWidth > 860) fecharMenu(); });
  }

  /* ---------- Busca ---------- */
  var dlg = $('#busca'), q = $('#busca-q'), lista = $('#busca-res'), dica = $('#busca-dica'), indice = null;
  function carregar() {
    if (indice) return Promise.resolve(indice);
    return fetch(dlg.dataset.indice).then(function (r) { return r.json(); }).then(function (d) {
      indice = d.map(function (x) { x.n = norm([x.t, x.s, x.d, x.f, x.per, x.sec].join(' ')); x.nt = norm(x.t); return x; });
      return indice;
    }).catch(function () { indice = []; return indice; });
  }
  function buscar() {
    var termos = norm(q.value).trim().split(/\s+/).filter(Boolean);
    if (!termos.length) { lista.innerHTML = ''; dica.hidden = false; return; }
    carregar().then(function (d) {
      var r = d.map(function (x) {
        var p = 0;
        for (var i = 0; i < termos.length; i++) {
          if (x.n.indexOf(termos[i]) < 0) return null;
          p += x.nt.indexOf(termos[i]) >= 0 ? 3 : 1;
        }
        return { x: x, p: p };
      }).filter(Boolean).sort(function (a, b) { return b.p - a.p; }).slice(0, 8);
      dica.hidden = true;
      lista.innerHTML = r.length ? r.map(function (o) {
        var x = o.x;
        return '<li><a href="' + esc(x.u) + '" class="sec-' + esc(x.k) + '">' +
          (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : '<span class="res-sem"></span>') +
          '<span class="res-txt"><span class="res-sec">' + esc(x.sec) + (x.per ? ' · ' + esc(x.per) : '') + '</span>' +
          '<span class="res-t">' + esc(x.t) + '</span>' +
          (x.s ? '<span class="res-s">' + esc(x.s) + '</span>' : '') + '</span></a></li>';
      }).join('') : '<li class="res-nada">Nada encontrado para “' + esc(q.value) + '”. Tente outro nome ou um ano.</li>';
    });
  }
  function abrirBusca() {
    if (!dlg) return;
    fecharMenu();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    document.documentElement.classList.add('busca-aberta');
    carregar(); q.focus(); q.select();
  }
  if (dlg) {
    $$('[data-abrir-busca]').forEach(function (b) { b.addEventListener('click', abrirBusca); });
    q.addEventListener('input', buscar);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var a = $('a', lista); if (a) { e.preventDefault(); location.href = a.href; } }
      if (e.key === 'ArrowDown') { var b = $('a', lista); if (b) { e.preventDefault(); b.focus(); } }
    });
    lista.addEventListener('keydown', function (e) {
      var links = $$('a', lista), i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? links[i - 1] : q).focus(); }
    });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('busca-aberta'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target, digitando = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === '/' && !digitando && !e.ctrlKey && !e.metaKey) { e.preventDefault(); abrirBusca(); }
    if (e.key === 'Escape') fecharMenu();
  });

  /* ---------- Trilhos da página inicial ---------- */
  $$('.trilho-bloco').forEach(function (b) {
    var t = $('.trilho', b);
    $$('.seta', b).forEach(function (btn) {
      btn.addEventListener('click', function () {
        t.scrollBy({ left: Number(btn.dataset.dir) * t.clientWidth * 0.8, behavior: 'smooth' });
      });
    });
  });

  /* ---------- Explorador de casos ---------- */
  $$('[data-explorador]').forEach(function (ex) {
    var grade = $('[data-f-grade]', ex), cards = $$('.card', grade), campo = $('[data-f-q]', ex),
      ordem = $('[data-f-ordem]', ex), conta = $('[data-f-conta]', ex), vazio = $('[data-f-vazio]', ex);
    cards.forEach(function (c, i) { c._b = norm(c.dataset.busca); c._i = i; });
    var est = { q: '', sec: '', dec: '', ordem: 'pub' };
    var u = new URLSearchParams(location.search);
    ['q', 'sec', 'dec', 'ordem'].forEach(function (k) { if (u.get(k)) est[k] = u.get(k); });

    function marcar(attr, val) {
      $$('[' + attr + ']', ex).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); });
    }
    function aplicar(salvar) {
      var termos = norm(est.q).trim().split(/\s+/).filter(Boolean), n = 0;
      cards.forEach(function (c) {
        var ano = +c.dataset.ano, ok = (!est.sec || c.dataset.sec === est.sec) &&
          (!est.dec || (ano >= +est.dec && ano < +est.dec + 10)) &&
          termos.every(function (t) { return c._b.indexOf(t) >= 0; });
        c.hidden = !ok; if (ok) n++;
      });
      var ord = cards.slice().sort(function (a, b) {
        if (est.ordem === 'ano') return a.dataset.ano - b.dataset.ano || a._i - b._i;
        if (est.ordem === 'ano-desc') return b.dataset.ano - a.dataset.ano || a._i - b._i;
        if (est.ordem === 'az') return a.dataset.nome.localeCompare(b.dataset.nome, 'pt');
        return b.dataset.pub - a.dataset.pub || a._i - b._i;
      });
      ord.forEach(function (c) { grade.appendChild(c); });
      conta.textContent = n === cards.length ? n + ' casos' : n + (n === 1 ? ' caso encontrado' : ' casos encontrados') + ' de ' + cards.length;
      vazio.hidden = n > 0; grade.hidden = n === 0;
      marcar('data-f-sec', est.sec); marcar('data-f-dec', est.dec);
      if (salvar) {
        var p = new URLSearchParams();
        if (est.q) p.set('q', est.q); if (est.sec) p.set('sec', est.sec); if (est.dec) p.set('dec', est.dec);
        if (est.ordem !== 'pub') p.set('ordem', est.ordem);
        history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
      }
    }
    campo.value = est.q; ordem.value = est.ordem;
    var tm; campo.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { est.q = campo.value; aplicar(true); }, 120); });
    ordem.addEventListener('change', function () { est.ordem = ordem.value; aplicar(true); });
    $$('[data-f-sec]', ex).forEach(function (b) { b.addEventListener('click', function () { est.sec = b.dataset.fSec; aplicar(true); }); });
    $$('[data-f-dec]', ex).forEach(function (b) { b.addEventListener('click', function () { est.dec = b.dataset.fDec; aplicar(true); }); });
    $('[data-f-limpar]', ex).addEventListener('click', function () { est = { q: '', sec: '', dec: '', ordem: est.ordem }; campo.value = ''; aplicar(true); campo.focus(); });
    aplicar(false);
  });

  /* ---------- Matéria ---------- */
  var texto = $('[data-texto]');
  if (texto) {
    // Sumário "Neste caso"
    var sum = $('[data-sumario]'), hs = $$(':scope > h2', texto);
    if (sum && hs.length >= 3) {
      var ol = $('ol', sum);
      hs.forEach(function (h, i) {
        if (!h.id) h.id = 'parte-' + (i + 1);
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + h.id; a.textContent = h.textContent; li.appendChild(a); ol.appendChild(li);
      });
      sum.hidden = false;
      if ('IntersectionObserver' in window) {
        var links = $$('a', ol), atual = null;
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) atual = e.target.id; });
          links.forEach(function (a) { a.classList.toggle('atual', a.hash === '#' + atual); });
        }, { rootMargin: '-20% 0px -70% 0px' });
        hs.forEach(function (h) { io.observe(h); });
      }
    }
    // Ficha recolhida no celular
    var ficha = $('[data-ficha]');
    if (ficha && matchMedia('(max-width: 900px)').matches) ficha.open = false;

    // Barra de progresso e botão de topo
    var barra = $('.progresso span'), irTopo = $('.ir-topo'), pedido = false;
    function rolar() {
      pedido = false;
      var r = texto.getBoundingClientRect(), total = r.height - innerHeight * 0.6;
      var p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      if (barra) barra.style.transform = 'scaleX(' + p + ')';
      if (irTopo) irTopo.hidden = scrollY < innerHeight * 1.2;
    }
    addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(rolar); } }, { passive: true });
    rolar();
    if (irTopo) irTopo.addEventListener('click', function () {
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      var m = $('#conteudo'); if (m) m.focus({ preventScroll: true });
    });
  }

  /* ---------- Compartilhar ---------- */
  $$('[data-compartilhar]').forEach(function (b) {
    var rot = $('span', b), orig = rot.textContent;
    b.addEventListener('click', function () {
      var dados = { title: b.dataset.titulo || document.title, url: location.href.split('#')[0] };
      if (navigator.share) { navigator.share(dados).catch(function () {}); return; }
      var ok = function () { rot.textContent = 'Link copiado'; setTimeout(function () { rot.textContent = orig; }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(dados.url).then(ok, function () { prompt('Copie o link:', dados.url); });
      else prompt('Copie o link:', dados.url);
    });
  });
})();
