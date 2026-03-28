/**
 * Serves a self-contained embed script.
 * Usage: <script src="https://wishonia.optimitron.com/embed.js" data-position="bottom-right" data-size="140"></script>
 *
 * The script creates an iframe pointing to /iframe on this same domain.
 * Host pages control Wishonia via window.wishonia.speak(text, opts).
 */
export function GET() {
  const script = `(function(){
  var s=document.currentScript;
  if(!s)return;
  var base=new URL(s.src).origin;
  var size=parseInt(s.getAttribute("data-size")||"140",10);
  var pos=s.getAttribute("data-position")||"bottom-right";
  var text=s.getAttribute("data-text")||"";
  var expr=s.getAttribute("data-expression")||"neutral";

  var w=size+40;
  var h=Math.round(size*2);

  var f=document.createElement("iframe");
  f.src=base+"/iframe?size="+size+"&expression="+encodeURIComponent(expr)+(text?"&text="+encodeURIComponent(text):"");
  f.allow="autoplay";
  f.setAttribute("loading","lazy");

  var posCSS="position:fixed;z-index:99999;border:none;background:transparent;width:"+w+"px;height:"+h+"px;";
  if(pos==="bottom-left"){posCSS+="bottom:0;left:0;"}
  else if(pos==="top-right"){posCSS+="top:0;right:0;"}
  else if(pos==="top-left"){posCSS+="top:0;left:0;"}
  else{posCSS+="bottom:0;right:0;";}

  f.style.cssText=posCSS;
  document.body.appendChild(f);

  function send(msg){
    if(f.contentWindow)f.contentWindow.postMessage(msg,base);
  }

  window.wishonia={
    speak:function(t,opts){
      send({type:"wishonia:speak",text:t,expression:opts&&opts.expression,bodyPose:opts&&opts.bodyPose});
    },
    setExpression:function(expr,pose){
      send({type:"wishonia:expression",expression:expr,bodyPose:pose});
    },
    hide:function(){f.style.display="none";},
    show:function(){f.style.display="";},
    iframe:f
  };
})();`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
