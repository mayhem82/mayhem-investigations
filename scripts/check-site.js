'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const vm = require('vm');
const { ROOT } = require('./case-registry');
const { verifyPreserved } = require('./preservation');

function walk(dir, prefix='') {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(['.git','node_modules','__pycache__'].includes(entry.name))return [];
    const rel=prefix+entry.name;
    return entry.isDirectory()?walk(path.join(dir,entry.name),rel+'/'):[rel];
  });
}
const errors=[];
const counts={json:0,javascript:0,archives:0,html:0};
for(const file of walk(ROOT)){
  const full=path.join(ROOT,file);
  if(file.endsWith('.json')){counts.json++;try{JSON.parse(fs.readFileSync(full,'utf8'));}catch(e){errors.push(file+': '+e.message);}}
  if(file.endsWith('.js')){
    counts.javascript++;
    const result=cp.spawnSync(process.execPath,['--check',full],{encoding:'utf8'});
    if(result.status!==0)errors.push(file+': '+result.stderr);
  }
  if(file.includes('/source-archive/')){
    counts.archives++;
    const error=verifyPreserved(ROOT,file,path.basename(file).split('.')[0]);
    if(error)errors.push(file+': '+error);
  }
  if(file.endsWith('.html')&&!/(^preserved\/|\/preserved\/|\/source-archive\/)/.test(file)){
    counts.html++;
    const source=fs.readFileSync(full,'utf8');
    for(const match of source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)){
      const ref=match[1];
      if(/^(?:[a-z]+:|\/\/|#|\?)/i.test(ref)||/[{}<>]/.test(ref))continue;
      const url=new URL(ref,'https://audit.invalid/mayhem-investigations/'+file);
      if(!url.pathname.startsWith('/mayhem-investigations/'))continue;
      const target=decodeURIComponent(url.pathname.slice('/mayhem-investigations/'.length));
      if(!fs.existsSync(path.join(ROOT,target)))errors.push(file+': missing target '+ref);
    }
    for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      if(/\bsrc=|type=["'](?:module|application\/ld\+json)/i.test(match[1]))continue;
      try{new vm.Script(match[2],{filename:file});}catch(e){errors.push(file+': '+e.message);}
    }
  }
}
console.log(JSON.stringify({counts,errors},null,2));
process.exitCode=errors.length?1:0;
