import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
const root=process.cwd(),entries=[],hashes=new Map(),aliases=new Map();
for(const dir of ['.','DrM.github.io']){
 if(!fs.existsSync(dir))continue;
 for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.html')).sort()){
  if(dir==='.'&&['index.html','channel.html'].includes(name))continue;
  const file=path.posix.join(dir,name),raw=fs.readFileSync(file,'utf8');
  const hash=crypto.createHash('sha256').update(raw.replace(/\r\n/g,'\n').trim()).digest('hex');
  let entry=hashes.get(hash);
  if(!entry){entry={id:'original-'+hash.slice(0,16),title:name.replace(/\.html$/i,'').replace('legacy-home','Original homepage'),files:[],raw,html:'',empty:!raw.trim()};entries.push(entry);hashes.set(hash,entry)}
  entry.files.push(file);aliases.set(file.toLowerCase(),entry.id);
 }
}
const escape=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const missingAssets=[];
for(const entry of entries){const file=entry.files[0];let body=entry.raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]??entry.raw;
 body=body.replace(/<head\b[\s\S]*?<\/head>/gi,'').replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<!--[^]*?-->/g,'');
 body=body.replace(/<iframe\b[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>/gi,(_,url)=>`<p><a href="${escape(url.replace('/embed/','/watch?v='))}" target="_blank" rel="noopener">Watch the video linked in this article ↗</a></p>`);
 body=body.replace(/\b(src|href)\s*=\s*(["'])(.*?)\2/gi,(match,attr,quote,value)=>{
  if(!value||/^(https?:|mailto:|tel:|data:|#)/i.test(value))return match;
  let decoded;try{decoded=decodeURIComponent(value.split('#')[0])}catch{return match}
  const relative=path.posix.normalize(path.posix.join(path.posix.dirname(file),decoded));
  if(attr.toLowerCase()==='href'){
   const friendly={'orthopedics.html':'orthopedic courses.html','pharmacology.html':'pharmacology courses.html'};
   const target=decoded.toLowerCase()==='index.html'?(aliases.get(path.posix.join(path.posix.dirname(file),'index.html').toLowerCase())||aliases.get('legacy-home.html')):aliases.get(relative.toLowerCase())||aliases.get(friendly[decoded.toLowerCase()]);
   if(target)return `href="#article/${target}" data-article-link="true"`;
   return match;
  }
  const resolved=path.resolve(root,relative);if(!resolved.startsWith(root+path.sep))return '';
  if(fs.existsSync(resolved)){const ext=path.extname(resolved).toLowerCase(),mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.webp':'image/webp'}[ext];if(mime)return `src="data:${mime};base64,${fs.readFileSync(resolved).toString('base64')}"`}
  missingAssets.push({file,asset:value});return match;
 });
 // The iframe sandbox disables all source scripts and inline event handlers.
 body=body.replace(/<a\b([^>]*data-article-link="true"[^>]*)>/gi,(_,attrs)=>`<a ${attrs.replace(/\btarget\s*=\s*["'][^"']*["']/gi,'')} target="_parent">`);
 entry.html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:15px/1.8 system-ui,sans-serif;color:#183e3b;margin:0;padding:12px;overflow-wrap:anywhere}h1{font-size:25px}h2{font-size:21px;margin-top:28px}h3{font-size:18px}a{color:#237b63}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%;display:block;overflow:auto}td,th{border:1px solid #dce5dd;padding:10px;text-align:left}nav ul,.main-nav ul{display:flex;flex-wrap:wrap;gap:18px;list-style:none;padding:0}header,footer{border-bottom:1px solid #e0e7e3;padding:10px 0}.logo img{max-height:55px;width:auto}li{margin-bottom:5px}</style></head><body>'+ (entry.empty?'<p>This original file is empty; no written content was supplied.</p>':body)+'</body></html>';
 entry.searchText=body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();delete entry.raw;
}
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('library-data.js','utf8'),ctx);const data=ctx.window.LIBRARY;
data.articles=entries;
for(const v of data.videos)if(v.source)v.originalArticleId=aliases.get(v.source.toLowerCase());
fs.writeFileSync('library-data.js','window.LIBRARY = '+JSON.stringify(data)+';\n');
fs.writeFileSync('original-content-audit.json',JSON.stringify({sourceFiles:[...aliases.keys()].length,uniqueArticles:entries.length,emptyFiles:entries.filter(e=>e.empty).flatMap(e=>e.files),missingAssets,articles:entries.map(({id,title,files,empty})=>({id,title,files,empty}))},null,2));
console.log(`Preserved ${aliases.size} original HTML files in ${entries.length} deduplicated entries; ${missingAssets.length} pre-existing missing image references.`);
