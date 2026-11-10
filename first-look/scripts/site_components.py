"""Shared terminal contact markup and cache-busted assets for every static page."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
SITE=json.loads((ROOT/'content/site.json').read_text())
SITE_ORIGIN=SITE['origin'].rstrip('/')

def asset_url(name,prefix=''):
    digest=hashlib.sha256((DIST/name).read_bytes()).hexdigest()[:10]
    return prefix+name+'?v='+digest

def terminal_html():
    return (ROOT/'content/partials/contact.html').read_text().strip()

def terminal_style(prefix=''):
    return f'<link rel="stylesheet" href="{asset_url("contact.css",prefix)}">'

def terminal_script(prefix=''):
    return f'<script src="{asset_url("contact.js",prefix)}" defer></script>'


def brand_html(prefix=''):
    return f'<a class="brand" href="{prefix}index.html#top" aria-label="Thruput Labs home"><img class="brand-wordmark" src="{prefix}assets/brand/wordmark.svg" alt="Thruput Labs" width="138" height="30" decoding="async"></a>'
