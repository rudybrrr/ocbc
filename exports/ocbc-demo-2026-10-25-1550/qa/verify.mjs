import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'..');
const deck=await PresentationFile.importPptx(await FileBlob.load(path.join(root,'deliverables','ocbc-demo.pptx')));
if(deck.slides.items.length!==11)throw new Error('Wrong slide count');
for (const [index,slide] of deck.slides.items.entries()) {
 const blob=await deck.export({slide,format:'png',scale:1});
 await fs.writeFile(path.join(root,'qa',`final-${String(index+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
console.log('Final PPTX re-imported and all 11 slides rendered.');
