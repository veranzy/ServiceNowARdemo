# Receivables Desk (demo)

A browser-only accounts receivable demo: customers → contracts → invoices, plus cash application
(rule-based auto-match and a manual invoice finder with allocation preview). No backend, no API keys.
Opens with sample data; reloading resets everything.

## Publish on GitHub Pages

1. Create a new repository on GitHub (for example `receivables-desk`).
2. Upload the contents of this folder to the repository root, including the hidden `.github` folder
   and `.nojekyll`, and commit to the `main` branch.
   - Command line: `git init && git add . && git commit -m "Receivables Desk demo" && git branch -M main && git remote add origin https://github.com/<you>/receivables-desk.git && git push -u origin main`
3. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to finish (about a minute).
5. Your demo is live at `https://<you>.github.io/receivables-desk/`.

Every push to `main` redeploys automatically.

## Notes

- GitHub Pages sites are public to anyone with the link. Use only sample or anonymised data.
- Imported CSV data never leaves the visitor's browser.
- To try your own data: Cash application → Clear all → Import CSV (invoices first, then payments).
