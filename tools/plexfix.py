"""Replace Thmanyah font wording with IBM Plex Sans Arabic on the doc boards."""
import os, re, sys

P = os.path.join(sys.argv[1], 'canvas', 'project')

def edit(name, subs):
    path = os.path.join(P, name)
    t = open(path, encoding='utf-8').read()
    for pat, rep in subs:
        t2 = re.sub(pat, rep, t, count=1, flags=re.S)
        if t2 == t:
            print('NO MATCH', name, pat[:60])
        t = t2
    open(path, 'w', encoding='utf-8', newline='').write(t)

edit('System.dc.html', [
    (r'<h2 class="h2">Thmanyah, by language</h2></div><p class="p" style="max-width:520px">.*?</p>',
     '<h2 class="h2">IBM Plex Sans Arabic, by language</h2></div><p class="p" style="max-width:520px">One family for every Arabic heading and paragraph — bold for titles, regular for text. Taqbaylit uses Inter, because Plex has no ɛ or ɣ.</p>'),
    (r'Display · Thmanyah Sans 46/1.35 · 700', 'Display · Plex Sans Arabic 40/1.45 · 700'),
    (r'Section · Thmanyah Sans 24 · 700', 'Section · Plex Sans Arabic 24 · 700'),
    (r'<span class="h3">How the fonts load</span><p class="p">.*?</p>',
     '<span class="h3">Why IBM Plex Sans Arabic</span><p class="p">Chosen after comparing 14 Arabic sans families against the headline style you liked on thmanyah.com: crisp, modern and slightly calligraphic, very legible on phones, with weights from 100 to 700. Open licence (SIL OFL), free on Google Fonts, so it can be self-hosted on the site with no restrictions.</p>'),
    (r'<span class="h3">Licence notes \(check before launch\)</span><p class="p">.*?</p>',
     '<span class="h3">Pairing rules</span><p class="p">Arabic: Plex Sans Arabic 700 for titles, 600 for card titles and buttons, 400 for text. Latin and Taqbaylit: Inter at the same weights — it contains every Kabyle letter. Digits, durations and dates use Inter with tabular figures in both languages.</p>'),
])

edit('UX.dc.html', [
    (r'<strong>Calm, typographic UI</strong> in the Thmanyah typefaces;', '<strong>Calm, typographic UI</strong> in IBM Plex Sans Arabic;'),
    (r'<span class="kick">Typeface · as requested</span>\s*<h2 class="h2" style="font-size:26px">Thmanyah \(خط ثمانية\)</h2>',
     '<span class="kick">Typeface · decided</span>\n      <h2 class="h2" style="font-size:26px">IBM Plex Sans Arabic</h2>'),
    (r'<span class="ar" style="font-size:16px;line-height:1.9;color:#5B635F">العناوين والنصوص: .*?</span>',
     '<span class="ar" style="font-size:16px;line-height:1.9;color:#5B635F">خطّ واحد للعناوين والنصوص: عريض للعناوين، وعادي للقراءة.</span>'),
    (r'<p class="p" style="font-size:14px">Thmanyah offers its fonts free.*?</p>',
     '<p class="p" style="font-size:14px">We first tried Thmanyah’s typeface; its licence forbids re-hosting the files, so it could not be shown here. After comparing 14 Arabic sans families against Thmanyah’s headline style, <strong style="color:#111614">IBM Plex Sans Arabic</strong> was the closest — and you chose to keep it. It is open-licence (SIL OFL) and free to self-host.</p>'),
    (r'<p class="p" style="font-size:14px">Taqbaylit text stays in Inter: .*?</p>',
     '<p class="p" style="font-size:14px">Taqbaylit text uses Inter, which contains every Kabyle letter (ɛ ɣ ḍ ḥ ṛ ṣ ṭ ẓ č ǧ).</p>'),
])

edit('Main.dc.html', [
    (r'built for watching and the Thmanyah typefaces\.', 'built for watching, set in IBM Plex Sans Arabic.'),
    (r'(Round 2 — “Change the font to Thmanyah\.”</span><p class="p">).*?</p>',
     r'\1<strong style="color:#1D2522">v3:</strong> Thmanyah’s licence forbids re-hosting its font, so it could not be used on the canvas. After comparing 14 Arabic sans families against its headline style, IBM Plex Sans Arabic was the closest; in round 3 you chose to keep it. It is now the single font for all Arabic text.</p>'),
])
print('done')
