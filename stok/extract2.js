// helper loaded by run_script via readFile + eval
async function extract2(part, start, budget){
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const O=pdfjs.OPS;const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
  const t0=Date.now();const meta=[];const cls=(bm)=>{const c=createCanvas(48,48);const x=c.getContext('2d');x.drawImage(bm,0,0,48,48);const d=x.getImageData(0,0,48,48).data;let w=0,sat=0;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(r>232&&g>232&&b>232)w++;sat+=Math.max(r,g,b)-Math.min(r,g,b)}return {w:w/2304,s:sat/2304}};
  const b=await readFileBinary('stok/part'+part+'.pdf');const doc=await pdfjs.getDocument({data:new Uint8Array(await b.arrayBuffer())}).promise;
  let pn=start;
  const one=async(pn)=>{
    const page=await doc.getPage(pn);const ops=await page.getOperatorList();let ctm=[1,0,0,1,0,0];const st=[];const all=[];
    ops.fnArray.forEach((fn,i)=>{const a=ops.argsArray[i];if(fn===O.save)st.push(ctm);else if(fn===O.restore)ctm=st.pop()||ctm;else if(fn===O.transform)ctm=mul(ctm,a);else if(fn===O.paintImageXObject){const w=Math.abs(ctm[0])+Math.abs(ctm[2]),h=Math.abs(ctm[1])+Math.abs(ctm[3]);all.push({n:a[0],a:w*h,w,h,y:ctm[5]})}});
    all.sort((a,b)=>b.a-a.a);const seen=new Set();const extra=[];let k=0;
    for(const im of all.slice(1)){if(im.a<45000||im.y<60||im.w<180||seen.has(im.n))continue;seen.add(im.n);
      const store=im.n.startsWith('g_')?page.commonObjs:page.objs;const o=await Promise.race([new Promise(r=>store.get(im.n,r)),new Promise(r=>setTimeout(()=>r(null),1500))]);if(!o||!o.bitmap)continue;
      const q=cls(o.bitmap);if((q.w>0.8&&q.s<12)||(q.s<3&&q.w>0.4))continue;
      k++;const kk=Math.min(1,900/o.width);const W=Math.round(o.width*kk),H=Math.round(o.height*kk);const c=createCanvas(W,H);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.drawImage(o.bitmap,0,0,W,H);
      const bl=await c.convertToBlob({type:'image/jpeg',quality:0.82});const nm='s'+part+'-'+String(pn).padStart(3,'0')+'-'+k+'.jpg';await saveFile('stok/img2/'+nm,bl);extra.push({nm,w:Math.round(q.w*100),s:Math.round(q.s)});}
    meta.push({p:pn,extra});
  };
  while(pn<=doc.numPages&&Date.now()-t0<budget){const batch=[];for(let k=0;k<6&&pn<=doc.numPages;k++,pn++)batch.push(one(pn));await Promise.all(batch);}
  await saveFile('stok/x'+part+'-'+start+'.json',JSON.stringify(meta));
  return {next:pn,total:doc.numPages,ms:Date.now()-t0};
}
