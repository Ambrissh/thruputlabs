"""Check the technical search metadata, crawl paths and readable document structure."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
ORIGIN=json.loads((ROOT/'content/site.json').read_text())['origin'].rstrip('/')
class Document(HTMLParser):
 def __init__(self):
  super().__init__();self.meta={};self.canon=[];self.h1=[];self.current_h1=None;self.schemas=[];self.script=None;self.ids=set();self.links=[];self.home=[];self.wordmarks=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.add(a['id'])
  if tag=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content','')
  if tag=='link' and a.get('rel')=='canonical':self.canon.append(a.get('href'))
  if tag=='h1':self.current_h1=''
  if tag=='a' and a.get('href'):self.links.append(a['href'])
  if tag=='a' and a.get('aria-label')=='Thruput Labs home':self.home.append(a.get('href',''))
  if tag=='img' and 'brand-wordmark' in a.get('class','').split():self.wordmarks.append(a)
  if tag=='script' and a.get('type')=='application/ld+json':self.script=''
 def handle_data(self,data):
  if self.current_h1 is not None:self.current_h1+=data
  if self.script is not None:self.script+=data
 def handle_endtag(self,tag):
  if tag=='h1' and self.current_h1 is not None:self.h1.append(self.current_h1.strip());self.current_h1=None
  if tag=='script' and self.script is not None:self.schemas.append(json.loads(self.script));self.script=None
pages={}
for path in DIST.rglob('*.html'):
 page=Document();page.feed(path.read_text());pages[path.resolve()]=page
 expected=ORIGIN+('/' if path.name=='index.html' else '/'+path.relative_to(DIST).as_posix())
 assert page.canon==[expected],f'Missing or conflicting canonical: {path.name}'
 assert len(page.h1)==1 and page.h1[0],f'Page needs one readable text heading: {path.name}'
 assert len(page.home)==1 and len(page.wordmarks)==1,f'Page needs one home wordmark: {path.name}'
 assert (path.parent/urlsplit(page.home[0]).path).resolve()==(DIST/'index.html').resolve() and urlsplit(page.home[0]).fragment=='top',f'Wordmark should link home: {path.name}'
 assert page.wordmarks[0].get('alt')=='Thruput Labs' and (path.parent/page.wordmarks[0]['src']).resolve().is_file(),f'Missing wordmark asset: {path.name}'
 assert 75<=len(page.meta.get('description',''))<=210,f'Missing or thin description: {path.name}'
 for key in ['og:title','og:description','og:type','og:image','twitter:card']:
  assert page.meta.get(key),f'Missing {key}: {path.name}'
 assert page.schemas,f'Missing structured data: {path.name}'
 assert 'noindex' not in page.meta.get('robots',''),f'Unexpected source noindex: {path.name}'
 if path.parent.name=='blog':
  article_schema=next(d for d in page.schemas if d.get('@type')=='BlogPosting')
  assert article_schema['publisher']['@id']==ORIGIN+'/#organization'
  assert article_schema['mainEntityOfPage']['@id']==expected+'#page'
  assert article_schema['@id']==expected+'#article' and article_schema['wordCount']>0
 for data in page.schemas:
  assert 'AggregateRating' not in json.dumps(data) and '"Review"' not in json.dumps(data),'Unverified ratings or reviews must not be marked up'
 image=urlsplit(page.meta['og:image']);assert image.scheme=='https' and (DIST/unquote(image.path.lstrip('/'))).is_file()
for path,page in pages.items():
 for value in page.links:
  link=urlsplit(value)
  if link.scheme or link.netloc or not link.fragment:continue
  target=(path.parent/unquote(link.path)).resolve() if link.path else path
  if target in pages:assert unquote(link.fragment) in pages[target].ids,f'Broken fragment: {path.name} -> {value}'
locations=[node.text for node in ET.parse(DIST/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert sorted(locations)==sorted(p.canon[0] for p in pages.values()),'Sitemap should list each canonical document once'
robots=(DIST/'robots.txt').read_text();assert 'Disallow: /\n' not in robots and 'Sitemap: '+ORIGIN+'/sitemap.xml' in robots
home=(DIST/'index.html').read_text()
assert '<a href="#about" data-page="services">Services</a>' in home,'Services needs a no-JavaScript link'
article=(ROOT/'content/blog/ai-seo-geo-workflow.md').read_text().strip()
assert article.endswith('?') and 'vibe coding' in article.lower() and 'AI-native development' in article
print(f'PASS: {len(pages)} canonical pages, readable headings, descriptions, social cards, schema, sitemap, crawl directives and internal fragment links. AI-native article ends with a question.')
