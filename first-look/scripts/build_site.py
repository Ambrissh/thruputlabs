"""Regenerate static content and finish with shared search metadata."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
for script in ['build_case_studies.py','build_blog.py','build_seo.py']:
    subprocess.run([sys.executable,str(ROOT/'scripts'/script)],cwd=ROOT,check=True)
