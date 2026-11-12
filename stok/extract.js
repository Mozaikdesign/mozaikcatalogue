// helper loaded by run_script via readFile + eval
async function extract(part, start, budget){
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const O=pdfjs.OPS;const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
  const t0=Date.now();const meta=[];
  const b=await readFileBinary('stok/part'+part+'.pdf');const doc=await pdfjs.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise;
  let pn=start;
  const one=async(pn)=>{
    const page=await doc.getPage(pn);const ops=await page.getOperatorList();let ctm=[1,0,0,1,0,0];const st=[];let best=null;
    ops.fnArray.forEach((fn,i)=>{const a=ops.argsArray[i];if(fn===O.save)st.push(ctm);else if(fn===O.restore)ctm=st.pop()||ctm;else if(fn===O.transform)ctm=mul(ctm,a);else if(fn===O.paintImageXObject){const w=Math.abs(ctm[0])+Math.abs(ctm[2]),h=Math.abs(ctm[1])+Math.abs(ctm[3]);if(!best||w*h>best.a)best={n:a[0],a:w*h}}});
    if(!best||best.a<15000){meta.push({p:pn,img:null});return}
    const store=best.n.startsWith('g_')?page.commonObjs:page.objs;const o=await Promise.race([new Promise(r=>store.get(best.n,r)),new Promise(r=>setTimeout(()=>r(null),1500))]);if(!o||!o.bitmap){meta.push({p:pn,img:null});return}
    const k=Math.min(1,900/o.width);const W=Math.round(o.width*k),H=Math.round(o.height*k);const c=createCanvas(W,H);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.drawImage(o.bitmap,0,0,W,H);
    const bl=await c.convertToBlob({type:'image/jpeg',quality:0.82});const nm='s'+part+'-'+String(pn).padStart(3,'0')+'.jpg';await saveFile('stok/img/'+nm,bl);meta.push({p:pn,img:nm,w:o.width,h:o.height});
  };
  while(pn<=doc.numPages&&Date.now()-t0<budget){const batch=[];for(let k=0;k<6&&pn<=doc.numPages;k++,pn++)batch.push(one(pn));await Promise.all(batch);}
  await saveFile('stok/meta'+part+'-'+start+'.json',JSON.stringify(meta));
  return {next:pn,total:doc.numPages,ms:Date.now()-t0};
}
