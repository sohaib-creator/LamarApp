import { useEffect } from 'react'
import { getPublicSettings } from '../api'

const pixelGenerators = {
  pixel_facebook(id) {
    return { head: `
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/></noscript>
    ` }
  },
  pixel_tiktok(id) {
    return { head: `
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(i){var s=d.createElement("script");s.type="text/javascript",s.async=!0,s.src="https://analytics.tiktok.com/i18n/pixel/events.js";var n=d.getElementsByTagName("script")[0];n.parentNode.insertBefore(s,n)};ttq.load(${id});ttq.page()}(window,document,'ttq');
</script>
    ` }
  },
  pixel_snapchat(id) {
    return { head: `
<script>
(function(w,d){var s=d.createElement('script');s.async=!0;s.src='https://sc-static.net/scevent.min.js';var n=d.getElementsByTagName('script')[0];n.parentNode.insertBefore(s,n);})(window,document);
window.snaptr=window.snaptr||function(){(snaptr.q=snaptr.q||[]).push(arguments)};snaptr('init','${id}');snaptr('track','PAGE_VIEW');
</script>
    ` }
  },
  pixel_twitter(id) {
    return { head: `
<script>
!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
twq('init','${id}');
twq('track','PageView');
</script>
    ` }
  },
  pixel_google_ads(id) {
    return { head: `
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');
</script>
    ` }
  },
  pixel_taboola(id) {
    return { head: `
<script>
window._tfa=window._tfa||[];window._tfa.push({notify:'event',name:'page_view',id:${id}});!function(t,a,f){var e=t.getElementsByTagName(a)[0],n=t.createElement(a);n.async=!0,n.src=f;e.parentNode.insertBefore(n,e)}(document,'script','//cdn.taboola.com/libtrc/unip/${id}/tfa.js');
</script>
    ` }
  },
}

export default function PixelTracker() {
  useEffect(() => {
    getPublicSettings().then(d => {
      const s = d?.[0]
      if (!s) return
      Object.keys(pixelGenerators).forEach(key => {
        const id = (s[key] || '').trim()
        if (!id) return
        const code = pixelGenerators[key](id)
        if (code.head) {
          const el = document.createElement('div')
          el.innerHTML = code.head
          Array.from(el.children).forEach(child => {
            if (child.tagName === 'SCRIPT') {
              const script = document.createElement('script')
              Array.from(child.attributes).forEach(attr => script.setAttribute(attr.name, attr.value))
              script.textContent = child.textContent
              document.head.appendChild(script)
            } else {
              document.head.appendChild(child.cloneNode(true))
            }
          })
        }
      })
    }).catch(() => {})
  }, [])

  return null
}
