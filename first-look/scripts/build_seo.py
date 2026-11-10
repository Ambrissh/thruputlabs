"""Apply consistent, evidence-based metadata and crawl documents to the static site."""
from pathlib import Path
from html import escape,unescape
from urllib.parse import urlsplit
import json,re,hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
SITE=json.loads((ROOT/'content/site.json').read_text());ORIGIN=SITE['origin'].rstrip('/')
CASES=json.loads((ROOT/'content/case-studies.json').read_text());POSTS=json.loads((ROOT/'content/blog/posts.json').read_text())
IMAGE=ORIGIN+'/assets/brand/thruput-social.png'
TITLES={
 'blog/ai-seo-geo-workflow.html':'AI-Native SEO & GEO: The Vibe Coding Analogy | Thruput Labs',
 'blog/supermarket-theory-of-building-an-agency.html':'The Supermarket Analogy for Agencies | Thruput Labs',
 'case-studies/surprise-bros.html':'Surprise Bro’s Workflow Automation Case Study | Thruput Labs',
 'case-studies/ayini-boutique.html':'Ayini Boutique Local SEO Case Study | Thruput Labs',
 'case-studies/sigaram-physio.html':'Sigaram Physio SEO & GEO Case Study | Thruput Labs',
 'case-studies/pk-tex.html':'PK TEX Catalogue Website Case Study | Thruput Labs',
 'case-studies/ps4-gaming-lounge.html':'PS4 Gaming Lounge Website Case Study | Thruput Labs'
}
DESCRIPTIONS={
 'index.html':'Thruput Labs builds custom workflows, automation and software, with SEO, GEO and AEO services that start with your business and test against real search evidence.',
 'case-studies.html':'Explore Thruput Labs case studies in custom workflows, websites and SEO/GEO, including Surprise Bro’s, Ayini Boutique, Sigaram Physio, PK TEX and PS4 Gaming Lounge.',
 'case-studies/surprise-bros.html':'How Thruput Labs connected billing, client events, attendance and salary records in one Surprise Bro’s workspace, with role-based access and familiar forms.',
 'case-studies/ayini-boutique.html':'Ayini Boutique case study: local service pages for Thanjavur, collection and navigation improvements, search setup and an AI-discovery roadmap by Thruput Labs.',
 'case-studies/sigaram-physio.html':'Sigaram Physio case study: local SEO, GEO foundations, service pages, Google Business Profile work, tracking and English–Tamil access by Thruput Labs.',
 'case-studies/pk-tex.html':'PK TEX website case study: a saree catalogue, product details and product-specific WhatsApp enquiries, delivered for ₹4,000 by Thruput Labs.',
 'case-studies/ps4-gaming-lounge.html':'Thruput Labs built PS4 Gaming Lounge’s website for ₹4,000, bringing games, offers, pricing and booking information into one Thanjavur venue website.'
}
logo='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#11130f"/><path d="M14 14h36v9H37v29H27V23H14z" fill="#d6d2bc"/></svg>'
(DIST/'assets/brand/favicon.svg').write_text(logo)
org={'@type':'Organization','@id':ORIGIN+'/#organization','name':SITE['name'],'url':ORIGIN+'/','logo':{'@type':'ImageObject','url':ORIGIN+'/assets/brand/wordmark.svg'},'description':SITE['description']}
website={'@type':'WebSite','@id':ORIGIN+'/#website','url':ORIGIN+'/','name':SITE['name'],'publisher':{'@id':org['@id']},'inLanguage':SITE['language']}
locations=[]
for path in sorted(DIST.rglob('*.html')):
 relative=path.relative_to(DIST).as_posix();html=path.read_text();prefix='../'*len(path.relative_to(DIST).parts[:-1])
 canonical=ORIGIN+('/' if relative=='index.html' else '/'+relative);locations.append(canonical)
 title=unescape(re.search(r'<title>(.*?)</title>',html,re.S).group(1)).strip()
 if relative=='index.html':title='Thruput Labs | Workflows, Custom Software & SEO/GEO'
 title=TITLES.get(relative,title)
 description=DESCRIPTIONS.get(relative)
 if not description:
  match=re.search(r'<meta name="description" content="([^"]*)"',html);description=unescape(match.group(1))
 html=re.sub(r'<title>.*?</title>',lambda m:'<title>'+escape(title)+'</title>',html,count=1,flags=re.S)
 head_end=html.index('</head>');head=html[:head_end];body=html[head_end:]
 head=re.sub(r'<meta\b[^>]*(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+)"[^>]*>','',head)
 head=re.sub(r'<link\b[^>]*rel="(?:canonical|icon)"[^>]*>','',head)
 head=re.sub(r'<link[^>]+href="[^"]*brand.css[^"]*"[^>]*>','',head)
 head=re.sub(r'<script\b(?=[^>]*id="site-schema")[^>]*>.*?</script>','',head,flags=re.S)
 graph=[org,website]
 page_type='CollectionPage' if relative in ['blog.html','case-studies.html'] else 'WebPage'
 page={'@type':page_type,'@id':canonical+'#page','url':canonical,'name':title.split(' | ')[0],'description':description,'isPartOf':{'@id':website['@id']},'publisher':{'@id':org['@id']},'inLanguage':SITE['language'],'primaryImageOfPage':{'@type':'ImageObject','url':IMAGE}}
 crumbs=[]
 if relative=='index.html':
  services=[('Workflow automation','Automations that connect repetitive steps in your business.'),('Connected tools','Forms, spreadsheets and existing tools working together.'),('Custom software','Websites, dashboards and internal tools built around the job.'),('SEO, GEO & AEO','Technical and content audits, useful answers and recorded search and AI-citation checks.')]
  page['mainEntity']=[{'@type':'Service','name':name,'description':text,'provider':{'@id':org['@id']},'url':ORIGIN+'/#about'} for name,text in services]
 elif relative=='case-studies.html':
  page['mainEntity']={'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':c['brand'],'url':ORIGIN+'/case-studies/'+c['slug']+'.html'} for i,c in enumerate(CASES)]}
  crumbs=[('Home',ORIGIN+'/'),('Case studies',canonical)]
 elif relative.startswith('case-studies/'):
  case=next(c for c in CASES if relative.endswith('/'+c['slug']+'.html'))
  page['mainEntity']={'@type':'CreativeWork','headline':case['title'],'description':case['lead'],'url':canonical,'creator':{'@id':org['@id']},'about':{'@type':'Organization','name':case['brand']},'image':ORIGIN+'/assets/case-studies/'+case['image']}
  crumbs=[('Home',ORIGIN+'/'),('Case studies',ORIGIN+'/case-studies.html'),(case['brand'],canonical)]
 elif relative=='blog.html':
  page['mainEntity']={'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':(ROOT/'content/blog'/f'{post["slug"]}.md').read_text().splitlines()[0][2:],'url':ORIGIN+'/blog/'+post['slug']+'.html'} for i,post in enumerate(POSTS)]}
  crumbs=[('Home',ORIGIN+'/'),('Blog',canonical)]
 elif relative.startswith('blog/'):
  page['mainEntity']={'@id':canonical+'#article'}
  crumbs=[('Home',ORIGIN+'/'),('Blog',ORIGIN+'/blog.html'),(page['name'],canonical)]
  def article_image(match):
   data=json.loads(match.group(1))
   if data.get('@type')=='BlogPosting':data['image']=[IMAGE]
   return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False)+'</script>'
  head=re.sub(r'<script type="application/ld\+json">(.*?)</script>',article_image,head,flags=re.S)
 graph.append(page)
 if crumbs:
  breadcrumb={'@type':'BreadcrumbList','@id':canonical+'#breadcrumbs','itemListElement':[{'@type':'ListItem','position':i+1,'name':name,'item':url} for i,(name,url) in enumerate(crumbs)]};graph.append(breadcrumb);page['breadcrumb']={'@id':breadcrumb['@id']}
 tags=[f'<link rel="stylesheet" href="{prefix}brand.css">',f'<meta name="description" content="{escape(description)}">',f'<link rel="canonical" href="{canonical}">',f'<link rel="icon" href="{prefix}assets/brand/favicon.svg" type="image/svg+xml">','<meta name="robots" content="index,follow,max-image-preview:large">']
 properties={'og:title':title,'og:description':description,'og:url':canonical,'og:type':'article' if relative.startswith('blog/') else 'website','og:site_name':SITE['name'],'og:image':IMAGE,'og:image:type':'image/png','og:image:width':'1200','og:image:height':'630','og:image:alt':'Thruput Labs. Workflow automation, custom software, SEO, GEO and AEO.'}
 tags.extend(f'<meta property="{key}" content="{escape(value)}">' for key,value in properties.items())
 tags.extend(f'<meta name="{key}" content="{escape(value)}">' for key,value in {'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':IMAGE}.items())
 tags.append('<script type="application/ld+json" id="site-schema">'+json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)+'</script>')
 html=head.rstrip()+'\n'+''.join(tags)+body
 def refresh_asset(match):
  source=urlsplit(match.group(2))
  if source.scheme or source.netloc or not source.path.endswith(('.css','.js')):return match.group(0)
  asset=(path.parent/source.path).resolve()
  if not asset.is_file():return match.group(0)
  return match.group(1)+source.path+'?v='+hashlib.sha256(asset.read_bytes()).hexdigest()[:10]+match.group(3)
 html=re.sub(r'((?:src|href)=")([^"]+)(")',refresh_asset,html)
 path.write_text(html)
ET.register_namespace('','http://www.sitemaps.org/schemas/sitemap/0.9')
root=ET.Element('{http://www.sitemaps.org/schemas/sitemap/0.9}urlset')
for location in sorted(set(locations)):
 item=ET.SubElement(root,'{http://www.sitemaps.org/schemas/sitemap/0.9}url');ET.SubElement(item,'{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text=location
ET.indent(root);ET.ElementTree(root).write(DIST/'sitemap.xml',encoding='utf-8',xml_declaration=True)
(DIST/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+ORIGIN+'/sitemap.xml\n')
print(f'Applied canonical metadata, social cards and structured data to {len(locations)} pages. Built sitemap, robots.txt and favicon.')
