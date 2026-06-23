# Brian Perry — Portfolio Site 
## Cloudflare Pages + Claude AI Chat

---

## WHAT YOU'VE GOT

```
portfolio/
├── index.html              ← Your entire website (one file)
├── functions/
│   └── api/
│       └── chat.js         ← The AI chat backend (runs on Cloudflare servers)
└── README.md               ← This file
```

---

## HOW TO DEPLOY (step by step)

### STEP 1 — Push to GitHub

1. Go to **github.com** and create a new repository (call it `portfolio` or `brianperry-site`)
2. Upload these files — maintain the exact folder structure:
   - `index.html` goes in the root
   - `functions/api/chat.js` goes inside those nested folders

   **Easiest way:** Drag and drop in GitHub's web UI after creating the repo.
   Or use GitHub Desktop if you have it installed.

---

### STEP 2 — Connect to Cloudflare Pages

1. Go to **dash.cloudflare.com** → **Pages** (left sidebar)
2. Click **"Create a project"** → **"Connect to Git"**
3. Choose your GitHub repo
4. Build settings — leave everything **blank/default** (this is a plain HTML site, no build needed)
5. Click **Deploy**

---

### STEP 3 — Enable the AI Binding (CRITICAL)

This is what connects the chat widget to Claude. Without this, the chat won't work.

1. In Cloudflare Pages → your project → **Settings** → **Functions**
2. Scroll down to **"AI Bindings"**
3. Click **"Add binding"**
4. Set:
   - **Variable name:** `AI`  ← must be exactly this, capital letters
   - Leave the rest as default
5. Save and **redeploy** (Pages → Deployments → "Retry deployment")

---

### STEP 4 — Test It

Visit your site at `your-project.pages.dev` — the chat widget should be live.

Try asking: *"Tell me about the AI trading agent"*

---

## MAKING CHANGES

### To update your bio/text:
- Open `index.html` in any text editor (TextEdit on Mac works)
- Find the section you want to change and edit the text
- Save → push to GitHub → Cloudflare auto-redeploys

### To update what the AI knows about you:
- Open `functions/api/chat.js`
- Find the `systemPrompt` section (it says `// This is what Claude knows about you`)
- Edit the text in that section
- Save → push to GitHub → auto-redeploys

---

## COSTS

- **Cloudflare Pages:** Free forever for personal sites
- **Workers AI (Claude):** Free tier covers ~10,000 requests/day
  At portfolio scale you'll spend essentially $0/month

---

## CUSTOM DOMAIN (optional later)

Once deployed, you can point a domain at it:
Pages → your project → Custom domains → Add domain

If you have a domain at GoDaddy, it takes about 5 minutes to connect.

---

## TROUBLESHOOTING

**Chat says "Connection error":**
→ Check that the AI binding is set with variable name `AI` (Step 3)
→ Redeploy after adding the binding

**Site shows old version:**
→ Go to Pages → Deployments → click the latest deploy

**Pages can't find the GitHub repo:**
→ Make sure you authorized Cloudflare's GitHub app (it asks during setup)
