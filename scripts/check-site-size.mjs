import fs from 'node:fs';
import path from 'node:path';
function bytes(dir){return fs.readdirSync(dir,{withFileTypes:true}).reduce((n,e)=>n+(e.isDirectory()?bytes(path.join(dir,e.name)):fs.statSync(path.join(dir,e.name)).size),0);}
const total=bytes('dist'),limit=1_000_000_000,warning=800_000_000;
const report={publishedBytes:total,limitBytes:limit,remainingBytes:limit-total,percentUsed:Math.round(total/limit*1000)/10};
fs.writeFileSync('content/deployment-size.json',JSON.stringify(report,null,2)+'\n');
console.log(`Published site: ${(total/1e6).toFixed(1)} MB / 1000 MB (${report.percentUsed}%).`);
if(total>=limit){console.error('Site exceeds the conservative 1 GB deployment budget. Move media to external hosting before publishing.');process.exit(1);}
if(total>=warning)console.warn('Site is above 80% of the deployment budget; plan external image hosting.');
