// One footer shared by the application and every generated page.
export function renderFooter(prefix='') {
 return `<footer><nav class="public-links" aria-label="Footer navigation"><a href="${prefix}index.html#courses">Medical courses</a><a href="${prefix}index.html#bank">Pathology USMLE-style questions</a><a href="${prefix}about/index.html">About us</a><a href="${prefix}privacy/index.html">Privacy policy</a><a href="${prefix}privacy/index.html#choices" data-cookie-settings>Cookie settings</a></nav><a class="brand" href="${prefix}index.html#library"><img class="brand-logo" src="${prefix}images/logo.png" alt="Dr M home" width="112" height="112"></a><p>Making medicine easier to understand.</p><span id="copyright">© ${new Date().getFullYear()}. All rights reserved.</span></footer>`;
}

