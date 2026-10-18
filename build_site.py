"""Build the research website from the verified paper extracts and result data."""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import html
import json
import shutil

ROOT = Path(__file__).resolve().parent
DIST = ROOT / 'dist'
DIST.mkdir(exist_ok=True)
for directory in ('assets', 'data'):
    for source_file in (ROOT / directory).rglob('*'):
        if source_file.is_file():
            destination = DIST / source_file.relative_to(ROOT / directory)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_file, destination)
(DIST / '.nojekyll').touch()
paper = json.loads((DIST / 'paper-content.json').read_text(encoding='utf-8'))
data = json.loads((DIST / 'results.json').read_text(encoding='utf-8'))
esc = html.escape
logos = {
    'gpt52': 'gpt_logo.png', 'claudeopus46': 'claude_logo.png',
    'gemini31pro': 'gemini_logo.png', 'kimik25': 'kimi_logo.png',
    'qwen3maxt': 'qwen_logo.png', 'grok420': 'grok_logo.png',
}

def rate(value):
    return str(Decimal(str(value)).quantize(Decimal('0.1'), rounding=ROUND_HALF_UP))

rows = []
chart_label = ['P1 · Neutral (Baseline).']
for key, model in data['models'].items():
    baseline = model['prompts']['p1']
    value = rate(baseline['compliance']['rate'])
    rows.append(
        f'<div class="agent-row" id="agent-{esc(key)}">'
        f'<span class="agent-name"><img class="model-logo" data-model="{esc(key)}" '
        f'src="logos/{logos[key]}" alt="" width="32" height="32" loading="lazy">'
        f'<span>{esc(model["label"])}</span></span>'
        f'<div class="agent-track" aria-hidden="true"><div class="agent-fill" style="width:{value}%"></div></div>'
        f'<strong class="agent-value">{value}<small>%</small></strong></div>'
    )
    chart_label.append(f'{model["label"]}: {value}% compliance;')

human_rows = []
human_chart_label = ['Human Baseline.']
for key in ('p1', 'p4', 'p7'):
    prompt_label = f'{key.upper()} · {paper["prompts"][key]["name"]}'
    bars = []
    human_chart_label.append(prompt_label + '.')
    for metric, label, fill in (
        ('compliance', 'Compliance', 'compliance-fill'),
        ('overrefusal', 'Over-refusal', 'refusal-fill'),
    ):
        value = rate(data['humans']['prompts'][key][metric]['rate'])
        bars.append(
            f'<div class="human-bar-row"><span class="sr-only">{label}</span>'
            f'<div class="human-track"><div class="human-fill {fill}" style="width:{value}%"></div></div>'
            f'<strong class="human-value">{value}<small>%</small></strong></div>'
        )
        human_chart_label.append(f'{label}: {value}%.')
    human_rows.append(f'<div class="human-prompt-group"><h4>{esc(prompt_label)}</h4>'
                      f'<div class="human-bars">{"".join(bars)}</div></div>')

# A content-specific URL prevents an earlier stylesheet from formatting new HTML.
stylesheet = (DIST / 'site.css').read_bytes()
stylesheet_name = f'site.{hashlib.sha256(stylesheet).hexdigest()[:12]}.css'
(DIST / stylesheet_name).write_bytes(stylesheet)
script = (DIST / 'app.js').read_bytes()
script_name = f'app.{hashlib.sha256(script).hexdigest()[:12]}.js'
(DIST / script_name).write_bytes(script)

replacements = {
    '__STYLE_URL__': stylesheet_name,
    '__SCRIPT_URL__': script_name,
    '__PROMPT_OPTIONS__': ''.join(f'<option value="{key}">{key.upper()} · {esc(item["name"])}</option>' for key, item in paper['prompts'].items()),
    '__AGENT_ROWS__': ''.join(rows),
    '__INITIAL_CHART_LABEL__': esc(' '.join(chart_label)),
    '__HUMAN_ROWS__': ''.join(human_rows),
    '__HUMAN_CHART_LABEL__': esc(' '.join(human_chart_label)),
    '__BASELINE_HEADING__': esc(paper['findings']['result1']['title']),
    '__POLICY_HEADING__': esc(paper['findings']['result4']['title']),
    '__FETCH_HEADING__': esc(paper['findings']['result7']['title']),
}
template = (ROOT / 'site_template.html').read_text(encoding='utf-8')
for placeholder, text in replacements.items():
    template = template.replace(placeholder, text)
for filename in ('index.html',):
    (DIST / filename).write_text(template, encoding='utf-8')
print('Built ScrapeBench with paper-derived prompts, findings, results and model logos.')
