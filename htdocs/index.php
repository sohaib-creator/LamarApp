<?php
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>لمار للمياه | توصيل مياه شرب نقية</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <script>
    // Redirect API calls from Render -> same-origin PHP proxy
    var ORIG = 'https://lamarapp.onrender.com';
    var PROXY = '/api-proxy.php?url=';
    var origFetch = window.fetch.bind(window);
    window.fetch = function(u, opts) {
      if (typeof u === 'string' && u.indexOf(ORIG) === 0) {
        u = PROXY + encodeURIComponent(u.replace(ORIG, ''));
      }
      return origFetch(u, opts);
    };
    var origXHR = window.XMLHttpRequest;
    var XHR = function() {
      var xhr = new origXHR();
      var _open = xhr.open.bind(xhr);
      xhr.open = function(m, u) {
        if (typeof u === 'string' && u.indexOf(ORIG) === 0) {
          u = PROXY + encodeURIComponent(u.replace(ORIG, ''));
        }
        return _open(m, u, arguments.length > 2 ? arguments[2] : true);
      };
      return xhr;
    };
    window.XMLHttpRequest = XHR;
    </script>
    <script type="module" crossorigin src="/assets/index-xJqPOn6y.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DIXAhVlG.css">
  </head>
  <body><div id="root"></div>
  <script>
  (function(){
    var t = document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*=\s*([^;]*).*$)|^.*$/, "$1");
    if (t && !localStorage.getItem('token')) { try { localStorage.setItem('token', t); } catch(e) {} }
  })();
  </script>
  <script>
  (function(){
    var done=new WeakSet();
    var busy=new WeakSet();

    function countUp(el,rawNum,suffix){
      if(busy.has(el))return;
      var num=parseFloat(rawNum);
      if(isNaN(num)||num<=0){el.classList.add('num-pop');return;}
      busy.add(el);done.add(el);

      var dur=Math.min(1600,Math.max(600,num*0.3));
      var isInt=Number.isInteger(num)&&rawNum.indexOf('.')===-1;
      var start=performance.now();

      function tick(now){
        var p=Math.min(1,(now-start)/dur);
        var ease=1-Math.pow(1-p,3);
        var cur=ease*num;
        var str=isInt?Math.round(cur).toLocaleString('en'):cur.toFixed(2);
        el.textContent=str+suffix;
        if(p<1)requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function process(el){
      if(done.has(el)||el.nodeType!==1||el.children.length>0)return;
      var t=el.textContent.trim();
      if(!t)return;

      var m=t.match(/^(\d+(?:[.,]\d+)?)\s*([+%]|ريال|SAR)?$/);
      if(m){countUp(el,m[1],m[2]||'');return;}

      if(el.children.length===1&&el.children[0].tagName==='SMALL'){
        var clean=t.replace(/\s/g,'');
        var m2=clean.match(/^(\d+(?:[.,]\d+)?)(SAR|ريال)?$/);
        if(m2){countUp(el,m2[1],' '+m2[2]);return;}
      }
    }

    function scan(root){
      if(root&&root.nodeType===1)process(root);
      var all=(root||document).querySelectorAll('*');
      for(var i=0;i<all.length;i++)process(all[i]);
    }

    var mo=new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes.forEach(function(n){if(n.nodeType===1)scan(n);});
        if(m.type==='childList'&&m.addedNodes.length>0)process(m.target);
      });
    });
    if(document.body){
      mo.observe(document.body,{childList:true,subtree:true});
      [200,800,2000,4000,6000].forEach(function(d){setTimeout(function(){scan(document);},d);});
    }else{
      document.addEventListener('DOMContentLoaded',function(){
        mo.observe(document.body,{childList:true,subtree:true});
        scan(document);
      });
    }
  })();
  </script>
  <script>
  (function(){
    var waitForFooter = setInterval(function(){
      var links = document.querySelectorAll('footer a[href="#"], .contentinfo a[href="#"]');
      if(links.length > 0){
        links.forEach(function(a){
          var text = a.textContent.trim();
          if(text === 'واتساب' || a.title === 'واتساب') a.href = 'https://wa.me/966920011122';
          else if(text === 'تويتر' || a.title === 'تويتر') a.href = 'https://twitter.com/lamarwater';
          else if(text === 'انستقرام' || a.title === 'انستقرام') a.href = 'https://instagram.com/lamarwater';
          else if(text === 'سناب شات' || a.title === 'سناب شات') a.href = 'https://snapchat.com/add/lamarwater';
        });
        clearInterval(waitForFooter);
      }
      var phoneEls = document.querySelectorAll('footer, .contentinfo');
      phoneEls.forEach(function(section){
        var all = section.querySelectorAll('*');
        all.forEach(function(el){
          if(el.children.length === 0 && el.textContent.trim() === '9200XXXXX'){
            el.textContent = '920011122';
          }
          if(el.children.length === 0 && el.textContent.trim() === 'info@lamar-water.com'){
            el.textContent = 'info@lamarwater.com';
          }
        });
      });
    }, 1000);
    setTimeout(function(){ clearInterval(waitForFooter); }, 10000);
  })();
  </script>
  <a id="lamar-whatsapp" href="https://wa.me/966920011122" target="_blank" rel="noopener" title="واتساب">
    <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>
  <style>
  #lamar-whatsapp {
    position: fixed; bottom: 24px; left: 24px; z-index: 9999;
    width: 56px; height: 56px; border-radius: 50%;
    background: #25D366; color: #fff; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 4px 20px rgba(37,211,102,0.4);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
  }
  #lamar-whatsapp:hover {
    transform: scale(1.1); box-shadow: 0 6px 28px rgba(37,211,102,0.5);
  }
  #lamar-whatsapp svg { width: 28px; height: 28px; fill: #fff; }
  </style>
  </body>
</html>
