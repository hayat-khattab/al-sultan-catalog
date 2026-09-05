# AL SULTAN MEDICAL & AESTHETIC CATALOG

**شركة السلطان التجارية | AL SULTAN TRADING COMPANY**

Premium medical products mini catalog — Authorized distributor for OMEGA Technology for Life (Turkey).

> 📘 **For administrators (in simple Arabic):** see [`docs/دليل-المشرف.md`](docs/دليل-المشرف.md)

---

## What is this project?

A bilingual (Arabic RTL / English LTR) product catalog website with an admin dashboard:

- **Public catalog** (`index.html`): searchable, filterable product grid, product detail pages, WhatsApp quotation.
- **Admin dashboard** (`admin.html`): add / edit / delete products, upload images, feature products, set display order, generate QR codes, copy product links, export/import data.
- **Single source of truth**: all products live in `data/products.json`, stored in GitHub and synced to the live site automatically.

---

## Project Structure

```
/
├── index.html                  (public catalog)
├── product.html                (public product detail page)
├── admin.html                  (admin dashboard)
├── css/
│   ├── style.css               (site-wide styles)
│   ├── product.css             (product detail styles)
│   └── admin.css               (admin dashboard styles)
├── js/
│   ├── script.js               (public site behavior)
│   ├── products.js             (ProductManager — shared source of truth)
│   ├── product.js              (product detail controller)
│   └── admin.js                (admin dashboard logic)
├── assets/
│   ├── js/qrcode-generator.js  (self-hosted QR library)
│   ├── logos/logo.svg          (social share image)
│   └── images/products/        (uploaded product images)
├── data/
│   └── products.json           (single source of truth — products + categories)
├── netlify/
│   └── functions/              (login, products, save-products, upload-image, auth-utils)
├── docs/
│   └── دليل-المشرف.md          (Arabic admin user guide)
├── netlify.toml                (Netlify build, redirects, headers)
├── package.json
├── robots.txt
├── sitemap.xml
├── .env.example                (template — copy to .env locally)
└── .gitignore                  (protects .env / secrets)
```

---

## How to run it locally

