# Sharon Wang Liu — Portfolio

A static portfolio with case studies, a moving gallery, an About postcard and the playable **Fall Into Me** experiment. No npm installation, framework, database or API key is needed.

## Start here

1. Unzip this package.
2. Put the **contents of `sharon-portfolio-github`** in your repository root.
3. Upload the folders and files, **not the ZIP or the old 188/233 MB HTML file**.
4. Keep `assets/` and `experiments/` with `index.html`. Do not rename their folders.

There are more than 100 files, so GitHub Desktop or Git is easier than the browser uploader. Every individual file in this package is below 25 MiB. Git LFS is not needed.

## Preview on your computer

With Python 3 installed, open Terminal in this folder and run:

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000**. On Windows, use `py -m http.server 8000`.
The included `preview.command` (Mac) and `preview.bat` (Windows) run the same server. If macOS does not allow the command file to open, use the Terminal command above.

Use a local server to test the full site. Fall Into Me uses WebGL; check its gravity scene on a browser/device with WebGL enabled. Sound begins after a user gesture.

## Publish with GitHub Desktop

1. Sign in to GitHub Desktop.
2. Create a new repository named `sharon-portfolio` (or another name you prefer).
3. Copy the package contents into that repository's local folder, including `.github`, `.gitignore`, `.gitattributes` and `.nojekyll`. In Mac Finder, **Command-Shift-.** shows files whose names begin with a dot.
4. Commit the files, then select **Publish repository**. For GitHub Pages on GitHub Free, make the repository public. Other plans can support Pages from private repositories.
5. On GitHub, open the repository's **Settings → Pages**. Under **Build and deployment → Source**, select **GitHub Actions**.
6. Open **Actions → Publish portfolio → Run workflow** for the first deployment. Later pushes to `main` run it automatically.
7. Open the published address shown by the successful deployment. The relative asset paths support both a user-site root and a project subfolder.

The workflow validates the files, creates `_site/`, and deploys only the website files. This package does not publish anything until you upload it, enable Pages and run the workflow.

## Publish using Git instead

Create an empty repository on GitHub, without an automatically added README or license. Then run these commands from this package folder. Replace the example remote URL with **your actual repository URL**:

```bash
git init -b main
git add .
git commit -m "Add Sharon portfolio"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Enable Pages with GitHub Actions as described above. Use GitHub's normal sign-in flow; do not put passwords or access tokens in source files.

## Files to edit

- `index.html`: homepage markup, navigation, About section and references to the style/script files.
- `assets/css/`: existing style blocks in their original order. Two SVG-filter style blocks stay inline so their fragment URLs continue to work.
- `assets/js/`: existing scripts in their original execution order. Case-study text and media maps are in the main portfolio script; search for `pumaPanels`, `snEditorialPanels`, `nyidPanels`, `buildscapePanels` or `logoPanels`.
- `assets/images/`, `assets/videos/`, `assets/documents/`: deduplicated media files. The hash-based names are stable; use `ASSET_MANIFEST.json` to inspect their type and size.
- `experiments/fall-into-me/`: the supplied working prototype, its frame sequence, audio and implementation files.
- `.github/workflows/`: deployment and pull-request checks.
- `scripts/`: dependency-free validation and deployment preparation.

All projects, both reading modes, current project order/filter behavior, gallery items and prototype assets are retained. The contact information is already updated. The About portrait now reuses the existing kimono photograph from the "That's Me" polaroid, repairing its missing original filename.

## Checks before a change

```bash
python3 scripts/check_site.py
python3 scripts/build_site.py
```

The check verifies local links, media files, all 240 prototype frames, size limits and JavaScript syntax when Node is available. The GitHub runner includes Node. `_site/` is generated and ignored by Git.

## Updating through ChatGPT

After installing/connecting GitHub and granting access to this repository, share its URL in the chat. Ask for a specific change and whether you want a review branch/pull request or an update to your chosen branch. Repository capabilities and write authorization must be available in the session. Never paste a personal access token into the chat.

## Media delivery and remaining limits

The complete media collection is still sizable. It is now separate from the HTML, so case-study videos/PDFs and experiment files can be requested independently. The homepage hero video is still an eager-loading asset; a total repository size is not a measured initial page-load size.

Some style guides are SVG wrappers containing embedded raster images; these have been preserved as supplied. Additional optimization is possible later without removing projects.

## Official references

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
