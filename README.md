# ScrapeBench Website

Public project website for **ScrapeBench: Evaluating Legal Compliance of AI Agents in Website Scraping**.

Website: https://imperialite.github.io/scrapebench-website/

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

## Publish updates

Commit and push changes to `main`, or edit a source file on GitHub and commit it to `main`. The **Deploy Website to GitHub Pages** workflow rebuilds the website and publishes `dist/` automatically. Its progress appears in the repository's Actions tab.

GitHub Pages uses **GitHub Actions** as its publishing source. The workflow can also be run manually through **Actions → Deploy Website to GitHub Pages → Run workflow**.

The build uses relative asset and data URLs, so the website works under the `/scrapebench-website/` project path. Stylesheets use content-specific filenames to prevent old formatting from being reused after updates.

## Scope

The paper repository is not checked out, edited, or deployed by this project. The full manuscript, raw experiments, hosting credentials, and previous website prototypes are not included.
