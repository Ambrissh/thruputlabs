"""Build static, shareable case studies and the dedicated gallery from one content file."""
from pathlib import Path
from html import escape as e
import json,re,hashlib
from site_components import terminal_html,terminal_style,terminal_script,brand_html
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist';DIMENSIONS=json.loads((ROOT/'content/image-dimensions.json').read_text());DATA=json.loads((ROOT/'content/case-studies.json').read_text())

def image(name,alt,**attrs):
    attrs={'width':DIMENSIONS[name][0],'height':DIMENSIONS[name][1],**attrs}
    extra=' '.join(f'{key.replace("_","-")}="{e(str(value))}"' for key,value in attrs.items())
    return f'<img src="../assets/case-studies/{e(name)}" alt="{e(alt)}" {extra}>'

def project_fee(case):
    amount=case.get('projectFee')
    if amount is None:return ''
    return f'<div class="case-project-fee"><span>{e(case.get("projectFeeLabel","Project fee"))}</span><strong>₹{amount:,}</strong></div>'

def blocks(case):
    out=[]
    for section in case['sections']:
        out.append(f'<section class="case-chapter"><h2>{e(section["title"])}</h2><div class="case-chapter-copy">')
        out.extend(f'<p>{e(text)}</p>' for text in section.get('text',[]))
        if section.get('items'):
            out.append('<dl class="case-deliverables">')
            out.extend(f'<div><dt>{e(title)}</dt><dd>{e(text)}</dd></div>' for title,text in section['items'])
            out.append('</dl>')
        out.append('</div>')
        if section.get('image'):out.append('<figure class="case-inline-image'+(' is-contain' if section.get('imageFit')=='contain' else '')+'">'+image(section['image'],section['imageAlt'],loading='lazy',decoding='async')+'</figure>')
        out.append('</section>')
    return ''.join(out)

home=(DIST/'index.html').read_text()
brand=brand_html('../')
for index,case in enumerate(DATA):
    next_case=DATA[(index+1)%len(DATA)]
    facts=''.join(f'<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>' for a,b in case['facts'])
    html=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#141513"><title>{e(case['brand'])} case study | Thruput Labs</title><meta name="description" content="{e(case['line'])}"><link rel="stylesheet" href="../cases.css?v={hashlib.sha256((DIST/'cases.css').read_bytes()).hexdigest()[:10]}">{terminal_style("../")}</head><body id="top" class="case-document"><a class="skip-case" href="#case-content">Skip to case study</a><header class="case-page-nav">{brand}<a href="../case-studies.html">All case studies</a><a href="../index.html#about">Services</a><a class="case-nav-contact" href="#contact">Let’s talk</a></header><main id="case-content"><div class="case-article-intro"><p class="case-category">{e(case['category'])}</p><p class="case-client">{e(case['brand'])}</p><h1>{e(case['title'])}</h1>{project_fee(case)}<p class="case-lead">{e(case['lead'])}</p></div><figure class="case-article-cover is-{e(case['fit'])}">{image(case['image'],case['imageAlt'],fetchpriority='high',decoding='async')}{'<figcaption>'+e(case['imageNote'])+'</figcaption>' if case.get('imageNote') else ''}</figure><dl class="case-facts">{facts}</dl><article class="case-article-body">{blocks(case)}</article><div class="case-project-link"><a href="{e(case['website'])}" target="_blank" rel="noopener noreferrer">{e(case['websiteLabel'])} ↗</a></div><section class="case-next"><p>Next case study</p><a href="{e(next_case['slug'])}.html"><span>{e(next_case['brand'])}</span><span aria-hidden="true">↗</span></a><p>{e(next_case['line'])}</p></section><footer class="case-page-footer"><a href="#contact">Have a project? Let’s talk.</a><a href="../case-studies.html">Back to all case studies</a></footer>{terminal_html()}</main>{terminal_script("../")}<script src="../smooth-scroll.js"></script><script src="../cases.js?v={hashlib.sha256((DIST/'cases.js').read_bytes()).hexdigest()[:10]}" defer></script></body></html>'''
    (DIST/'case-studies'/f'{case["slug"]}.html').write_text(html)

