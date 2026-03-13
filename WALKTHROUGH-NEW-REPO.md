# Walkthrough: Make homeos-mobile Its Own GitHub Repo

Follow these steps so EAS Build clones a repo with `package.json` at the root.

---

## Step 1: Create the new repository (GitHub Desktop)

1. **Create the repo on GitHub first (easier for step 2):**
   - Go to https://github.com/new
   - **Repository name:** `homeos-mobile`
   - **Description:** (optional) e.g. "Home OS mobile app (Expo)"
   - Choose **Public**, leave "Add a README" **unchecked** (we already have files)
   - Click **Create repository**
   - Copy the repo URL (e.g. `https://github.com/YOUR_USERNAME/homeos-mobile.git`)

2. **In GitHub Desktop – use the existing folder as the repo root:**
   - **File → Add Local Repository…**
   - **Choose…** and select: `C:\Users\mikee\Documents\Projects\HomeOS\homeos-mobile`
   - GitHub Desktop will say this folder is not a Git repository yet → click **create a repository** (or **Create Repository**).
   - In the dialog:
     - **Name:** homeos-mobile (should match the folder)
     - **Local Path:** should already be `C:\Users\mikee\Documents\Projects\HomeOS\homeos-mobile` (or the parent; ensure the repo it creates is exactly this folder)
   - If instead you use **File → New Repository**:
     - **Name:** homeos-mobile  
     - **Local Path:** `C:\Users\mikee\Documents\Projects\HomeOS`  
     - That would create a *new* folder; we need the *existing* folder. So prefer **Add Local Repository** and then initializing in place (see Step 2).

**If Add Local Repository doesn’t offer “create a repository”:** do Step 2 first (init and add remote from the command line), then **File → Add Local Repository** and point to `C:\Users\mikee\Documents\Projects\HomeOS\homeos-mobile`; GitHub Desktop will detect the existing Git repo.

---

## Step 2: Commit all files and push to GitHub

**Option A – Command line (run from `homeos-mobile` after creating the empty repo on GitHub):**

```powershell
cd C:\Users\mikee\Documents\Projects\HomeOS\homeos-mobile
git init
git remote add origin https://github.com/YOUR_USERNAME/homeos-mobile.git
git add .
git commit -m "Initial commit: Expo app as standalone repo"
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username (or use the URL from Step 1).

**Option B – GitHub Desktop:**

1. With the `homeos-mobile` repo open in GitHub Desktop (after init + remote in Option A, or after creating repo in place in Step 1):
2. You should see all current files as changes. Add a commit message, e.g. **Initial commit: Expo app as standalone repo**.
3. Click **Commit to main**.
4. **Repository → Push origin** (or **Publish repository** if it’s the first push and you already created the repo on GitHub).

**Confirm:** Open `https://github.com/YOUR_USERNAME/homeos-mobile` in a browser and confirm you see `package.json`, `app.json`, `eas.json`, etc., at the **root** of the repo.

---

## Step 3: Reconnect GitHub in the Expo dashboard

1. Go to **https://expo.dev** and sign in.
2. Open your account → **Projects** → **homeos-mobile**.
3. Go to **Project settings** (or **Settings**).
4. Find **GitHub connection** / **Repository**.
5. **Disconnect** or **Unlink** the current repository (the one that pointed at the HomeOS repo or a subfolder).
6. **Connect** or **Link** the repository again and choose the **new** `homeos-mobile` repository (the one whose root is the Expo app).
7. Save.

---

## Step 4: Retry the build

From the `homeos-mobile` folder (now its own repo):

```powershell
cd C:\Users\mikee\Documents\Projects\HomeOS\homeos-mobile
eas build --platform android --profile development --non-interactive
```

No need for `EAS_NO_VCS` or `EAS_PROJECT_ROOT` anymore; the cloned repo will have `package.json` at the root.

---

## Optional: Clean up the original HomeOS repo

After `homeos-mobile` is its own repo, the folder `HomeOS/homeos-mobile` is now a separate Git repo (it has its own `.git`). The parent repo (HomeOS) will still list it as a folder. You can:

- **Leave as-is:** Keep the folder there; the parent repo will show it as a nested repo (Git may treat it as a submodule or just another directory).
- **Remove from parent tracking:** From `HomeOS` run:  
  `git rm -r --cached homeos-mobile`  
  then commit. That stops the parent repo from tracking the folder; the folder stays on disk but is no longer part of the HomeOS repo. Add `homeos-mobile/` to HomeOS’s `.gitignore` if you want to avoid accidentally re-adding it.

You can do this after confirming the new repo and EAS build work.
