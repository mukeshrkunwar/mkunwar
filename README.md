# Mukesh Kunwar | Data Analyst Portfolio

A dynamic portfolio and CV website. All content is loaded from JSON files, so you update data, not code.

## Publish on GitHub (one time)

1. On github.com click **New repository**. Name it `mukeshkunwar.github.io` (or any name), set it to **Public**, and create it.
2. Click **Add file → Upload files**, drag in everything from this folder (including the hidden `.github` folder), and **Commit**.
3. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. Open the **Actions** tab. When the "Build gallery and deploy" run turns green, your site is live at
   `https://<your-username>.github.io/` (or `/<repo-name>/` for a different repo name).

## Add pictures to the gallery

1. Open `images/gallery/` on GitHub. Pick a folder (**Teaching**, **IT-and-Web**, **Community**) or create a new folder. The folder name becomes the filter button.
2. Click **Add file → Upload files**, drop your photos, **Commit**.
3. The Action rebuilds `data/gallery.json` automatically. Refresh the site after about a minute.

Tips: use JPG/WebP under about 500 KB each (resize big photos first). The file name becomes the caption (`class-photo-2019.jpg` → "Class Photo 2019").
For custom captions create `images/gallery/captions.json`:

```json
{ "class-photo-2019.jpg": { "title": "Year 7 ICT class", "description": "Kathmandu", "year": "2019" } }
```

Delete the six `sample-*.svg` illustrations once you have your own photos.

## Update your CV details

Edit `data/cv.json`:
- `links.github` / `links.linkedin`: add your URLs (they appear automatically when filled).
- `projects`: replace the three sample cards with real data projects (set `"placeholder": false` or remove it, and add a `link`).
- Experience, skills, education: edit the text; the page updates itself.
- Replace `assets/Mukesh_Kunwar_Data_Analyst_CV.docx` with a new file of the **same name** to update the download button (a PDF is better for recruiters: upload `…CV.pdf` and change `cvFile` in `cv.json`).

## CV download

Visitors can download your CV from three places: the **⬇ CV** menu in the top bar, the hero button, and the **Download my CV** section. Both versions are in `assets/`:
- `Mukesh_Kunwar_Data_Analyst_CV.pdf` (shown first)
- `Mukesh_Kunwar_Data_Analyst_CV.docx`

When you update your CV, upload new files with the **same names** and the buttons keep working. Make the PDF by opening the Word file and choosing **File → Save As → PDF**.
Note: anything in these files (such as your phone number) is public once the site is live.

## Your profile photo

Upload a square photo named `profile.jpg` into the `images/` folder. It replaces the placeholder in the hero automatically (to use another file name, change `photo` in `data/cv.json`).

## Project pictures

Each project in `data/cv.json` has an `image` field. Upload a screenshot (for example of your dashboard) to `images/projects/` and set `"image": "images/projects/my-dashboard.png"`. Also remove `"placeholder": true` and add a `link`.

## What is interactive

- Hero: animated network background (reacts to your mouse), typing effect, floating profile ring
- Career timeline chart drawn from your dates in `cv.json` (hover for details, click a bar to jump to that role)
- "Search my CV" box: filters roles and highlights matching skills
- Project filter buttons built from your project tags
- Gallery: category filters, full-screen viewer, slideshow, swipe on phones
- Scroll progress bar, back-to-top button, dark mode, count-up numbers, card tilt
- Motion switches off automatically for visitors who prefer reduced motion

## Contact form

By default the form opens the visitor's email app with the message filled in. To receive messages directly in your inbox:
1. Create a free form at formspree.io (use mukeshrsldc@gmail.com).
2. Copy the form URL (looks like `https://formspree.io/f/xxxxxxx`).
3. Paste it into `data/cv.json` → `contact.formEndpoint`.

## Data toolkit section

In `data/cv.json` fill `toolkit.known` (e.g. your real tools) and `toolkit.learning`. The section stays hidden while both lists are empty. Only list tools you can talk about in an interview.

## Preview on your computer

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
(Opening index.html by double-clicking won't load the JSON files because of browser security rules.)

## Structure

```
index.html            page layout
css/style.css         design, dark mode
js/app.js             renders everything from JSON, gallery filter, lightbox
data/cv.json          your CV content
data/gallery.json     auto-generated from images/gallery
images/gallery/       put your pictures here
scripts/build_gallery.py
.github/workflows/deploy.yml   builds gallery + publishes to GitHub Pages
```