# A separate gallery keeps the home page focused on the studio and its services.
root_brand=brand_html()
cards=[];tiles=[];templates=[]
for case in DATA:
    slug=e(case['slug']);brand_name=e(case['brand']);line=e(case['line'])
    trigger=f'data-case-open="{slug}" aria-label="Read the {brand_name} case study" aria-haspopup="dialog" aria-controls="case-detail-dialog"'
    headline='<br>'.join(e(part) for part in case['cardTitle'])
    description=e(case['cardDescription'])
    visual=f'<div class="case-cover poster-{slug}" aria-hidden="true"><div class="poster-art"><span class="poster-brand">{brand_name}</span><span class="poster-head">{headline}</span><img src="assets/case-studies/{e(case["image"])}" alt="" width="{DIMENSIONS[case['image']][0]}" height="{DIMENSIONS[case['image']][1]}" loading="eager" decoding="async"></div><div class="poster-footer"><span class="poster-description">{description}</span><span class="poster-read">Click to read more</span></div></div>'
    cards.append(f'<article class="case-orbit" data-slug="{slug}" data-brand="{brand_name}" data-line="{line}"><a class="case-face case-front" href="case-studies/{slug}.html" {trigger}>{visual}</a></article>')
    tiles.append(f'<a class="case-tile" href="case-studies/{slug}.html" {trigger}>{visual}</a>')
    facts=''.join(f'<div><dt>{e(a)}</dt><dd>{e(b)}</dd></div>' for a,b in case['facts'])
    body=blocks(case).replace('../assets/','assets/').replace('<h2>','<h3>').replace('</h2>','</h3>')
    cover=image(case['image'],case['imageAlt'],loading='lazy',decoding='async').replace('../assets/','assets/')
    templates.append(f'<template id="case-template-{slug}"><div class="case-article-intro"><p class="case-category">{e(case["category"])}</p><p class="case-client">{brand_name}</p><h2 class="case-detail-title" id="case-title-{slug}">{e(case["title"])}</h2>{project_fee(case)}<p class="case-lead">{e(case["lead"])}</p></div><figure class="case-article-cover is-{e(case["fit"])}">{cover}</figure><dl class="case-facts">{facts}</dl><article class="case-article-body">{body}</article><div class="case-project-link"><a href="{e(case["website"])}" target="_blank" rel="noopener noreferrer">{e(case["websiteLabel"])}</a></div></template>')
section='''<main class="case-section" id="case-studies" aria-labelledby="case-studies-title">
<h1 id="case-studies-title" class="case-gallery-title">Case studies</h1><div class="case-intro"><div class="case-stage">
<div class="case-window" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Case studies. Drag to spin, use left and right arrow keys, or press Enter to open the front project."><div class="case-ring">'''+''.join(cards)+'''</div></div>
<button class="case-motion" type="button" data-case-pause aria-pressed="false">Pause motion</button><p class="sr-only" data-case-status aria-live="polite"></p></div></div>
<div class="case-thumbnails" id="case-projects"><h2 class="sr-only">All case studies</h2><div class="case-grid">'''+''.join(tiles)+'''</div></div>
</main>'''
modal='''<dialog class="case-modal" id="case-detail-dialog" data-lenis-prevent><div class="case-modal-bar"><span data-case-modal-brand></span><button type="button" data-case-close aria-label="Close case study">Close</button></div><div class="case-modal-content"></div></dialog>'''+''.join(templates)
def asset(name):return name+'?v='+hashlib.sha256((DIST/name).read_bytes()).hexdigest()[:10]
nav=f'<header class="editorial-nav">{root_brand}<nav aria-label="Main navigation"><a href="index.html#about">Services</a><a href="case-studies.html" aria-current="page">Case studies</a><a href="blog.html">Blog</a><a class="nav-contact" href="#contact">Let’s talk</a></nav></header>'
gallery=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11130f"><title>Case studies | Thruput Labs</title><meta name="description" content="Explore the websites, custom workflows and search foundations built by Thruput Labs. A closer look at five businesses and the work behind them."><link rel="stylesheet" href="{asset('editorial.css')}"><link rel="stylesheet" href="{asset('cases.css')}">{terminal_style()}</head><body id="top" class="editorial-page case-gallery-document"><a class="skip-case" href="#case-projects">Skip motion and explore projects</a>{nav}{section}{terminal_html()}{modal}{terminal_script()}<script src="{asset('smooth-scroll.js')}"></script><script src="{asset('cases.js')}" defer></script></body></html>'''
(DIST/'case-studies.html').write_text(gallery)
home=re.sub(r'<!-- CASE STUDIES START -->.*?<!-- CASE STUDIES END -->\s*','',home,flags=re.S)
home=re.sub(r'<!-- CASE DETAILS START -->.*?<!-- CASE DETAILS END -->\s*','',home,flags=re.S)
home=re.sub(r'<link[^>]+href="cases.css[^"<]*"[^>]*>','',home)
home=re.sub(r'<script[^>]+src="cases.js[^"<]*"[^>]*></script>\s*','',home)
home=re.sub(r'<dialog(?=[^>]*id="page-dialog")[^>]*>.*?</dialog>','',home,flags=re.S)
home=home.replace('<button data-page="services">Services</button>','<a href="#about" data-page="services">Services</a>')
home=home.replace('<button data-page="cases">Case studies</button>','<a href="case-studies.html">Case studies</a>').replace('<button data-page="blog">Blog</button>','<a href="blog.html">Blog</a>')
home=home.replace('<button data-page="work">Work</button>','').replace('<button data-page="aeo">AEO</button>','')
for name in ['app.js','smooth-scroll.js','sections.css','style.css']:
    home=re.sub(r'('+re.escape(name)+r')(?:\?v=[^"\s]+)?',lambda m:asset(name),home)
home=re.sub(r'<section class="contact-section".*?</section>',lambda m:terminal_html(),home,flags=re.S)
for name in ['contact.css','contact.js']:
    home=re.sub(r'('+re.escape(name)+r')(?:\?v=[^"\s]+)?',lambda m:asset(name),home)
(DIST/'index.html').write_text(home)
print(f'Built {len(DATA)} case studies and a separate full-screen gallery.')
