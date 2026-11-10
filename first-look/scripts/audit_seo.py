"""Write a reproducible source inventory; it does not assert live indexing or rankings."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from collections import Counter,deque
import json,csv
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';OUT=ROOT/'docs'
class Page(HTMLParser):
 def __init__(s):super().__init__();s.title='';s.h1=[];s.meta={};s.links=[];s.images=[];s.hidden=0;s.head=False;s.in_title=False;s.in_h1=False;s.words=[];s.schemas=[];s.script=None;s.canonical='';s.meta_counts=Counter();s.main=0
 def handle_starttag(s,t,attrs):
  a=dict(attrs)
  if t in ['script','style','svg','template']:s.hidden+=1
  if t=='head':s.head=True
  if t=='title':s.in_title=True
  if t=='h1':s.in_h1=True;s.h1.append('')
  if t=='main':s.main+=1
  if t=='meta':key=a.get('name',a.get('property',''));s.meta[key]=a.get('content','');s.meta_counts[key]+=1
  if t=='link' and a.get('rel')=='canonical':s.canonical=a['href']
  if t=='a' and a.get('href'):s.links.append(a['href'])
  if t=='img':s.images.append(a)
  if t=='script' and a.get('type')=='application/ld+json':s.script=''
 def handle_data(s,d):
  if s.in_title:s.title+=d
  if s.in_h1:s.h1[-1]+=d
  if not s.hidden and not s.head:s.words.extend(d.split())
  if s.script is not None:s.script+=d
 def handle_endtag(s,t):
  if t in ['script','style','svg','template']:s.hidden=max(0,s.hidden-1)
  if t=='head':s.head=False
  if t=='title':s.in_title=False
  if t=='h1':s.in_h1=False
  if t=='script' and s.script is not None:s.schemas.append(json.loads(s.script));s.script=None
pages={}
for f in sorted(DIST.rglob('*.html')):
 p=Page();p.feed(f.read_text());pages[f.relative_to(DIST).as_posix()]=p
inbound=Counter();graph={k:set() for k in pages}
for name,p in pages.items():
 for value in p.links:
  u=urlsplit(value)
  if u.scheme or u.netloc:continue
  target=(DIST/name).parent/unquote(u.path) if u.path else DIST/name
  target=target.resolve()
  if target.is_dir():target/= 'index.html'
  try:rel=target.relative_to(DIST.resolve()).as_posix()
  except ValueError:continue
  if rel in pages and rel!=name:graph[name].add(rel)
 for rel in graph[name]:inbound[rel]+=1
seen=set();queue=deque(['index.html'])
while queue:
 name=queue.popleft()
 if name in seen:continue
 seen.add(name);queue.extend(graph[name]-seen)
assert len(seen)==len(pages),'Unreachable static document'
assert len({p.title for p in pages.values()})==len(pages),'Duplicate titles'
assert len({p.meta['description'] for p in pages.values()})==len(pages),'Duplicate descriptions'
rows=[]
for name,p in pages.items():
 assert p.main==1 and len(p.h1)==1 and p.h1[0].strip(),name
 assert not any(n>1 for k,n in p.meta_counts.items() if k in ['description','robots','og:title','og:url']),name
 assert all('alt' in im and all(im.get(k,'').isdigit() and int(im[k])>0 for k in ['width','height']) for im in p.images),name
 rows.append({'page':name,'title':p.title,'title_characters':len(p.title),'description':p.meta['description'],'description_characters':len(p.meta['description']),'h1':p.h1[0].strip(),'body_words_excluding_templates':len(p.words),'images':len(p.images),'image_dimensions_missing':sum(not all(k in im for k in ['width','height']) for im in p.images),'inbound_pages':inbound[name],'reachable_from_home':name in seen,'canonical':p.canonical,'source_robots':p.meta.get('robots','')})
with (OUT/'seo-page-inventory.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator="\n");w.writeheader();w.writerows(rows)
(OUT/'seo-source-inventory.json').write_text(json.dumps({'scope':'Source checks; not a public search/indexing test','pages':rows,'internal_graph':{k:sorted(v) for k,v in graph.items()}},indent=2)+'\n')
print(f'PASS: {len(pages)} reachable pages, unique titles/descriptions, one main/H1, no duplicate metadata and image dimensions throughout. Wrote page inventory.')
