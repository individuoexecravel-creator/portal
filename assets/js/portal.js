/* Portal: menu, busca, linha do tempo da abertura, filtros, sumário, progresso e compartilhar. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var esc = function (t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ultimoPonteiro = 'mouse';
  addEventListener('pointerdown', function (e) { ultimoPonteiro = e.pointerType; }, true);

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
    addEventListener('resize', function () { if (innerWidth > 960) fecharMenu(); });
  }

  /* ---------- Busca (casos e pessoas) ---------- */
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
          p += x.nt.indexOf(termos[i]) >= 0 ? 4 : 1;
        }
        if (x.k !== 'pessoa') p += .5;
        return { x: x, p: p };
      }).filter(Boolean).sort(function (a, b) { return b.p - a.p; }).slice(0, 10);
      dica.hidden = true;
      lista.innerHTML = r.length ? r.map(function (o) {
        var x = o.x, pessoa = x.k === 'pessoa';
        return '<li><a href="' + esc(x.u) + '" class="sec-' + esc(x.k) + (pessoa ? ' res-pessoa' : '') + '">' +
          (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : '<span class="res-sem" aria-hidden="true"></span>') +
          '<span class="res-txt"><span class="res-sec">' + esc(x.sec) + (x.per ? ', ' + esc(x.per) : '') + '</span>' +
          '<span class="res-t">' + esc(x.t) + '</span>' +
          (x.s ? '<span class="res-s">' + (pessoa ? 'Aparece em: ' : '') + esc(x.s) + '</span>' : '') + '</span></a></li>';
      }).join('') : '<li class="res-nada">Nada encontrado para “' + esc(q.value) + '”. Confira a grafia ou procure só pelo sobrenome.</li>';
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
    $$('[data-sugestao]', dlg).forEach(function (b) { b.addEventListener('click', function () { q.value = b.dataset.sugestao; buscar(); q.focus(); }); });
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
    lista.addEventListener('click', function (e) { if (e.target.closest('a')) dlg.close(); });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('busca-aberta'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target, digitando = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === '/' && !digitando && !e.ctrlKey && !e.metaKey) { e.preventDefault(); abrirBusca(); }
    if (e.key === 'Escape') fecharMenu();
  });

  /* ---------- Linha do tempo da abertura ---------- */
  var cronos = $('[data-cronos]');
  if (cronos) {
    var raias = $$('.raia', cronos), vits = $$('.vit'), rolagem = $('.cronos-rolagem', cronos);
    var inicial = $('.vit[data-inicial]'), atual = inicial ? +inicial.dataset.vit : raias.length - 1;
    function mostrar(i, foco) {
      if (i < 0 || i >= raias.length) return;
      atual = i;
      vits.forEach(function (v) { v.hidden = +v.dataset.vit !== i; });
      raias.forEach(function (r, k) {
        var on = k === i;
        r.classList.toggle('ativa', on);
        r.tabIndex = on ? 0 : -1;
        if (on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current');
      });
      var r = raias[i];
      if (rolagem.scrollWidth > rolagem.clientWidth + 2) {
        var esq = r.offsetLeft, dir = esq + r.offsetWidth;
        if (esq < rolagem.scrollLeft + 24 || dir > rolagem.scrollLeft + rolagem.clientWidth - 24)
          rolagem.scrollTo({ left: Math.max(0, esq - rolagem.clientWidth / 2), behavior: semMovimento ? 'auto' : 'smooth' });
      }
      if (foco) r.focus({ preventScroll: true });
    }
    raias.forEach(function (r, i) {
      r.addEventListener('mouseenter', function () { if (ultimoPonteiro === 'mouse') mostrar(i); });
      r.addEventListener('focus', function () { if (atual !== i) mostrar(i); });
      var jaAtiva = false;
      r.addEventListener('pointerdown', function () { jaAtiva = atual === i; });
      r.addEventListener('click', function (e) {
        if (ultimoPonteiro !== 'mouse' && !jaAtiva) { e.preventDefault(); mostrar(i); jaAtiva = true; }
      });
      r.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); mostrar(Math.min(raias.length - 1, Math.max(0, i + k)), true); }
        if (e.key === 'Home') { e.preventDefault(); mostrar(0, true); }
        if (e.key === 'End') { e.preventDefault(); mostrar(raias.length - 1, true); }
      });
    });
    $$('[data-cronos-passo]', cronos).forEach(function (b) {
      b.addEventListener('click', function () { mostrar(Math.min(raias.length - 1, Math.max(0, atual + +b.dataset.cronosPasso))); });
    });
    cronos.classList.add('pronto');
    mostrar(atual);
  }

  /* ---------- Explorador de casos ---------- */
  $$('[data-explorador]').forEach(function (ex) {
    var grade = $('[data-f-grade]', ex), cards = $$('.card', grade), campo = $('[data-f-q]', ex),
      ordem = $('[data-f-ordem]', ex), conta = $('[data-f-conta]', ex), vazio = $('[data-f-vazio]', ex);
    cards.forEach(function (c, i) { c._b = norm(c.dataset.busca); c._i = i; c._d = (c.dataset.desf || '').split(' '); });
    var padrao = { q: '', sec: '', dec: '', desf: '', ordem: 'pub' }, est = Object.assign({}, padrao);
    var u = new URLSearchParams(location.search);
    Object.keys(padrao).forEach(function (k) { if (u.get(k)) est[k] = u.get(k); });

    function marcar(attr, val) {
      $$('[' + attr + ']', ex).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); });
    }
    function aplicar(salvar) {
      var termos = norm(est.q).trim().split(/\s+/).filter(Boolean), n = 0;
      cards.forEach(function (c) {
        var ano = +c.dataset.ano, ok = (!est.sec || c.dataset.sec === est.sec) &&
          (!est.dec || (ano >= +est.dec && ano < +est.dec + 10)) &&
          (!est.desf || c._d.indexOf(est.desf) >= 0) &&
          termos.every(function (t) { return c._b.indexOf(t) >= 0; });
        c.hidden = !ok; if (ok) n++;
      });
      cards.slice().sort(function (a, b) {
        if (est.ordem === 'ano') return a.dataset.ano - b.dataset.ano || a._i - b._i;
        if (est.ordem === 'ano-desc') return b.dataset.ano - a.dataset.ano || a._i - b._i;
        if (est.ordem === 'az') return a.dataset.nome.localeCompare(b.dataset.nome, 'pt');
        return b.dataset.pub - a.dataset.pub || a._i - b._i;
      }).forEach(function (c) { grade.appendChild(c); });
      conta.textContent = n === cards.length ? n + ' casos' : n + (n === 1 ? ' caso de ' : ' casos de ') + cards.length;
      vazio.hidden = n > 0; grade.hidden = n === 0;
      marcar('data-f-sec', est.sec); marcar('data-f-dec', est.dec); marcar('data-f-desf', est.desf);
      if (salvar) {
        var p = new URLSearchParams();
        Object.keys(padrao).forEach(function (k) { if (est[k] && est[k] !== padrao[k]) p.set(k, est[k]); });
        history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
      }
    }
    campo.value = est.q; ordem.value = est.ordem;
    var tm; campo.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { est.q = campo.value; aplicar(true); }, 120); });
    ordem.addEventListener('change', function () { est.ordem = ordem.value; aplicar(true); });
    [['data-f-sec', 'sec', 'fSec'], ['data-f-dec', 'dec', 'fDec'], ['data-f-desf', 'desf', 'fDesf']].forEach(function (g) {
      $$('[' + g[0] + ']', ex).forEach(function (b) { b.addEventListener('click', function () { est[g[1]] = b.dataset[g[2]]; aplicar(true); }); });
    });
    $('[data-f-limpar]', ex).addEventListener('click', function () { est = Object.assign({}, padrao, { ordem: est.ordem }); campo.value = ''; aplicar(true); campo.focus(); });
    aplicar(false);
  });

  /* ---------- Linha do tempo (página) ---------- */
  var lt = $('[data-lt]');
  if (lt) {
    $$('[data-lt-sec]', lt).forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.dataset.ltSec;
        $$('[data-lt-sec]', lt).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $$('.lt-gov').forEach(function (g) {
          var n = 0;
          $$('.lt-item', g).forEach(function (it) { var ok = !s || it.dataset.sec === s; it.hidden = !ok; if (ok) n++; });
          g.hidden = n === 0;
          $('[data-lt-conta]', g).textContent = n + (n === 1 ? ' caso começou' : ' casos começaram') + ' nesse período';
        });
        $$('.lt-saltos a').forEach(function (a) { var g = document.getElementById(a.hash.slice(1)); a.hidden = g && g.hidden; });
      });
    });
  }

  /* ---------- Pessoas ---------- */
  var ps = $('[data-pessoas]');
  if (ps) {
    var todosItens = $$('.pessoa', ps), itens = todosItens, pq = $('[data-p-q]', ps), varios = $('[data-p-varios]', ps),
      pconta = $('[data-p-conta]', ps), pvazio = $('[data-p-vazio]', ps), plista = $('.pessoas', ps), papel = '';
    todosItens.forEach(function (it) { it._b = norm(it.dataset.busca); it._p = it.dataset.papeis.split(' '); });
    function painelAtivo() {
      var w = $$('[data-painel-wrap]', ps).filter(function (x) { return !x.hidden; })[0];
      itens = w ? $$('.pessoa', w) : todosItens; plista = w ? $('.pessoas', w) : plista;
    }
    ps.addEventListener('aba', function () { filtrar(); });
    function filtrar() {
      painelAtivo();
      var termos = norm(pq.value).trim().split(/\s+/).filter(Boolean), n = 0;
      itens.forEach(function (it) {
        var ok = (!papel || it._p.indexOf(papel) >= 0) && (!varios.checked || +it.dataset.n > 1) &&
          termos.every(function (t) { return it._b.indexOf(t) >= 0; });
        it.hidden = !ok; if (ok) n++;
      });
      pconta.textContent = n === itens.length ? n + ' pessoas' : n + (n === 1 ? ' pessoa de ' : ' pessoas de ') + itens.length;
      pvazio.hidden = n > 0; plista.hidden = n === 0;
    }
    pq.addEventListener('input', filtrar); varios.addEventListener('change', filtrar);
    $$('[data-p-papel]', ps).forEach(function (b) {
      b.addEventListener('click', function () {
        papel = b.dataset.pPapel;
        $$('[data-p-papel]', ps).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        filtrar();
      });
    });
    $('[data-p-limpar]', ps).addEventListener('click', function () {
      pq.value = ''; varios.checked = false; papel = '';
      $$('[data-p-papel]', ps).forEach(function (x) { x.setAttribute('aria-pressed', String(!x.dataset.pPapel)); });
      filtrar(); pq.focus();
    });
    function destacar() {
      var alvo = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (alvo && alvo.classList.contains('pessoa')) {
        var w = alvo.closest('[data-painel-wrap]'); if (w && w.hidden && ps._abrirAba) ps._abrirAba(w.dataset.painelWrap);
        if (alvo.hidden) { pq.value = ''; papel = ''; varios.checked = false; filtrar(); }
        $$('.pessoa.destaque').forEach(function (x) { x.classList.remove('destaque'); });
        alvo.classList.add('destaque');
      }
    }
    addEventListener('hashchange', destacar); destacar();
  }

  /* ---------- Matéria ---------- */
  var texto = $('[data-texto]');
  if (texto) {
    var sum = $('[data-sumario]'), hs = $$(':scope > h2, :scope > .quem > h2', texto);
    if (sum && hs.length >= 3) {
      var ol = $('ol', sum);
      hs.forEach(function (h, i) {
        if (!h.id) h.id = 'parte-' + (i + 1);
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + h.id; a.textContent = h.textContent; li.appendChild(a); ol.appendChild(li);
      });
      sum.hidden = false;
      if ('IntersectionObserver' in window) {
        var links = $$('a', ol), atualH = null;
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) atualH = e.target.id; });
          links.forEach(function (a) { a.classList.toggle('atual', a.hash === '#' + atualH); });
        }, { rootMargin: '-15% 0px -75% 0px' });
        hs.forEach(function (h) { io.observe(h); });
      }
    }
    var ficha = $('[data-ficha]');
    if (ficha && matchMedia('(max-width: 900px)').matches) ficha.open = false;

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
      scrollTo({ top: 0, behavior: semMovimento ? 'auto' : 'smooth' });
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
      if (navigator.clipboard) navigator.clipboard.writeText(dados.url).then(ok, function () { rot.textContent = 'Copie o link na barra do navegador'; });
      else rot.textContent = 'Copie o link na barra do navegador';
    });
  });

  /* ---------- Abas No Brasil / Fora do Brasil (Valores, Pessoas) ---------- */
  $$('[data-abas]').forEach(function (grupo) {
    var abas = $$('[data-aba]', grupo);
    function abrirAba(sec, foco, inicial) {
      abas.forEach(function (a) {
        var on = a.dataset.aba === sec;
        a.setAttribute('aria-selected', String(on)); a.tabIndex = on ? 0 : -1;
        if (on && foco) a.focus();
      });
      $$('[data-painel-wrap]', grupo).forEach(function (p) { p.hidden = p.dataset.painelWrap !== sec; });
      if (!inicial) history.replaceState(null, '', location.pathname + location.search + (sec === abas[0].dataset.aba ? '' : '#' + sec));
      grupo.dispatchEvent(new CustomEvent('aba', { detail: sec }));
    }
    abas.forEach(function (a, i) {
      a.addEventListener('click', function () { abrirAba(a.dataset.aba); });
      a.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); abrirAba(abas[(i + k + abas.length) % abas.length].dataset.aba, true); }
      });
    });
    grupo._abrirAba = abrirAba;
    var h = decodeURIComponent(location.hash.slice(1));
    if (h && abas.some(function (a) { return a.dataset.aba === h; })) abrirAba(h);
    else if (h) { var alvo = document.getElementById(h); var w = alvo && alvo.closest('[data-painel-wrap]'); if (w) abrirAba(w.dataset.painelWrap, false, true); }
  });

  /* ---------- Quanto custou: tipos de valor ---------- */
  $$('[data-painel]').forEach(function (p) {
    var chips = $$('[data-v-tipo]', p);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        $$('[data-v-lista]', p).forEach(function (l) { l.hidden = l.dataset.vLista !== c.dataset.vTipo; });
      });
    });
  });
})();
