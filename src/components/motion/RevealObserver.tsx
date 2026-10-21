/**
 * One IntersectionObserver for the whole site. Any element with `data-reveal`
 * (rendered by server or client components) receives `data-inview` the first
 * time it enters the viewport. CSS performs the animation, so reveals cost no
 * per-frame JavaScript and remain fully visible without JS or with reduced motion.
 *
 * It is a tiny inline script at the end of <body> rather than a client
 * component, so reveals start as soon as the page is parsed instead of after
 * React has downloaded and hydrated — on a slow phone that is seconds sooner.
 * A MutationObserver picks up pages rendered by client-side navigation, and
 * elements whose `data-inview` is removed (to replay a reveal, as the portfolio
 * filter does) are watched again.
 */
const script = `(function(){
var d=document,r=d.documentElement,q='[data-reveal]:not([data-inview])';
function show(e){e.setAttribute('data-inview','')}
if(!('IntersectionObserver' in window)){d.querySelectorAll(q).forEach(show);r.classList.add('reveal-ready');return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:0.12});
function observe(s){s.querySelectorAll(q).forEach(function(e){io.observe(e)})}
observe(d);
new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==='attributes'){if(m.target.matches(q))io.observe(m.target);return}m.addedNodes.forEach(function(n){if(n.nodeType===1){if(n.matches(q))io.observe(n);observe(n)}})})}).observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-inview']});
r.classList.add('reveal-ready')})()`;

export function RevealObserver() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
