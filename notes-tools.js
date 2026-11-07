/* Shared by lecture articles and the library. Personal edits stay on this device. */
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-note-action]');
  if (!button) return;
  const root = button.closest('[data-notes-root]');
  if (!root) return;
  const status = root.querySelector('[data-note-status]');
  const editor = root.querySelector('[data-note-editor]');
  const input = editor.querySelector('textarea');
  const key = 'drm-editable-notes-' + root.dataset.notesRoot;
  const sourceText = () => {
    const clone = root.querySelector('[data-note-content]').cloneNode(true);
    clone.querySelectorAll('nav, button, .video-frame-grid, .notes-jump').forEach(el => el.remove());
    clone.querySelectorAll('h2,h3,p,li,tr,summary,figcaption').forEach(el => {
      el.prepend(document.createTextNode('\n'));
      el.append(document.createTextNode('\n'));
    });
    clone.querySelectorAll('th,td').forEach(el => el.append(document.createTextNode('\t')));
    return clone.textContent.replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  };
  function loadEditor() {
    if (!input.dataset.loaded) {
      try { input.value = localStorage.getItem(key) ?? sourceText(); }
      catch { input.value = sourceText(); }
      input.dataset.loaded = 'true';
      input.addEventListener('input', () => {
        try { localStorage.setItem(key,input.value); status.textContent='Your edited copy is saved on this device.'; }
        catch { status.textContent='Storage is unavailable. Download your copy to keep your changes.'; }
      });
    }
  }
  const action = button.dataset.noteAction;
  if (action === 'edit') {
    loadEditor(); editor.hidden = !editor.hidden;
    button.setAttribute('aria-expanded',String(!editor.hidden));
    if (!editor.hidden) input.focus();
    return;
  }
  const text = editor.hidden ? sourceText() : input.value;
  if (action === 'copy') {
    try { await navigator.clipboard.writeText(text); status.textContent='Notes copied. You can paste them into your document.'; }
    catch { loadEditor(); editor.hidden=false; input.focus(); input.select(); status.textContent='Press Ctrl+C (or Command+C) to copy the selected notes.'; }
  }
  if (action === 'download') {
    const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href=url; link.download=root.dataset.notesRoot+'-lecture-notes.txt';
    link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Your text file is ready.';
  }
});
