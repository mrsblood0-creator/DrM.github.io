/* Progressive enhancements for the crawlable lecture articles. */
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-scroll-note]");
  if (button) {
    event.preventDefault();
    const section = document.getElementById(button.dataset.scrollNote);
    if (section?.tagName === "DETAILS") section.open = true;
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

// Keep the footer year current between static rebuilds.
const copyrightNotice = document.getElementById("copyright");
if (copyrightNotice) copyrightNotice.textContent = `© ${new Date().getFullYear()}. All rights reserved.`;
