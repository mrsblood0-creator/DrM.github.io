import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
function scenario(saved){
 const scripts=[],events={},storage=new Map(saved?[['drm-consent-v1',JSON.stringify(saved)]]:[]);
 const inputs=['analytics','ads','videos'].map(name=>({name,checked:false}));
 const dialog={open:false,setAttribute(){},querySelector(){return {};},querySelectorAll(){return inputs;},showModal(){this.open=true;},close(){this.open=false;},addEventListener(name,fn){this[name]=fn;}};
 let reloads=0;
 const context={console,URL,Date,Event:class{constructor(type){this.type=type;}},MutationObserver:class{observe(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{protocol:'https:',hostname:'www.drmcourses.com',href:'https://www.drmcourses.com/',reload(){reloads++;}},document:{cookie:'',title:'Dr M',head:{append:s=>scripts.push(s),appendChild:s=>scripts.push(s)},body:{append(){}},createElement:tag=>tag==='dialog'?dialog:{},querySelectorAll:()=>[],getElementById:()=>null,addEventListener(){}},addEventListener:(name,fn)=>(events[name]??=[]).push(fn),dispatchEvent:e=>(events[e.type]||[]).forEach(fn=>fn())};context.window=context;
 vm.createContext(context);for(const p of ['consent.js','analytics.js'])vm.runInContext(fs.readFileSync(p,'utf8'),context);
 const choose=action=>dialog.click({target:{dataset:{choice:action}}});return {scripts,dialog,inputs,choose,context,get reloads(){return reloads;}};
}
let x=scenario();assert.equal(x.scripts.length,0);assert(x.dialog.open);x.choose('reject');assert.equal(x.scripts.length,0);
x=scenario();x.inputs[0].checked=true;x.choose('save');assert.equal(x.scripts.length,1);assert(x.scripts[0].src.includes('googletagmanager'));x.context.drmConsent.open();x.choose('reject');assert.equal(x.reloads,1);
x=scenario();x.choose('accept');assert.equal(x.scripts.length,2);x.choose('accept');assert.equal(x.scripts.length,2);
x=scenario({version:1,at:Date.now(),choices:{analytics:false,ads:false,videos:false}});assert.equal(x.scripts.length,0);assert(!x.dialog.open);
x=scenario({version:1,at:0,choices:{analytics:true,ads:true,videos:true}});assert.equal(x.scripts.length,0);assert(x.dialog.open);
for(const p of ['index.html','scripts/build-seo.mjs','academy.js']){const text=fs.readFileSync(p,'utf8');assert(!/<script[^>]+src="https:\/\/pagead2/.test(text));assert(!/<iframe[^>]+\ssrc="https:\/\/www.youtube/.test(text));}
console.log('PASS: default blocking, rejection, granular choice, acceptance, revocation reload, saved/expired choices, no unconditional ad/video embeds.');
