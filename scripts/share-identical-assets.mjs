import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve('.'),dist=path.join(root,'dist');let count=0,saved=0;
folders: for(const folder of ['slide-assets','images','video-frames']){
 const directory=path.join(dist,folder);if(!fs.existsSync(directory))continue;
 for(const name of fs.readdirSync(directory)){
  const target=path.resolve(directory,name),source=path.resolve(root,folder,name);
  if(path.dirname(target)!==directory||!fs.existsSync(source)||!fs.statSync(target).isFile()||!fs.statSync(source).isFile())continue;
  const a=fs.statSync(source),b=fs.statSync(target);if(a.ino===b.ino&&a.dev===b.dev)continue;
  if(a.size!==b.size)continue;
  const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(hash(source)!==hash(target))continue;
  const temporary=target+'.hardlink-tmp';
  // Create the shared file first; only replace a verified byte-identical copy.
  try { fs.linkSync(source,temporary); }
  catch(error) {
    if(['EPERM','EACCES','EXDEV','ENOTSUP'].includes(error.code)) {
      console.warn('Hard links unavailable in this environment; retaining valid independent copies.');
      break folders;
    }
    throw error;
  }
  fs.unlinkSync(target);fs.renameSync(temporary,target);count++;saved+=b.size;
 }
}
console.log(`Shared ${count} identical assets using hard links; ${(saved/1e6).toFixed(1)} MB of duplicate disk storage removed.`);
