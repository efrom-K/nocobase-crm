// Retina/HiDPI: Guacamole просит у сервера разрешение = размер окна × devicePixelRatio (на Mac ×2 → в 4 раза больше пикселей
// и в разы медленнее кодирование на guacd). Для удалённого стола всегда запрашиваем обычное разрешение.
try { if (window.devicePixelRatio > 1) Object.defineProperty(window, 'devicePixelRatio', { get: function () { return 1; } }); } catch (e) {}

// значок вкладки — фирменный знак вместо логотипа Guacamole
try {
  document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(function (l) { l.parentNode.removeChild(l); });
  var ic = document.createElement('link'); ic.rel = 'icon'; ic.type = 'image/svg+xml'; ic.href = 'app/ext/kn-brand/kn-mark.svg'; document.head.appendChild(ic);
} catch (e) {}
