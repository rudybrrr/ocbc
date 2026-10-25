import json
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'manifest.json').read_text())
pdf = canvas.Canvas(str(root / 'ocbc-demo.pdf'), pagesize=(960,540))
pdf.setTitle('OCBC Adaptive Assist - actual demo screens')
pdf.setAuthor('OCBC demo export')
for entry in manifest['slides']:
    image = root / 'png' / entry['file']
    with Image.open(image) as im:
        assert im.size == (1600,900), (image, im.size)
    pdf.drawImage(ImageReader(str(image)),0,0,width=960,height=540)
    pdf.showPage()
pdf.save()
assert len(PdfReader(root / 'ocbc-demo.pdf').pages) == len(manifest['slides'])
sheet = Image.new('RGB',(1280, len(manifest['slides'])//3*270+270),'#eeeeec')
draw = ImageDraw.Draw(sheet)
for i,e in enumerate(manifest['slides']):
    im=Image.open(root/'png'/e['file']).convert('RGB')
    im.thumbnail((410,231))
    x=(i%3)*425+5; y=(i//3)*270+24
    sheet.paste(im,(x,y))
    draw.text((x,y-18),f"{i+1:02d} - {e['title']}",fill='#222222')
sheet.save(root/'qa'/'contact-sheet.png')
lines=['# OCBC demo screen export','', 'Captured 25 October 2026 from the running local app at http://localhost:3000/. All pages use the existing presentation layout, at 1600 x 900 (16:9), with no browser chrome.','', 'Open [PowerPoint](deliverables/ocbc-demo.pptx) for 11 slides with brief speaker notes, or [PDF](ocbc-demo.pdf) for the same 11 static pages. The png folder contains the ordered image source of truth. [PNG ZIP](ocbc-demo-pngs.zip) contains those images plus this index and the manifest.','', '| Slide | Pitch beat | PNG | Actual state |','| --- | --- | --- | --- |']
for e in manifest['slides']:
    lines.append(f"| {e['slide']} | {e['beat']} - {e['title']} | [{e['file']}](png/{e['file']}) | {e['state']} |")
lines += ['', 'The seven speaking beats expand into 11 screen captures. Beats 6 and 7 intentionally reuse the journey-choice capture: the app has no standalone validation or closing page. Use the notes in the PowerPoint or the project pitch brief for the spoken argument.','', 'Login was observed first on the fresh load. Its first Login press opened setup. Set up later opened Calm Home. Saved preferences and banking records were not cleared. The export preserves the saved Default text size and Standard global assistance mode. The walkthrough selected journey guidance and advanced local learning progress to Key terms; no payment confirmation or banking transaction was performed.','', 'The screenshot-based PowerPoint is editable as slide images and notes, not as individual UI elements. PDF and PNG are static; animations, voice, and interactions do not play. The optional receipt is omitted to preserve practice transactions. The generated See what changes concept is excluded because it is not implemented.','', 'Capture QA: the optional helper bubble was dismissed and slide 6 recaptured so Next is visible. The existing closed Penny control slightly overlaps the practice disclaimer on slide 7; this is present in the actual app and has been preserved rather than retouched. Amount, recipient, account and confirmation control remain readable. Home is shown in two real scroll positions: essentials first, then the typed intent entry.','', 'Validation: all 11 image dimensions and PDF pages checked; every rendered presentation slide visually inspected; PPTX package, geometry and first-party re-import checks pass with 11 slides. PowerPoint desktop was not used to inspect the file.','', 'Source flow: ../../pitch-notes-adaptive-assist.md. Main captures follow its explicit slide-to-screen map.']
(root/'README.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f"PDF verified: {len(manifest['slides'])} pages")
