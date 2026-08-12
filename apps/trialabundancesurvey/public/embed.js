/**
 * Trial Abundance Survey embed loader (WordPress / static sites).
 *
 * Usage:
 *   <div id="trial-abundance-survey"></div>
 *   <script
 *     src="https://trialabundancesurvey.org/embed.js"
 *     data-ref="YOUR_REF"
 *     data-origin="https://trialabundancesurvey.org"
 *     data-height="720"
 *     async>
 *   </script>
 *
 * Or target a node: data-target="#my-survey"
 */
;(function () {
  var script = document.currentScript
  if (!script) return

  var origin =
    script.getAttribute("data-origin") ||
    (script.src ? new URL(script.src).origin : "https://trialabundancesurvey.org")
  var ref = script.getAttribute("data-ref") || ""
  var height = script.getAttribute("data-height") || "720"
  var targetSel = script.getAttribute("data-target") || "#trial-abundance-survey"
  var target = document.querySelector(targetSel)
  if (!target) {
    target = document.createElement("div")
    target.id = "trial-abundance-survey"
    script.parentNode && script.parentNode.insertBefore(target, script)
  }

  var src = origin.replace(/\/$/, "") + "/embed?embed=1"
  if (ref) src += "&ref=" + encodeURIComponent(ref)

  var iframe = document.createElement("iframe")
  iframe.src = src
  iframe.title = "Trial Abundance Survey"
  iframe.style.width = "100%"
  iframe.style.height = /px$|%$/.test(height) ? height : height + "px"
  iframe.style.border = "4px solid #000"
  iframe.style.background = "#fff"
  iframe.setAttribute("loading", "lazy")
  iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade")
  iframe.setAttribute("allow", "clipboard-write")

  target.appendChild(iframe)
})()
