import fs from 'node:fs';
const base='https://www.youtube.com/@Dr.M.Courses';
const headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'};
const videos=new Map(); const report=[];
function walk(o,fn){if(!o||typeof o!=='object')return;fn(o);for(const v of Object.values(o))walk(v,fn)}
for(const tab of ['videos','shorts','streams']){
 const page=await fetch(`${base}/${tab}?hl=en`,{headers});if(!page.ok)throw Error('YouTube page '+page.status);const html=await page.text();
 const match=html.match(/var ytInitialData = (.*?);<\/script>/s); if(!match)throw Error('Cannot parse '+tab);
 let data=JSON.parse(match[1]);let pages=0; const seen=new Set();
 const tabs=data.contents?.twoColumnBrowseResultsRenderer?.tabs||[];
 const selected=tabs.find(t=>t.tabRenderer?.selected)?.tabRenderer;
 if(!selected?.endpoint?.commandMetadata?.webCommandMetadata?.url?.endsWith('/'+tab)){report.push({tab,status:'No public tab',pages:0});console.log(report.at(-1));continue}
 data=selected.content;
 const context=JSON.parse(html.match(/ytcfg.set\(({.*?})\);/s)[1]).INNERTUBE_CONTEXT;
 while(data){let token;walk(data,o=>{
  const l=o.lockupViewModel;if(l?.contentType==='LOCKUP_CONTENT_TYPE_VIDEO')videos.set(l.contentId,{id:l.contentId,title:l.metadata?.lockupMetadataViewModel?.title?.content||'',duration:l.contentImage?.thumbnailViewModel?.overlays?.[0]?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text||'',kind:tab});
  const v=o.videoRenderer||o.gridVideoRenderer;if(v?.videoId)videos.set(v.videoId,{id:v.videoId,title:v.title?.runs?.map(x=>x.text).join('')||v.title?.simpleText||'',duration:v.lengthText?.simpleText||'',published:v.publishedTimeText?.simpleText||'',kind:tab});
  const s=o.shortsLockupViewModel;if(s){const id=s.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId;if(id)videos.set(id,{id,title:s.overlayMetadata?.primaryText?.content||'Short lecture',duration:'Short',kind:tab})}
  if(o.continuationItemRenderer&&!token)token=o.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token;
 });pages++;if(!token)break;if(seen.has(token))throw Error('Repeated continuation');seen.add(token);
 const response=await fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({context,continuation:token})});if(!response.ok)throw Error('YouTube '+response.status);data=await response.json();if(data.error)throw Error(JSON.stringify(data.error));if(!data.onResponseReceivedActions&&!data.onResponseReceivedEndpoints)throw Error('Unexpected continuation response');
 }report.push({tab,pages,totalSoFar:videos.size});console.log(report.at(-1));
}
fs.writeFileSync('channel-catalog.json',JSON.stringify({channel:base,syncedAt:new Date().toISOString(),report,videos:[...videos.values()]},null,2));
