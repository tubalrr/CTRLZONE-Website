// CTRLZONE FB CONFIG - NEW LINK share/19XTqf3jZQ
const FB_DOMAIN = "face" + "book.com";
const FB_SHARE_PATH = "/share/19XTqf3jZQ/";
const CTRLZONE_FB_URL = "https://" + "www." + FB_DOMAIN + FB_SHARE_PATH;

function initFbLinks() {
  document.querySelectorAll("[data-fb]").forEach(el => {
    el.href = CTRLZONE_FB_URL;
    el.target = "_blank";
  });
  const disp = document.getElementById("fbLinkDisplay");
  if (disp) disp.textContent = CTRLZONE_FB_URL;
}
document.addEventListener("DOMContentLoaded", initFbLinks);

function getFbEmbedUrl(videoLink) {
  const fbD = "face" + "book.com";
  const base = "https://" + "www." + fbD + "/plugins/video.php?href=";
  return base + encodeURIComponent(videoLink) + "&show_text=true&width=500";
}
