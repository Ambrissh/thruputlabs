"""Build the authored blog index and article pages from Markdown and post metadata."""
from pathlib import Path
from html import escape
from datetime import date
import re,json,hashlib
from site_components import terminal_html,terminal_style,terminal_script,SITE_ORIGIN,brand_html
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
ORIGIN=SITE_ORIGIN
POSTS=json.loads((ROOT/'content/blog/posts.json').read_text())

def inline(value):
    return re.sub(r'\[([^\]]+)\]\((https://[^\s)]+)\)',r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>',escape(value))

def article_body(text):
    body=[];contents=[]
    for block in text.split('\n\n'):
        if block.startswith('## '):
            heading=block[3:];anchor=re.sub('[^a-z0-9]+','-',heading.lower()).strip('-')
            body.append(f'<h2 id="{anchor}">{escape(heading)}</h2>');contents.append((anchor,heading))
        elif block.startswith('> '):body.append('<blockquote><p>'+inline(block[2:])+'</p></blockquote>')
        else:body.append('<p>'+inline(block.replace('\n',' '))+'</p>')
    return ''.join(body),contents

def nav(prefix=''):
    mark=brand_html(prefix)
    return f'<header class="editorial-nav">{mark}<nav aria-label="Main navigation"><a href="{prefix}index.html#about">Services</a><a href="{prefix}case-studies.html">Case studies</a><a href="{prefix}blog.html" aria-current="page">Blog</a><a class="nav-contact" href="#contact">Let’s talk</a></nav></header>'

def asset(name,prefix=''):return prefix+name+'?v='+hashlib.sha256((DIST/name).read_bytes()).hexdigest()[:10]

def head(title,description,url,kind='article',prefix=''):
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11130f"><title>{escape(title)} | Thruput Labs</title><meta name="description" content="{escape(description)}"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:type" content="{kind}"><meta property="og:url" content="{url}"><link rel="canonical" href="{url}"><link rel="stylesheet" href="{asset("editorial.css",prefix)}"><link rel="stylesheet" href="{asset("blog.css",prefix)}">{terminal_style(prefix)}'

def footer(prefix=''):
    return f'<footer class="editorial-footer"><a href="#contact">Let’s talk about your business.</a><span>Thruput Labs · Written by Ambrissh</span></footer>{terminal_html()}{terminal_script(prefix)}<script src="{asset("smooth-scroll.js",prefix)}"></script><script src="{asset("blog.js",prefix)}" defer></script></body></html>'

cards=[]
for post in POSTS:
    slug=post['slug'];source=(ROOT/'content/blog'/f'{slug}.md').read_text();lines=source.splitlines()
    title=lines[0][2:];text='\n'.join(lines[4:]).strip();body,contents=article_body(text)
    display_date=date.fromisoformat(post['date']).strftime('%-d %B %Y');url=ORIGIN+'/blog/'+slug+'.html'
    schema={'@context':'https://schema.org','@type':'BlogPosting','@id':url+'#article','headline':title,'description':post['description'],'datePublished':post['date'],'dateModified':post['date'],'author':{'@type':'Person','@id':ORIGIN+'/#ambrissh','name':'Ambrissh'},'publisher':{'@type':'Organization','@id':ORIGIN+'/#organization','name':'Thruput Labs'},'inLanguage':'en','url':url,'mainEntityOfPage':{'@type':'WebPage','@id':url+'#page'},'wordCount':len(text.split())}
    html=head(title,post['description'],url,prefix='../')+'<meta name="author" content="Ambrissh"><script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False)+'</script></head><body id="top" class="editorial-page blog-document"><a class="skip-case" href="#article-body">Skip to article</a>'+nav('../')
    html+=f'<main><header class="blog-intro"><a class="blog-back" href="../blog.html">All writing</a><p class="blog-category">{escape(post["category"])}</p><h1>{escape(title)}</h1><p class="blog-deck">{escape(post["deck"])}</p><div class="blog-byline"><span>Written by <strong>Ambrissh</strong></span><time datetime="{post["date"]}">{display_date}</time></div></header><div class="blog-layout"><aside class="blog-contents"><p>In this article</p><nav aria-label="Article contents">'+''.join(f'<a href="#{a}">{escape(h)}</a>' for a,h in contents)+'</nav></aside><article class="blog-copy" id="article-body">'+body+'</article></div></main>'+footer('../')
    (DIST/'blog').mkdir(exist_ok=True);(DIST/'blog'/f'{slug}.html').write_text(html)
    artwork='<div class="blog-cover-grid" aria-hidden="true">'+''.join('<i></i>' for _ in range(48))+'</div>'
    if post['coverClass']=='supermarket':
        artwork='<svg class="market-basket" viewBox="0 0 300 250" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5"><path d="M35 98h230l-25 116H60zM88 98l38-70M212 98l-38-70M102 127l8 59M150 127v59M198 127l-8 59"/></g></svg><div class="market-barcode" aria-hidden="true">'+''.join('<i></i>' for _ in range(28))+'</div>'
    cover_title='<br>'.join(escape(part) for part in post['coverTitle'])
    cards.append(f'<a class="blog-card" href="blog/{slug}.html"><div class="blog-cover blog-cover-{post["coverClass"]}" aria-hidden="true"><span>{escape(post["category"])}</span><strong>{cover_title}</strong><span>{escape(post["coverLabel"])}</span>{artwork}</div><div class="blog-card-copy"><p class="blog-category">{escape(post["category"])} · By Ambrissh</p><h2>{escape(title)}</h2><p>{escape(post["excerpt"])}</p><span class="blog-read">Click to read more</span></div></a>')
    print(f'Built {slug}: {len(text.split())} words, by Ambrissh.')

listing_description='Writing by Ambrissh on building a service agency and using AI for SEO and GEO. The ideas and practical decisions behind Thruput Labs.'
listing=head('Blog',listing_description,ORIGIN+'/blog.html','website')+'</head><body id="top" class="editorial-page blog-index"><a class="skip-case" href="#writing">Skip to writing</a>'+nav()
listing+='<main id="writing"><div class="writing-title"><h1>Blog</h1></div><div class="writing-grid">'+''.join(cards)+'</div></main>'+footer()
(DIST/'blog.html').write_text(listing)
