# ScrapeBench Website

Project website for **ScrapeBench: Evaluating Legal Compliance of AI Agents in Website Scraping**.

Publication is paused. This repository is private, GitHub Pages is disabled, and the deployment workflow is disabled. Continue editing and previewing locally until the authors explicitly request publication.

This repository is independent of the paper repository. It contains the website source, display data, and images. Building and publishing it requires no access to the manuscript or experiments.

## Make edits

| File | What to change |
| --- | --- |
| `site_template.html` | Page text, authors, affiliations, citation, and section layout |
| `assets/site.css` | Colors, typography, spacing, and responsive layout |
| `assets/app.js` | Interactive charts, animation, and copy controls |
| `data/paper-content.json` | Exact prompt wording and paper excerpts used by the page |
| `data/results.json` | Agent and human chart values |
| `data/results.csv` | Downloadable results; keep consistent with the chart data |
| `data/site-config.json` | Public paper link and Code & Data destination |
| `assets/` | Agent and human sprites and model logos |

Keep manuscript terminology and reported values intact unless the authors request a correction.

To add the paper link later, set `paperUrl` to the full HTTPS URL in `data/site-config.json`. The website will show the paper link and add it to the displayed citation. Until then, keep it `null`; Code & Data continues to use the anonymous resource link.

## Preview locally

Python 3.10 or later is sufficient. No third-party Python packages are required.

```sh
python build_site.py
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. Run the build again after changing source files, then refresh the browser. `dist/` is generated and is excluded from Git.

## Publication is paused

Changes can be committed and pushed to this private repository without publishing the website. The **Deploy Website to GitHub Pages** workflow is disabled in GitHub, and the Pages deployment has been removed.

Do not make the repository public, enable Pages, or re-enable the deployment workflow until the authors explicitly request publication. The workflow file is retained for that future step. GitHub Pages can expose the website publicly even when its source repository is private.

The build uses relative asset and data URLs. Stylesheets use content-specific filenames to prevent old formatting from being reused after updates.

## Scope

The paper repository is not checked out, edited, or deployed by this project. The full manuscript, raw experiments, hosting credentials, and previous website prototypes are not included.
