// usage in run_script: eval(await readFile('stok/roda-add.js')); await addRoda(coll, designer, storyTr, storyEn, items)
// items: [code, cat, tags, imgFile, cfgTr, cfgEn, dimsTr, dimsEn, covTr, covEn]
async function addRoda(coll, designer, stTr, stEn, items){
  const U = 'https://www.rodaonline.com/wp-content/uploads/';
  let h = await readFile('Mozaik Catalogue v2.html');
  let prod = '', media = '', n = 0;
  for (const [code, cat, tags, img, cTr, cEn, dTr, dEn, kTr, kEn] of items){
    const id = 'rd-' + coll.toLowerCase().replace(/\s+/g,'-') + '-' + code;
    if (h.includes('id:"' + id + '"')) continue;
    prod += `  { id:${JSON.stringify(id)}, brand:"Roda", name:${JSON.stringify(coll + ' ' + code)}, designer:${JSON.stringify(designer)}, year:"", cat:"${cat}", tags:${JSON.stringify(tags)}, image:${JSON.stringify(U + img)},\n    story:{ tr:${JSON.stringify(stTr)}, en:${JSON.stringify(stEn)} },\n    config:{ tr:${JSON.stringify(cTr)}, en:${JSON.stringify(cEn)} },\n    covers:{ tr:${JSON.stringify(kTr)}, en:${JSON.stringify(kEn)} },\n    dims:{ tr:${JSON.stringify('cm · ' + dTr)}, en:${JSON.stringify('cm · ' + dEn)} } },\n\n`;
    media += `  ${JSON.stringify(id)}: { photos: ${JSON.stringify([U + img])}, drawings: [] },\n`;
    n++;
  }
  const a = '  /* NB-START */'; if (!h.includes(a)) throw 'anchor';
  h = h.replace(a, prod + a);
  const mi = h.indexOf('{ photos: [', h.indexOf('const MEDIA')); const ls = h.lastIndexOf('\n', mi) + 1;
  h = h.slice(0, ls) + media + h.slice(ls);
  await saveFile('Mozaik Catalogue v2.html', h); await saveFile('index.html', h); await saveFile('upload/index.html', h);
  return n;
}
