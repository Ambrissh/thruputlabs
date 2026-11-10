"""Outline the wordmark and generate a deterministic, sandblasted metal surface.
Requires fontTools for authoring only; the website ships a standalone SVG.
"""
from pathlib import Path
from random import Random
from math import hypot
from fontTools.ttLib import TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.basePen import BasePen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
FONT = Path('/System/Library/Fonts/HelveticaNeue.ttc')
font = TTCollection(FONT).fonts[9]  # Helvetica Neue Condensed Black
chars = font.getBestCmap()
glyphs = font.getGlyphSet()
rng = Random(37)

class ContourPen(BasePen):
    def __init__(self, glyphset):
        super().__init__(glyphset)
        self.contours=[]
        self.points=[]
    def _moveTo(self,p):
        self.points=[p]
    def _lineTo(self,p):
        self.points.append(p)
    def _curveToOne(self,a,b,c):
        start=self.points[-1]
        for i in range(1,17):
            t=i/16;u=1-t
            self.points.append((u**3*start[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t**3*c[0],u**3*start[1]+3*u*u*t*a[1]+3*u*t*t*b[1]+t**3*c[1]))
    def _qCurveToOne(self,a,b):
        start=self.points[-1]
        for i in range(1,13):
            t=i/12;u=1-t
            self.points.append((u*u*start[0]+2*u*t*a[0]+t*t*b[0],u*u*start[1]+2*u*t*a[1]+t*t*b[1]))
    def _closePath(self):
        if self.points:self.contours.append(self.points)
    def _endPath(self):
        self._closePath()

cursor=0
entries=[]
placements=[]
bounds=[]
contours=[]
for ch in 'Thruput labs':
    name=chars[ord(ch)];glyph=glyphs[name]
    placements.append((name,cursor))
    path=SVGPathPen(glyphs);glyph.draw(path)
    box=BoundsPen(glyphs);glyph.draw(box)
    pen=ContourPen(glyphs);glyph.draw(pen)
    if box.bounds:
        x0,y0,x1,y1=box.bounds
        bounds.append((x0+cursor,y0,x1+cursor,y1))
        entries.append(f'<path transform="translate({cursor} 0)" d="{path.getCommands()}"/>')
    contours.extend([[(x+cursor,y) for x,y in contour] for contour in pen.contours])
    cursor+=font['hmtx'][name][0]-25
xmin=min(b[0] for b in bounds);xmax=max(b[2] for b in bounds)
ymin=min(b[1] for b in bounds);ymax=max(b[3] for b in bounds)
scale=1510/(xmax-xmin)
height=(ymax-ymin)*scale
view_height=round(height+72)
ox=36-xmin*scale
baseline=35+ymax*scale
outlined=[]
for name,x in placements:
    pen=SVGPathPen(glyphs)
    transform=TransformPen(pen,(scale,0,0,-scale,ox+x*scale,baseline))
    glyphs[name].draw(transform)
    outlined.append(pen.getCommands())
outline='<path id="titanium-type" d="'+''.join(outlined)+'"/>'

contours=[[(ox+x*scale,baseline-y*scale) for x,y in points] for points in contours if len(points)>3]

# Small paired highlights and shadows make the surface read as granular metal.
grain=[]
for i in range(2200):
    x=rng.uniform(0,71);y=rng.uniform(0,67);r=rng.uniform(.3,.92)
    dark=i%2==0
    color='#292d24' if dark else '#e0e3d3'
    alpha=rng.uniform(.3,.62) if dark else rng.uniform(.25,.65)
    grain.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{color}" opacity="{alpha:.2f}"/>')
    if dark and i%4==0:
        grain.append(f'<circle cx="{x-.38:.2f}" cy="{y-.4:.2f}" r="{r*.46:.2f}" fill="#d9d3c7" opacity=".45"/>')
# The edge cloud follows the actual letter contours rather than a rectangular field.
dust=[]
for i in range(1400):
    points=rng.choice(contours);j=rng.randrange(len(points));x,y=points[j]
    before=points[(j-1)%len(points)];after=points[(j+1)%len(points)]
    dx=after[0]-before[0];dy=after[1]-before[1];length=max(.001,hypot(dx,dy))
    distance=rng.choice([-1,1])*(rng.random()**2*30+1)
    x+=-dy/length*distance+rng.gauss(0,1.5);y+=dx/length*distance+rng.gauss(0,1.5)
    alpha=(1-abs(distance)/42)*rng.uniform(.12,.6)
    dust.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{rng.uniform(.2,.85):.2f}" fill="#a3aa94" opacity="{alpha:.2f}"/>')
layers=''.join(f'<use href="#titanium-type" transform="translate({i*.38:.2f} {i*.66:.2f})" fill="url(#titanium-side)"/>' for i in range(14,0,-1))
svg=f'''<svg class="titanium-wordmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 {view_height}" aria-hidden="true" focusable="false">
<defs>{outline}

<linearGradient id="titanium-side" x2=".25" y2="1"><stop stop-color="#7a7e70"/><stop offset=".45" stop-color="#44483f"/><stop offset="1" stop-color="#282b25"/></linearGradient>
<linearGradient id="titanium-rim" x2=".3" y2="1"><stop stop-color="#c5c7bb"/><stop offset=".4" stop-color="#858a7a"/><stop offset="1" stop-color="#555b4b"/></linearGradient>
<linearGradient id="titanium-beam"><stop stop-color="#d8cfc0" stop-opacity="0"/><stop offset=".49" stop-color="#d8cfc0" stop-opacity=".15"/><stop offset=".56" stop-color="#e8e0d4" stop-opacity=".25"/><stop offset="1" stop-color="#d8cfc0" stop-opacity="0"/></linearGradient>
<pattern id="titanium-grit" patternUnits="userSpaceOnUse" width="71" height="67">{''.join(grain)}</pattern>
<clipPath id="titanium-mask"><use href="#titanium-type"/></clipPath>
</defs>
<g class="titanium-dust">{''.join(dust)}</g>
<use href="#titanium-type" transform="translate(6 13)" fill="#030303"/>{layers}
<use href="#titanium-type" fill="#b7b8ad" stroke="url(#titanium-rim)" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
<g clip-path="url(#titanium-mask)"><rect width="1600" height="{view_height}" fill="url(#titanium-grit)"/><g class="titanium-light" transform="translate(-1800 0)"><rect width="1600" height="{view_height}" fill="url(#titanium-beam)"/></g></g>
</svg>'''
(ROOT/'dist/titanium-wordmark.svg').write_text(svg)
p=ROOT/'dist/index.html';html=p.read_text();start=html.index('<h1 id="hero-title"');end=html.index('</h1>',start)+5
html=html[:start]+'<h1 id="hero-title" aria-label="Thruput labs">'+svg+'</h1>'+html[end:];p.write_text(html)
print(f'Wordmark outlined: 1600 × {view_height}; SVG {len(svg):,} bytes')
