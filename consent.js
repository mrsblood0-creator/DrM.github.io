/* Analytics/video choices are local; certified advertising consent can be delegated to Google. */
(() => {
  // Enable only after the AdSense Privacy & messaging message is published.
  const googleAdvertisingConsent = true;
  const privacyUrl=new URL('privacy/index.html',document.currentScript?.src || location.href).href;
  const key='drm-consent-v1', expiry=180*24*60*60*1000;
  let saved=null;
  try { saved=JSON.parse(localStorage.getItem(key)); } catch {}
  if(!saved || saved.version!==1 || !Number.isFinite(saved.at) || Date.now()-saved.at>expiry) saved=null;
  let choice={analytics:false,ads:false,videos:false,...(saved?.choices||{})};
  let hasSavedChoice=!!saved;
  let adsLoaded=false;
  window.drmConsent={allows:name=>choice[name]===true,open:()=>open()};
  function activate(){
    window.dispatchEvent(new Event('drm-consent-change'));
    if((googleAdvertisingConsent || choice.ads) && !adsLoaded && /^https?:$/.test(location.protocol) && !['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
      adsLoaded=true;
      const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';
      s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1037790802847977';document.head.append(s);
    }
    videos();
  }
  function videos(){
    document.querySelectorAll('iframe[data-consent-src]').forEach(frame=>{
      if(choice.videos){if(!frame.hasAttribute('src'))frame.src=frame.dataset.consentSrc;frame.hidden=false;frame.previousElementSibling?.matches('.video-consent')&&frame.previousElementSibling.remove();}
      else {frame.hidden=true;frame.removeAttribute('src');if(!frame.previousElementSibling?.matches('.video-consent')){const box=document.createElement('div');box.className='video-consent';box.innerHTML='<p>Allow YouTube videos to load this lecture. YouTube may process information about your visit.</p><button type="button">Video privacy settings</button>';box.querySelector('button').onclick=()=>open();frame.before(box);}}
    });
  }
  const dialog=document.createElement('dialog');dialog.className='cookie-dialog';
  dialog.setAttribute('aria-labelledby','cookie-title');
  dialog.innerHTML='<h2 id="cookie-title">Your privacy choices</h2><p>Choose optional services. Essential storage keeps your study progress and privacy preferences on this browser.</p><label><input type="checkbox" name="analytics"> Analytics — help us understand site usage</label><label><input type="checkbox" name="ads"> Advertising — allow Google AdSense cookies and requests</label><label><input type="checkbox" name="videos"> YouTube — allow embedded video players</label><div class="cookie-actions"><button type="button" data-choice="save">Save changes</button></div><p class="muted">You can change your choices using Cookie settings in the footer.</p>';
  document.body.append(dialog);
  if(googleAdvertisingConsent){
    dialog.querySelector('input[name="ads"]').closest('label').remove();
    const advertising=document.createElement('div');
    advertising.innerHTML='<p>Google manages advertising privacy choices separately. Depending on your choices and location, eligible ads may be personalized, non-personalized, limited, or unavailable.</p>';
    dialog.append(advertising);
  }
  const policy=document.createElement('p');
  const policyLink=document.createElement('a');
  policyLink.href=privacyUrl;policyLink.textContent='Channel privacy policy';
  policy.append(policyLink);dialog.append(policy);
  function open(){for(const input of dialog.querySelectorAll('input'))input.checked=hasSavedChoice?choice[input.name]===true:true;if(!dialog.open)dialog.showModal();}
  dialog.addEventListener('click',event=>{
    const action=event.target.dataset.choice;if(action!=='save')return;
    const old={...choice};for(const input of dialog.querySelectorAll('input'))choice[input.name]=input.checked;
    try{localStorage.setItem(key,JSON.stringify({version:1,at:Date.now(),choices:choice}));}catch{}
    hasSavedChoice=true;
    dialog.close();
    if((old.analytics&&!choice.analytics)||(!googleAdvertisingConsent&&old.ads&&!choice.ads)){
      window['ga-disable-G-933HR3MDFY']=true;
      for(const cookie of document.cookie.split(';')){const name=cookie.split('=')[0].trim();if(/^(_ga|_gid|_gat|_gcl)/.test(name))for(const domain of ['',location.hostname,'.'+location.hostname,'.drmcourses.com'])document.cookie=name+'=; Max-Age=0; path=/'+(domain?'; domain='+domain:'');}
      location.reload();return;
    }
    activate();
  });
  document.addEventListener('click',event=>{
    const adSettings=event.target.closest('[data-ad-privacy]');
    if(adSettings){
      event.preventDefault();
      if(typeof window.googlefc?.showRevocationMessage==='function')window.googlefc.showRevocationMessage();
      else {const status=document.querySelector('[data-ad-status]');if(status)status.textContent='Google advertising settings are not available here yet. This may depend on your location or a blocked Google service.';}
      return;
    }
    if(event.target.closest('[data-cookie-settings]')){event.preventDefault();open();}});
  window.addEventListener('storage',event=>{if(event.key===key)location.reload();});
  new MutationObserver(()=>videos()).observe(document.body,{childList:true,subtree:true});
  activate();if(!saved)open();
})();
