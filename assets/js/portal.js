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
    var sum = $('[data-sumario]'), hs = $$(':scope > h2, :scope > .quem > h2, :scope > .fontes > h2', texto);
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

  /* ---------- Armazenamento local (pode falhar em aba anônima) ---------- */
  var guarda = {
    ler: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    por: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var raiz = document.documentElement;

  /* ---------- Ajustes de leitura: tema e tamanho do texto ---------- */
  var botaoLeitura = $('[data-leitura]'), painelLeitura = $('#leitura');
  if (botaoLeitura && painelLeitura) {
    var escalas = [0.9, 1, 1.1, 1.2, 1.35];
    var temaFixo = raiz.hasAttribute('data-tema-fixo');
    var temaAtual = function () { if (temaFixo) return guarda.ler('portal-tema') === 'claro' ? 'claro' : 'escuro'; return raiz.getAttribute('data-tema') === 'claro' ? 'claro' : 'escuro'; };
    var escalaAtual = function () { var e = parseFloat(getComputedStyle(raiz).getPropertyValue('--escala')) || 1; return escalas.reduce(function (a, b) { return Math.abs(b - e) < Math.abs(a - e) ? b : a; }); };
    var corTopo = $('meta[name="theme-color"]'), esquema = $('meta[name="color-scheme"]');
    var mostrarLeitura = function () {
      var t = temaAtual(), e = escalaAtual();
      $$('[data-tema-op]', painelLeitura).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.temaOp === t)); });
      $('[data-tam-valor]', painelLeitura).textContent = Math.round(e * 100) + '%';
      $('[data-tam="-1"]', painelLeitura).disabled = e <= escalas[0];
      $('[data-tam="1"]', painelLeitura).disabled = e >= escalas[escalas.length - 1];
      if (!temaFixo && corTopo) corTopo.content = t === 'claro' ? '#f7f3ec' : '#000000';
      if (!temaFixo && esquema) esquema.content = t === 'claro' ? 'light' : 'dark';
    };
    var fecharLeitura = function (foco) { painelLeitura.hidden = true; botaoLeitura.setAttribute('aria-expanded', 'false'); if (foco) botaoLeitura.focus(); };
    botaoLeitura.addEventListener('click', function () {
      var abrir = painelLeitura.hidden;
      painelLeitura.hidden = !abrir; botaoLeitura.setAttribute('aria-expanded', String(abrir));
      if (abrir) { mostrarLeitura(); $('[aria-pressed="true"]', painelLeitura).focus(); }
    });
    $$('[data-tema-op]', painelLeitura).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!temaFixo) { if (b.dataset.temaOp === 'claro') raiz.setAttribute('data-tema', 'claro'); else raiz.removeAttribute('data-tema'); }
        guarda.por('portal-tema', b.dataset.temaOp); mostrarLeitura();
      });
    });
    $$('[data-tam]', painelLeitura).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = escalas.indexOf(escalaAtual()) + +b.dataset.tam;
        var e = escalas[Math.max(0, Math.min(escalas.length - 1, i))];
        raiz.style.setProperty('--escala', e); guarda.por('portal-escala', String(e)); mostrarLeitura();
        if (b.disabled) $('[data-tam]:not([disabled])', painelLeitura).focus();
      });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !painelLeitura.hidden) fecharLeitura(true); });
    document.addEventListener('click', function (e) { if (!painelLeitura.hidden && !painelLeitura.contains(e.target) && !botaoLeitura.contains(e.target)) fecharLeitura(false); });
    if (temaFixo) { var nota = $('.lp-nota', painelLeitura); if (nota) nota.textContent = 'Esta ferramenta só tem tema escuro, porque as cores foram feitas para fundo preto. O tema que você escolher vale para as outras páginas.'; }
    mostrarLeitura();
  }

  /* ---------- Casos já lidos ---------- */
  var lidos = {};
  try { lidos = JSON.parse(guarda.ler('portal-lidos') || '{}') || {}; } catch (e) { lidos = {}; }
  function marcarLidos() {
    $$('[data-lido]').forEach(function (el) {
      var l = !!lidos[el.dataset.lido];
      el.classList.toggle('lido', l);
      if (l && !$('.selo-lido', el)) {
        var s = document.createElement('span'); s.className = 'selo-lido'; s.textContent = 'Lido';
        var alvo = $('.card-texto, .lc-texto, .tl-texto', el) || el; alvo.appendChild(s);
      }
    });
    $$('[data-trilha]').forEach(function (t) {
      var itens = $$('[data-lido]', t), n = itens.filter(function (i) { return lidos[i.dataset.lido]; }).length;
      var pr = $('[data-trilha-prog]', t); if (pr && n) pr.textContent = n + ' de ' + itens.length + ' lidos' + (n === itens.length ? '. Trilha completa.' : '');
    });
  }
  marcarLidos();
  var texto = $('[data-texto]');
  if (texto && texto.dataset.slug) {
    var slug = texto.dataset.slug, selo = $('[data-lido-selo]');
    if (lidos[slug] && selo) selo.hidden = false;
    var fimTexto = $('.fontes', texto) || texto.lastElementChild;
    if ('IntersectionObserver' in window && fimTexto && !lidos[slug]) {
      var ob = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { lidos[slug] = Date.now(); guarda.por('portal-lidos', JSON.stringify(lidos)); ob.disconnect(); }
      });
      ob.observe(fimTexto);
    }
  }

  /* ---------- Glossário nas matérias ---------- */
  var dadosGl = $('#glossario-dados');
  if (texto && dadosGl) {
    var termos = [];
    try { termos = JSON.parse(dadosGl.textContent); } catch (e) {}
    var usados = {}, nGl = 0;
    var bordaPalavra = '(^|[^0-9A-Za-zÀ-ÿ])';
    var padroes = termos.map(function (t) {
      var formas = t.termos.slice().sort(function (a, b) { return b.length - a.length; }).map(function (f) { return f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
      var sens = t.termos.some(function (f) { return /[A-Z]/.test(f); });
      return { t: t, re: new RegExp(bordaPalavra + '(' + formas.join('|') + ')(?![0-9A-Za-zÀ-ÿ])', sens ? '' : 'i') };
    });
    var blocos = $$(':scope > p, :scope > ul > li, :scope > ol > li, :scope > blockquote p', texto);
    var bolha = document.createElement('div');
    bolha.className = 'gl-bolha'; bolha.id = 'gl-bolha'; bolha.setAttribute('role', 'tooltip'); bolha.hidden = true;
    document.body.appendChild(bolha);
    var ativo = null;
    var fixo = false;
    var esconder = function () { bolha.hidden = true; fixo = false; if (ativo) ativo.setAttribute('aria-expanded', 'false'); ativo = null; };
    var mostrarGl = function (b) {
      var t = termos[+b.dataset.gl];
      bolha.innerHTML = '<b>' + esc(t.nome) + '</b><span>' + esc(t.def) + '</span><a href="' + esc(b.dataset.glUrl) + '#' + esc(t.id) + '">Ver o glossário</a>';
      bolha.hidden = false; if (ativo && ativo !== b) ativo.setAttribute('aria-expanded', 'false'); ativo = b; b.setAttribute('aria-expanded', 'true');
      var r = b.getBoundingClientRect(), w = bolha.offsetWidth, h = bolha.offsetHeight;
      var x = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2));
      var y = r.bottom + 10; if (y + h > innerHeight - 12 && r.top - h - 10 > 0) y = r.top - h - 10;
      bolha.style.left = (x + scrollX) + 'px'; bolha.style.top = (y + scrollY) + 'px';
    };
    var urlGl = dadosGl.dataset.url || (document.querySelector('link[rel="icon"]').getAttribute('href').replace(/favicon\.png$/, '') + 'glossario/');
    blocos.forEach(function (bl) {
      if (bl.closest('.quem-e-quem, .fontes, .autor, .linha-tempo')) return;
      var andar = document.createTreeWalker(bl, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return n.parentNode.closest('a, button, .gl') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
      var nos = []; while (andar.nextNode()) nos.push(andar.currentNode);
      nos.forEach(function (no) {
        padroes.forEach(function (pd, i) {
          if (usados[pd.t.id] || !no.parentNode) return;
          var m = pd.re.exec(no.nodeValue); if (!m) return;
          usados[pd.t.id] = 1;
          var ini = m.index + m[1].length, palavra = m[2];
          var depois = no.splitText(ini); depois.nodeValue = depois.nodeValue.slice(palavra.length);
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'gl'; b.textContent = palavra; b.dataset.gl = i; b.dataset.glUrl = urlGl;
          b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'gl-bolha');
          b.setAttribute('aria-label', palavra + ': ver explicação');
          no.parentNode.insertBefore(b, depois); nGl++;
          no = depois;
        });
      });
    });
    if (nGl) {
      texto.addEventListener('click', function (e) { var b = e.target.closest('.gl'); if (!b) return; if (ativo === b && fixo) esconder(); else { mostrarGl(b); fixo = true; } });
      texto.addEventListener('mouseover', function (e) { var b = e.target.closest('.gl'); if (b && ultimoPonteiro === 'mouse' && !fixo) mostrarGl(b); });
      texto.addEventListener('mouseout', function (e) { var b = e.target.closest('.gl'); if (b && ultimoPonteiro === 'mouse' && !fixo) setTimeout(function () { if (!fixo && !bolha.matches(':hover') && !b.matches(':hover') && ativo === b) esconder(); }, 200); });
      bolha.addEventListener('mouseleave', function () { if (ultimoPonteiro === 'mouse' && ativo && !fixo) esconder(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ativo) { var a = ativo; esconder(); a.focus(); } });
      document.addEventListener('click', function (e) { if (ativo && !e.target.closest('.gl, .gl-bolha')) esconder(); });
      addEventListener('resize', esconder);
    }
  }

  /* ---------- Ouvir a matéria ---------- */
  var ouvir = $('[data-ouvir]');
  if (ouvir && texto && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
    ouvir.hidden = false;
    var sint = window.speechSynthesis, play = $('[data-ouvir-play]', ouvir), parar = $('[data-ouvir-parar]', ouvir);
    var rot = $('[data-ouvir-rot]', ouvir), velWrap = $('[data-ouvir-vel-wrap]', ouvir), vel = $('[data-ouvir-vel]', ouvir);
    var partes = [], pos = 0, estado = 'parado', voz = null;
    var acharVoz = function () {
      var vs = sint.getVoices();
      voz = vs.filter(function (v) { return /^pt[-_]BR/i.test(v.lang); })[0] || vs.filter(function (v) { return /^pt/i.test(v.lang); })[0] || null;
    };
    acharVoz(); if (sint.addEventListener) sint.addEventListener('voiceschanged', acharVoz);
    var juntar = function () {
      var t = $('h1') ? [{ el: null, txt: $('h1').textContent + '. ' + ($('.linha-fina') ? $('.linha-fina').textContent : '') }] : [];
      $$(':scope > h2, :scope > h3, :scope > p, :scope > ul > li, :scope > ol > li, :scope > blockquote', texto).forEach(function (el) {
        if (el.closest('.quem-e-quem, .fontes, .autor')) return;
        var s = el.textContent.replace(/\s+/g, ' ').trim(); if (s) t.push({ el: el, txt: s });
      });
      return t;
    };
    var marcar = function (el) { $$('.lendo', texto).forEach(function (x) { x.classList.remove('lendo'); }); if (el) el.classList.add('lendo'); };
    var falar = function () {
      if (pos >= partes.length) { pararTudo(); return; }
      var p = partes[pos], u = new SpeechSynthesisUtterance(p.txt);
      u.lang = 'pt-BR'; if (voz) u.voice = voz; u.rate = parseFloat(vel.value) || 1;
      u.onend = function () { if (estado === 'tocando') { pos++; falar(); } };
      u.onerror = function (e) { if (e.error !== 'interrupted' && e.error !== 'canceled') pararTudo(); };
      marcar(p.el);
      if (p.el) { var r = p.el.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight) p.el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
      sint.speak(u);
    };
    var mostrar = function () {
      ouvir.dataset.estado = estado;
      play.setAttribute('aria-pressed', String(estado === 'tocando'));
      rot.textContent = estado === 'tocando' ? 'Pausar' : estado === 'pausado' ? 'Continuar' : 'Ouvir';
      parar.hidden = velWrap.hidden = estado === 'parado';
    };
    var pararTudo = function () { estado = 'parado'; sint.cancel(); pos = 0; marcar(null); mostrar(); };
    play.addEventListener('click', function () {
      if (estado === 'tocando') { estado = 'pausado'; sint.cancel(); }
      else { if (estado === 'parado') { partes = juntar(); pos = 0; } estado = 'tocando'; sint.cancel(); falar(); }
      mostrar();
    });
    parar.addEventListener('click', function () { pararTudo(); play.focus(); });
    vel.addEventListener('change', function () { if (estado === 'tocando') { sint.cancel(); falar(); } });
    addEventListener('pagehide', function () { sint.cancel(); });
    mostrar();
  }

  /* ---------- Quanto custou: valores da época ou corrigidos ---------- */
  var modos = $$('[data-modo-op]');
  if (modos.length) {
    var aplicarModo = function (m, salvar) {
      modos.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.modoOp === m)); });
      $$('[data-modo]').forEach(function (p) { p.hidden = p.dataset.modo !== m; });
      if (salvar) { var u = new URL(location.href); if (m === 'ipca') u.searchParams.set('valores', 'corrigidos'); else u.searchParams.delete('valores'); history.replaceState(null, '', u); }
    };
    modos.forEach(function (b) { b.addEventListener('click', function () { aplicarModo(b.dataset.modoOp, true); }); });
    if (new URL(location.href).searchParams.get('valores') === 'corrigidos') aplicarModo('ipca');
  }

  /* ---------- Comparar casos ---------- */
  $$('[data-comparar]').forEach(function (c) {
    var tabela = $('[data-cmp-tabela]', c), sels = { a: $('[data-cmp-sel="a"]', c), b: $('[data-cmp-sel="b"]', c) };
    var existe = function (s) { return s && $('template[data-cmp="' + CSS.escape(s) + '"]', c); };
    var u = new URL(location.href);
    sels.a.value = existe(u.searchParams.get('a')) ? u.searchParams.get('a') : c.dataset.padraoA;
    sels.b.value = existe(u.searchParams.get('b')) ? u.searchParams.get('b') : c.dataset.padraoB;
    var preencher = function (salvar) {
      ['a', 'b'].forEach(function (l) {
        var tpl = existe(sels[l].value); if (!tpl) return;
        var frag = tpl.content;
        $('[data-cmp-col="' + l + '"]', tabela).innerHTML = frag.querySelector('[data-campo="cabeca"]').innerHTML;
        $$('[data-cmp-linha]', tabela).forEach(function (tr) {
          var campo = frag.querySelector('[data-campo="' + tr.dataset.cmpLinha + '"]');
          $('[data-lado="' + l + '"]', tr).innerHTML = campo ? campo.innerHTML : '';
        });
      });
      tabela.hidden = false;
      if (salvar) { var n = new URL(location.href); n.searchParams.set('a', sels.a.value); n.searchParams.set('b', sels.b.value); history.replaceState(null, '', n); }
    };
    sels.a.addEventListener('change', function () { preencher(true); });
    sels.b.addEventListener('change', function () { preencher(true); });
    $('[data-cmp-trocar]', c).addEventListener('click', function () { var x = sels.a.value; sels.a.value = sels.b.value; sels.b.value = x; preencher(true); });
    preencher(false);
  });

  /* ---------- Quanto custou: busca, filtro e ordem da tabela ---------- */
  $$('[data-v-tabela]').forEach(function (sec) {
    var corpo = $('tbody', sec), linhas = $$('tbody tr', sec), q = $('[data-vt-q]', sec), conta = $('[data-vt-conta]', sec), vazio = $('[data-vt-vazio]', sec);
    var tipo = '', ord = 'valor', dir = -1;
    linhas.forEach(function (l) { l._b = norm(l.dataset.busca); });
    var aplicar = function () {
      var termos = norm(q.value).split(/\s+/).filter(Boolean), n = 0;
      linhas.forEach(function (l) {
        var ok = (!tipo || l.dataset.tipo === tipo) && termos.every(function (t) { return l._b.indexOf(t) >= 0; });
        l.hidden = !ok; if (ok) n++;
      });
      conta.textContent = n + (n === 1 ? ' valor' : ' valores');
      vazio.hidden = n > 0;
    };
    var ordenar = function () {
      linhas.slice().sort(function (a, b) {
        if (ord === 'caso') return dir * a.dataset.caso.localeCompare(b.dataset.caso, 'pt');
        if (ord === 'ano') return dir * (a.dataset.ano - b.dataset.ano) || (b.dataset.valor - a.dataset.valor);
        return (a.dataset.moeda - b.dataset.moeda) || dir * (a.dataset.valor - b.dataset.valor);
      }).forEach(function (l) { corpo.appendChild(l); });
      $$('thead th', sec).forEach(function (th) {
        var b = $('[data-vt-ord]', th); if (!b) return;
        th.setAttribute('aria-sort', b.dataset.vtOrd === ord ? (dir > 0 ? 'ascending' : 'descending') : 'none');
      });
    };
    $$('[data-vt-ord]', sec).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ord === b.dataset.vtOrd) dir = -dir; else { ord = b.dataset.vtOrd; dir = ord === 'caso' ? 1 : -1; }
        ordenar();
      });
    });
    $$('[data-vt-tipo]', sec).forEach(function (c) {
      c.addEventListener('click', function () {
        tipo = c.dataset.vtTipo;
        $$('[data-vt-tipo]', sec).forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        aplicar();
      });
    });
    var tm; q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(aplicar, 120); });
  });

  /* ---------- Menu do topo: grupos Explorar e Entender ---------- */
  var grupos = $$('[data-nav-grupo]');
  var fecharGrupos = function (exceto) {
    grupos.forEach(function (g) { if (g === exceto) return; var b = $('.nav-btn', g); b.setAttribute('aria-expanded', 'false'); $('.nav-sub', g).hidden = true; });
  };
  grupos.forEach(function (g) {
    var b = $('.nav-btn', g), sub = $('.nav-sub', g), tm;
    var abrir = function (on) { fecharGrupos(g); b.setAttribute('aria-expanded', String(on)); sub.hidden = !on; };
    b.addEventListener('click', function () { abrir(sub.hidden); });
    g.addEventListener('mouseenter', function () { if (ultimoPonteiro === 'mouse') { clearTimeout(tm); abrir(true); } });
    g.addEventListener('mouseleave', function () { if (ultimoPonteiro === 'mouse') tm = setTimeout(function () { abrir(false); }, 180); });
    g.addEventListener('keydown', function (e) {
      var links = $$('a', sub), i = links.indexOf(document.activeElement);
      if (e.key === 'Escape' && !sub.hidden) { abrir(false); b.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (sub.hidden) abrir(true); (links[i + 1] || links[0]).focus(); }
      else if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
    });
    g.addEventListener('focusout', function (e) { if (!g.contains(e.relatedTarget)) abrir(false); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('[data-nav-grupo]')) fecharGrupos(); });
})();
