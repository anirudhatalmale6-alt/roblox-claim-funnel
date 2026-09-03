/* ============================================================
   Meta (Facebook) pixel — ONE place to set the ID.

   Paste the pixel ID between the quotes below and every page on
   the site picks it up. While it is empty nothing loads and no
   request is made to Facebook, so the site is safe to leave
   deployed before the ad account exists.

   The pixel belongs on THIS site, not on the Facebook page.
   Facebook already measures page activity by itself.
   ============================================================ */
var FB_PIXEL_ID = '';   // e.g. '1234567890123456'

/* ------------------------------------------------------------
   Deliberately no advanced matching and no event parameters.

   Advanced matching would send a hashed email and phone number
   to Meta on every submission. Meta's business tools terms
   forbid sending data about health or sexual matters, and the
   people using this form are reporting the sexual abuse of a
   child. A Lead event with no payload tells Meta what it needs
   in order to optimise — that a conversion happened — and tells
   it nothing whatsoever about the person or what happened to
   them. Do not add parameters here later without asking the
   firm's compliance people first.
   ------------------------------------------------------------ */
(function(){
  if(!FB_PIXEL_ID) return;

  /* Meta's standard loader */
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
   not a lead, and counting them would train Meta to find more of
   them. Safe to call when no pixel is configured. */
function rcaTrackLead(){
  if(window.fbq && FB_PIXEL_ID){ fbq('track', 'Lead'); }
}

/* Fired when someone answers the first question, so there is a
   mid-funnel signal to optimise against while lead volume is
   still too low for Meta to learn from. */
function rcaTrackStart(){
  if(window.fbq && FB_PIXEL_ID){ fbq('trackCustom', 'StartedForm'); }
}
