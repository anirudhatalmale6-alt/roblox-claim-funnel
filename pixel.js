/* ============================================================
   Tracking for Roblox Claim Advocate — TWO separate pixels.

   1. The Whop pixel. This is the one Whop's ad builder complains
      about ("we didn't find our pixel"). It is Whop's own, not
      Facebook's. Whop then forwards conversions to Meta through
      the Conversions API on your behalf.

   2. The Meta pixel. Optional alongside the Whop one, but worth
      having so Events Manager shows you the funnel directly.

   Both are switched on by an ID below. An empty ID means that
   pixel does not load and makes no requests at all.

   Neither belongs on the Facebook page — Facebook already
   measures page activity by itself. They go on this website.
   ============================================================ */

/* Whop account ID, from the dashboard URL: whop.com/dashboard/<this bit>/ */
var WHOP_BIZ_ID = 'biz_j32p4qTUuisYPg';

/* Meta pixel ID from Events Manager → Data Sources */
var FB_PIXEL_ID = '';   // e.g. '1234567890123456'

/* ------------------------------------------------------------
   Deliberately no customer data on any event.

   Both pixels accept an email, phone and name on a conversion to
   sharpen matching, and Whop passes what it receives on to Meta.
   Meta's business tools terms forbid sending them data about
   health or sexual matters, and the people using this form are
   reporting the sexual abuse of a child. A bare conversion event
   says a lead happened, which is all either platform needs to
   optimise, and says nothing about who or what. Do not add
   customer fields here without the firm's compliance sign-off.
   ------------------------------------------------------------ */

/* ---------------- Whop ---------------- */
(function(){
  if(!WHOP_BIZ_ID) return;
  !function(w,d,s,u,n,a,b){
    if(w[n]) return;
    a = w[n] = {
      q: [], t: +new Date, s: [], o: u,
      track: function(){ a.q.push([+new Date].concat([].slice.call(arguments))); },
      setScope: function(){
        a.s = [].slice.call(arguments).filter(function(x){ return typeof x === 'string'; });
        a.q.push([+new Date, 'setScope'].concat(a.s));
      },
      scope: function(){
        var c = [].slice.call(arguments);
        return { track: function(){
          a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope: c}]));
        }};
      }
    };
    b = d.createElement(s); b.async = 1; b.src = u + '/s.js';
    d.getElementsByTagName(s)[0].parentNode.insertBefore(b, d.getElementsByTagName(s)[0]);
  }(window, document, 'script', 'https://t.whop.tw', 'whop');

  whop.setScope(WHOP_BIZ_ID);
  whop.track('page');
})();

/* ---------------- Meta ---------------- */
(function(){
  if(!FB_PIXEL_ID) return;

  !function(f,b,e,v,n,t,s){
    if(f.fbq) return; n = f.fbq = function(){
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if(!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', FB_PIXEL_ID);
  fbq('track', 'PageView');

  /* No <noscript> image fallback here, on purpose. A <noscript> block only
     stays inert when it is in the HTML the browser parsed; injected through
     the DOM its contents are live elements, so the image loads and every
     visit is counted as two PageViews. It could not have helped anyway —
     this file is itself a script, so it never runs when scripts are off,
     and the questionnaire does not work without them either. */
})();

/* Called once, when a completed case review is actually submitted.
   Not called on a screen-out — a visitor who fails the criteria is
   not a lead, and counting them would train the ad platforms to go
   and find more of them. Safe to call with either pixel switched off. */
function rcaTrackLead(){
  if(window.whop && WHOP_BIZ_ID){ whop.track('lead'); }
  if(window.fbq  && FB_PIXEL_ID){ fbq('track', 'Lead'); }
}

/* Fired when someone answers the first question, so there is a
   mid-funnel signal to optimise against while lead volume is still
   too low for either platform to learn from. */
function rcaTrackStart(){
  if(window.whop && WHOP_BIZ_ID){ whop.track('view_content'); }
  if(window.fbq  && FB_PIXEL_ID){ fbq('trackCustom', 'StartedForm'); }
}
