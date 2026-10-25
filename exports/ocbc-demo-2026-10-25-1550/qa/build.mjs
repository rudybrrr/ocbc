import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const root = path.resolve(import.meta.dirname, '..');
const skill = 'C:/Users/kandy/.codex/plugins/cache/openai-primary-runtime/presentations/26.1024.11018/skills/presentations';
const python = 'C:/Users/kandy/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const entries = [
 ['01-problem-login.png',1,'Problem','Fresh login','The same customer can want speed for familiar tasks and explanation for unfamiliar ones.'],
 ['02-customer-choice.png',2,'Customer control','Setup: Standard selected','Support starts with a choice made by the customer.'],
 ['03a-readability.png',3,'Preferences','Setup: text size','Readability is chosen by the customer. This capture preserves the saved Default choice.'],
 ['03b-calm-home.png',3,'Calm Home','Home after Set up later','Setup can be postponed. Home shows essentials and the everyday-language entry.'],
 ['04a-payment-request.png',4,'Familiar task','Home: pay Mum 10 typed','The request prepares a supported task. It does not send money.'],
 ['04b-payment-details.png',4,'Payment draft','Mum and S$10 resolved','The recipient and amount are ready for the customer to inspect. The optional related offer was dismissed.'],
 ['04c-payment-review.png',4,'Customer review','Review payment before confirmation','The customer checks recipient, amount and account. No confirmation was made during this capture.'],
 ['05a-journey-choice.png',5,'Unfamiliar task','Invest: guidance choice','The same customer can choose guidance for this journey. Overall preferences stay the same.'],
 ['05b-guided-terms.png',5,'Help for this task','Invest: Key terms, step 2 of 6','Plain-language process guidance. No product, investment amount or allocation is selected.'],
 ['06-validation-context.png',6,'Contribution and validation','Reused journey-choice capture','Visual context only: no validation page exists. Improved understanding and efficiency remain hypotheses. Propose testing completion, errors, comprehension and perceived control.'],
 ['07-customer-control.png',7,'Closing','Reused journey-choice capture','Adapt support to the task while leaving the decision with the customer.'],
].map(([file,beat,title,state,note],index)=>({slide:index+1,file,beat,title,state,note}));
await fs.writeFile(path.join(root,'manifest.json'), JSON.stringify({captured:'2026-10-25',source:'http://localhost:3000/',viewport:{width:1600,height:900},slides:entries,limitations:['Static screenshots; UI elements are not editable and web animations do not play.','Payment receipt omitted to preserve practice transaction records.','Validation and closing intentionally reuse a real guidance-choice capture.','Concept mockup See what changes is not implemented and is excluded.']},null,2));
const deck = Presentation.create({slideSize:{width:1600,height:900}});
await fs.mkdir(path.join(root,'deliverables'),{recursive:true});
for(const item of entries){
 const slide=deck.slides.add();
 slide.images.add({blob:new Uint8Array(await fs.readFile(path.join(root,'png',item.file))),contentType:'image/png',alt:`${item.title}: ${item.state}`,fit:'contain',position:{left:0,top:0,width:1600,height:900}});
 slide.speakerNotes.text=`Pitch beat ${item.beat} - ${item.title}\n${item.note}\nActual UI screenshot: ${item.file}\nSource: http://localhost:3000/ (25 October 2026). Speaking-flow reference: pitch-notes-adaptive-assist.md.\nStatic capture: no live web interaction or animation.`;
 const blob=await deck.export({slide,format:'png',scale:1});
 await fs.writeFile(path.join(root,'qa',`slide-${String(item.slide).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const candidate=path.join(root,'qa','candidate.pptx');
await (await PresentationFile.exportPptx(deck)).save(candidate);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(root,'deliverables','ocbc-demo.pptx'),pythonExecutable:python,integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500'],explicitTotalSlideCount:entries.length,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],verifyArtifactToolImport:true,receiptPath:path.join(root,'qa','validation.json')});
console.log(JSON.stringify(result));
