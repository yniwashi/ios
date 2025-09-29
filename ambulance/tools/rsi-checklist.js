// /tools/rsi-checklist.js
export async function run(root) {
  root.style.minHeight = '100dvh';

  // Your unchanged Android HTML (now hosted here):
  const SRC = "/ios/helpers/rsi_checklist_js.html";

  let html;
  try {
    const res = await fetch(SRC, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    root.innerHTML = `<p style="padding:12px;font:14px/1.45 system-ui">Could not load RSI checklist: ${e.message}</p>`;
    return;
  }

  // Runtime path rewrites for web
  html = html
    // image from android assets -> web images
    .replaceAll("file:///android_asset/", "/ios/ambulance/images/")
    // raw audio -> web audio
    .replaceAll("file:///android_res/raw/", "/ios/ambulance/audio/");

  // Render inside an isolated doc so your inline CSS/JS runs unchanged
  const iframe = document.createElement("iframe");
  iframe.title = "RSI Checklist";
  iframe.style.width = "100%";
  iframe.style.height = "100dvh";
  iframe.style.border = "0";
  iframe.referrerPolicy = "no-referrer";
  iframe.srcdoc = html;

  root.innerHTML = "";
  root.appendChild(iframe);
}
