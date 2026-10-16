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
table_rows = []
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
    table_rows.append(f'<tr><th scope="row">{esc(model["label"])}</th>'
                      f'<td data-label="Compliance">{value}%</td>'
                      f'<td data-label="Over-refusal">{rate(baseline["overrefusal"]["rate"])}%</td></tr>')
    chart_label.append(f'{model["label"]}: {value}% compliance;')

human_keys = ('p1', 'p4', 'p7')
human_initial_rate = rate(data['humans']['prompts']['p1']['compliance']['rate'])
human_chart_label = f'P1 · {paper["prompts"]["p1"]["name"]}. Human participants: {human_initial_rate}% compliance.'
human_table = []
for key in human_keys:
    prompt_label = f'{key.upper()} · {paper["prompts"][key]["name"]}'
    prompt_result = data['humans']['prompts'][key]
    human_table.append(f'<tr><th scope="row">{esc(prompt_label)}</th>'
                       f'<td>{rate(prompt_result["compliance"]["rate"])}%</td>'
                       f'<td>{rate(prompt_result["overrefusal"]["rate"])}%</td></tr>')

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
    '__INITIAL_TABLE__': ''.join(table_rows),
    '__INITIAL_CHART_LABEL__': esc(' '.join(chart_label)),
    '__HUMAN_PROMPT_OPTIONS__': ''.join(f'<option value="{key}">{key.upper()} · {esc(paper["prompts"][key]["name"])}</option>' for key in human_keys),
    '__HUMAN_INITIAL_RATE__': human_initial_rate,
    '__HUMAN_TABLE__': ''.join(human_table),
    '__HUMAN_CHART_LABEL__': esc(human_chart_label),
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