Prerequisites: [Node.js](https://nodejs.org) installed on your computer.

```bash
# 1. Open a terminal in this folder
cd "web Catalog"

# 2. Install a simple static server (one time)
npm install -g serve

# 3. Start the site
serve .
```

Then open the address shown in the terminal (usually `http://localhost:3000`).

> **Note:** The admin dashboard uses Netlify Functions (login, save, upload). To test **all** admin features locally you need the Netlify CLI with the GitHub env vars set. To just view the static site, the simple `serve` command above is enough.

---

## How to configure GitHub

The admin saves products to this repository via the GitHub API, so GitHub must be set up:

1. **Create a GitHub repository** and push this project to it.
2. **Create a Personal Access Token (PAT):**
   - GitHub → your avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token**.
   - Give it a name, select scope: **`repo`** (includes `contents:write`).
   - Copy the token (it is shown only once — save it in a password manager).
3. Keep these values ready — they are needed for Netlify env vars (see below):
   - `GITHUB_TOKEN` = the token you just created
   - `GITHUB_OWNER` = your GitHub username or organization
   - `GITHUB_REPO` = your repository name
   - `GITHUB_BRANCH` = `main` (or the branch you use)

---

## Environment variables

The admin login credentials and the session secret are **never embedded in the code** — they
are read server-side from Netlify environment variables. Product data and uploaded images are
stored in **Netlify Blobs**.

Required environment variables (set in **Netlify UI → Site settings → Environment variables**):

| Variable          | Purpose                                                        |
|-------------------|----------------------------------------------------------------|
| `ADMIN_USERNAME`  | Admin login username (server-side only)                        |
| `ADMIN_PASSWORD`  | Admin login password (server-side only)                        |
| `SESSION_SECRET`  | Secret used to sign login tokens, e.g. `openssl rand -hex 64`  |

> ⚠️ These values are never shipped to the browser and never appear in any public file.
> See `.env.example` for safe placeholder names. Do not put real values in this README
> or anywhere in the repository.

---

## How to deploy to Netlify

### Option A — Deploy via Git (recommended, auto-updates)

1. Push your project to GitHub.
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**.
3. Connect your GitHub account and select the repository.
4. Netlify detects the build automatically (`netlify.toml`).
5. Click **Deploy site**.

Every time you push code to GitHub, Netlify redeploys automatically.
This is the **preferred** option because a Git build properly installs `@netlify/blobs`
and provisions the Blobs storage, which is what lets added products persist.

### Option B — Deploy manually (drag & drop, no auto-updates)

1. Go to Netlify → **Sites** → **Drag and drop your site output folder** (the project root).
2. For persistence, **enable Netlify Blobs** in the Netlify dashboard first
   (**Data & Storage → Blobs**), otherwise product saves won't persist.

---

## How to access the admin dashboard

- Live site: `https://YOUR-SITE.netlify.app/admin.html` (or your custom domain).
- There is a **"لوحة التحكم" (Control Panel)** link in the site's navigation header.
- Log in using the same `ADMIN_USERNAME` / `ADMIN_PASSWORD` you configured in Netlify
  environment variables.

### What you can do in the dashboard

- **Add a product** — fill the form (name AR/EN, category, SKU required), option to upload an image, then **Save**.
- **Edit a product** — press **تعديل** (Edit) on a row, change fields, press **تحديث** (Update).
- **Delete a product** — press **حذف** (Delete), confirm.
- **Feature a product** — toggle **مميز/عادي** (Featured) in the table.
- **Reorder products** — edit the **ترتيب العرض** (display order) number (lower = first).
- **QR code** — press **QR Code** per product to preview / download SVG / copy link.
- **Copy product link** — press **نسخ الرابط** per product.
- **Export / Import data** — under **الإعدادات** (Settings) as JSON backup.

> **Categories** are shown (read-only) in the dashboard; to add a category you edit `data/products.json` (see the Arabic guide, item 15).

See [`docs/دليل-المشرف.md`](docs/دليل-المشرف.md) for full **Arabic step-by-step** admin instructions.

---

## Security notes

- Credentials are validated **server-side** via Netlify Functions; secrets are stored in **Netlify env vars / GitHub**, never in the browser or repo files.
- Login tokens are kept **in memory only** (not in localStorage) and expire after 8 hours.
- CORS, security headers (`X-Frame-Options: DENY`, nosniff, etc.), and `no-store` caching on API routes are configured in `netlify.toml`.
- SVG uploads are rejected; image files are validated by magic bytes on the server.
- **No secrets are committed.** `.env` is git-ignored; only `.env.example` (empty template) is in the repo.

---

## Backup

- Use **تصدير JSON** (Export JSON) in the admin dashboard and store the file somewhere safe (cloud drive, external disk).
- GitHub itself is a backup of the code and all product data (`data/products.json`).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Admin won't log in | Check `ADMIN_USERNAME` / `ADMIN_PASSWORD` in Netlify env vars and redeploy |
| Products don't save | Confirm `GITHUB_TOKEN` / owner / repo / branch are correct in Netlify and the token has `repo` scope |
| Changed product not on live site | Refresh with Ctrl+F5; check that the deploy succeeded |
| Image upload fails | Use a smaller JPG/PNG file |

---

## Technology

- HTML5, CSS3, Vanilla JavaScript (no frameworks)
- Netlify Functions for the admin API + GitHub Contents API for storage
- Self-hosted QR code generator (no external dependency)

## WhatsApp

Primary number: +963 994 683 406

## Status

- [x] Phase 1: Public Catalog
- [x] Phase 2: Admin Backend
- [x] Phase 3: GitHub API Integration
- [x] Phase 4: Netlify Functions + Product Detail/QR
- [x] Phase 5: Security, SEO, performance, accessibility & responsive audit
- [x] Phase 6: Arabic admin guide + final documentation
