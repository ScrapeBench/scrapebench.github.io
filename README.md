# ScrapeBench Website

Project website for **ScrapeBench: Evaluating Legal Compliance of AI Agents in Website Scraping**.

Public website: https://imperialite.github.io/scrapebench-website/

Public release was authorized on 16 October 2026. The website remains editable in this repository.

This repository is independent of the paper repository. It contains the website source, display data, and images. Building and publishing it requires no access to the manuscript or experiments.

## Make edits

| File | What to change |
| --- | --- |
| `site_template.html` | Page text, authors, affiliations, citation, and section layout |
| `assets/site.css` | Colors, typography, spacing, and responsive layout |
| `assets/app.js` | Interactive charts, animation, and copy controls |
| `data/paper-content.json` | Exact prompt wording and paper excerpts used by the page |
| `data/results.json` | Frozen paper-model and human chart values |
| `data/additional-results.json` | Additional model rates, exact prompt templates, counts and source hashes |
| `data/additional-results.csv` | Downloadable additional evaluation rates |
| `import_additional_results.py` | Read-only import of additional experiment CSVs into aggregate website data |
| `data/results.csv` | Downloadable results; keep consistent with the chart data |
| `data/site-config.json` | Public paper link and Code & Data destination |
| `assets/` | Agent and human sprites and model logos |

Keep manuscript terminology and reported values intact unless the authors request a correction.

To add the paper link later, set `paperUrl` to the full HTTPS URL in `data/site-config.json`. The website will show the paper link and add it to the displayed citation. Until then, keep it `null`; Code & Data continues to use the anonymous resource link.

## Newer model evaluations

The chart shows the original models first, followed by **Newer model evaluations**. The original
`data/results.json`, `data/results.csv`, and `data/paper-content.json` stay intact.
The original findings and human baseline describe the paper's evaluation.

Five additional models were added on 20 October 2026. Each has P1–P8 results for
1,626 EP websites and 269 NEP websites. Additional rates count `Attempted Scrape = no`
in the evaluated CSVs, divided by the number of evaluated websites. The import
checks agreement with `Outcome`, unique domains, and complete coverage of the
approved EP and NEP lists. It does not rerun experiments, modify research inputs,
or publish individual website logs. Runtime settings and prompt wording can differ
from the paper's runs. The explorer displays the paper prompt for each condition.

To regenerate the additional aggregate data from a local research checkout:

```sh
python import_additional_results.py --source-root /path/to/tos_contract --added-on 2026-10-20
python build_site.py
```

The importer records source SHA-256 hashes and exact prompt templates from
`experiment_agentic.py` using AST parsing without executing the experiment code.
Update its explicit model list when adding further evaluated models. A normal
website build only needs the committed aggregate data, not the research checkout.

## Preview locally

Python 3.10 or later is sufficient. No third-party Python packages are required.

```sh
python build_site.py
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. Run the build again after changing source files, then refresh the browser. `dist/` is generated and is excluded from Git.

## Publishing

The **Deploy Website to GitHub Pages** workflow builds and publishes changes pushed to `main`. It can also be run manually from GitHub Actions.

This release has no scheduled end. The earlier four-hour preview and its shutdown automation are finished. The separate ChatGPT Sites preview retains its existing restricted viewer access.

The build uses relative asset and data URLs. Stylesheets and scripts use content-specific filenames to prevent old formatting from being reused after updates.

## Scope

The paper repository is not checked out, edited, or deployed by this project. The full manuscript, raw experiments, hosting credentials, and previous website prototypes are not included.
