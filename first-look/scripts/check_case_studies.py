"""Check generated portfolio pages, local links, captions, and image references."""
from pathlib import Path
from html.parser import HTMLParser
from html import unescape
from urllib.parse import urlsplit,unquote
from collections import Counter
import json
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
class Page(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.links=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:self.ids.append(attrs['id'])
        if tag in ('img','script','link','a'):
            value=attrs.get('src') or attrs.get('href')
            if value:self.links.append(value)
for path in DIST.rglob('*.html'):
    html=path.read_text()
    assert html.count('id="contact-form"')==1,f'Every page needs one terminal contact form: {path.name}'
    assert html.count('contact.css')==1 and html.count('contact.js')==1,f'Terminal assets missing or duplicated: {path.name}'
    assert all(f'id="contact-{field}"' in html for field in ['name','email','project']),f'All three contact fields must be present: {path.name}'
    assert 'id="top"' in html,f'Terminal back-to-top target is missing: {path.name}'
    if path.name!='index.html':assert 'href="#contact"' in html,f'Page should link to its own contact terminal: {path.name}'
    page=Page();page.feed(html)
    assert not [key for key,count in Counter(page.ids).items() if count>1],f'Duplicate ID in {path.name}'
    for value in page.links:
        url=urlsplit(value)
        if url.scheme or url.netloc or not url.path:continue
        assert (path.parent/unquote(url.path)).resolve().exists(),f'Missing asset or page: {path.name} -> {value}'
data=json.loads((ROOT/'content/case-studies.json').read_text())
home=(DIST/'index.html').read_text()
gallery=(DIST/'case-studies.html').read_text()
assert len(data)==5 and gallery.count('class="case-orbit"')==5
assert 'data-page="work"' not in home and 'data-page="aeo"' not in home
assert 'id="case-studies"' not in home and 'id="case-detail-dialog"' not in home
assert 'cases.js' not in home and 'cases.css' not in home
assert 'href="case-studies.html"' in home and 'href="blog.html"' in home
assert 'class="case-card-copy"' not in gallery and 'case-selected' not in gallery
assert gallery.count('class="case-tile"')==5
assert 'id="case-detail-dialog"' in gallery and 'Close ×' not in gallery
assert gallery.count('<template id="case-template-')==5
assert "services:'about'" in (DIST/'app.js').read_text()
assert 'Written by <strong>Ambrissh</strong>' in (DIST/'blog/ai-seo-geo-workflow.html').read_text()
for case in data:
    page=(DIST/'case-studies'/f'{case["slug"]}.html').read_text()
    assert case['lead'] in unescape(page)
    assert all((DIST/'assets/case-studies'/section['image']).exists() for section in case['sections'] if section.get('image'))

assert '<h1 id="case-studies-title" class="case-gallery-title">Case studies</h1>' in gallery
assert gallery.count('Click to read more')==10 and gallery.count('class="poster-description"')==10
for slug,price in [('sigaram-physio','₹2,500'),('pk-tex','₹4,000'),('ps4-gaming-lounge','₹4,000')]:
    assert f'<strong>{price}</strong>' in (DIST/'case-studies'/f'{slug}.html').read_text()
    assert f'id="case-template-{slug}"' in gallery
assert gallery.count('class="case-project-fee"')==3
posts=json.loads((ROOT/'content/blog/posts.json').read_text())
assert len(posts)==2
for post in posts:
    article=(DIST/'blog'/f'{post["slug"]}.html').read_text()
    assert 'Written by <strong>Ambrissh</strong>' in article
    schema=json.loads(article.split('<script type="application/ld+json">')[1].split('</script>')[0])
    assert schema['author']['name']=='Ambrissh' and schema['description']==post['description']
    assert schema['url'].endswith('/blog/'+post['slug']+'.html')
listing=(DIST/'blog.html').read_text()
assert listing.count('class="blog-card"')==2 and listing.count('Click to read more')==2
assert 'On useful software' not in listing and 'Thoughts<br>from the lab.' not in listing

print('PASS: separate five-project gallery, project card copy, three project fees, on-page stories, two authored blogs, metadata, a terminal contact on all 10 pages, and local links.')
