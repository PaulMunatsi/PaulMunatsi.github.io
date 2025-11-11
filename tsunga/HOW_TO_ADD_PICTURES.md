# 📸 HOW TO ADD PICTURES - STAFF & NEWS ARTICLES
## Tsunga Bamu Law International Website

---

## 📁 STEP 1: CREATE IMAGE FOLDERS

First, create these folders on your server in the root directory:

```
your-website-root/
├── images/
│   ├── team/          [For staff photos]
│   └── news/          [For news article images]
```

**How to create folders:**
- **cPanel:** File Manager → New Folder
- **FTP:** Right-click → Create Directory
- **Command line:** `mkdir -p images/team images/news`

---

## 👥 ADDING STAFF PICTURES

### Image Requirements for Staff Photos

| Specification | Requirement |
|---------------|-------------|
| **Format** | JPG or PNG |
| **Size** | 500x500 pixels (square) |
| **File Size** | Under 200 KB |
| **Background** | Professional (solid color or subtle) |
| **Quality** | High resolution, well-lit |
| **Naming** | firstname-lastname.jpg (lowercase, no spaces) |

### Step-by-Step: Add Staff Photos

#### 1. Prepare Your Images

**Example file names:**
```
arnold-tsunga.jpg
chipo-moyo.jpg
tadiwa-ndlovu.jpg
rumbidzai-kachote.jpg
farai-muponda.jpg
nyasha-mutasa.jpg
kudakwashe-chikwanha.jpg
tendai-makoni.jpg
```

#### 2. Optimize Images (Optional but Recommended)

Use free tools to reduce file size:
- **TinyPNG:** https://tinypng.com/
- **Squoosh:** https://squoosh.app/
- **ImageOptim:** https://imageoptim.com/

**Target:** 500x500px, under 200 KB each

#### 3. Upload Images

Upload all staff photos to: `images/team/`

**Using cPanel:**
1. Go to File Manager
2. Navigate to `images/team/`
3. Click "Upload"
4. Select all staff photos
5. Wait for upload to complete

**Using FTP (FileZilla):**
1. Connect to your server
2. Navigate to `images/team/`
3. Drag and drop photos
4. Wait for transfer to complete

#### 4. Update HTML Code

Open **index.html** and find the Team Section.

**FIND THIS (for each team member):**
```html
<div class="team-photo-container">
    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'..." alt="Arnold Tsunga" class="team-photo">
</div>
```

**REPLACE WITH THIS:**
```html
<div class="team-photo-container">
    <img src="images/team/arnold-tsunga.jpg" alt="Arnold Tsunga - Managing Partner at TBLI" class="team-photo">
</div>
```

### Complete Example for Arnold Tsunga

**BEFORE:**
```html
<div class="glass-card team-card" onclick="openModal('team1')">
    <div class="team-photo-container">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23151D41' width='300' height='300'/%3E%3Ccircle cx='150' cy='120' r='50' fill='%23E2A539'/%3E%3Cpath d='M 90 250 Q 150 200 210 250' fill='%23E2A539'/%3E%3Ctext x='150' y='280' font-family='Arial' font-size='14' fill='%238A8CA0' text-anchor='middle'%3EArnold Tsunga%3C/text%3E%3C/svg%3E" alt="Arnold Tsunga" class="team-photo">
    </div>
    <h3>Arnold Tsunga</h3>
    <div class="title">Managing Partner</div>
    <p>Advocate and governance expert with broad experience in international law, justice sector reform, and civic-space protection.</p>
</div>
```

**AFTER:**
```html
<div class="glass-card team-card" onclick="openModal('team1')">
    <div class="team-photo-container">
        <img src="images/team/arnold-tsunga.jpg" alt="Arnold Tsunga - Managing Partner at TBLI" class="team-photo">
    </div>
    <h3>Arnold Tsunga</h3>
    <div class="title">Managing Partner</div>
    <p>Advocate and governance expert with broad experience in international law, justice sector reform, and civic-space protection.</p>
</div>
```

### All 8 Staff Members to Update

Replace image source for each staff member:

1. **Arnold Tsunga** → `images/team/arnold-tsunga.jpg`
2. **Chipo Moyo** → `images/team/chipo-moyo.jpg`
3. **Tadiwa Ndlovu** → `images/team/tadiwa-ndlovu.jpg`
4. **Rumbidzai Kachote** → `images/team/rumbidzai-kachote.jpg`
5. **Farai Muponda** → `images/team/farai-muponda.jpg`
6. **Nyasha Mutasa** → `images/team/nyasha-mutasa.jpg`
7. **Kudakwashe Chikwanha** → `images/team/kudakwashe-chikwanha.jpg`
8. **Tendai Makoni** → `images/team/tendai-makoni.jpg`

### Update Modal Images Too!

**Also update the modal images in script.js:**

Open **script.js** and find the `modalData` section.

**FIND THIS (in each team member's data):**
```javascript
image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,..."
```

**REPLACE WITH THIS:**
```javascript
image: "background: url('images/team/arnold-tsunga.jpg') center/cover; position: relative;"
```

**Example for Arnold Tsunga in script.js:**

**BEFORE:**
```javascript
team1: {
    title: 'Arnold Tsunga',
    subtitle: 'Managing Partner',
    image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg...",
    body: `...`
}
```

**AFTER:**
```javascript
team1: {
    title: 'Arnold Tsunga',
    subtitle: 'Managing Partner',
    image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.8)), url('images/team/arnold-tsunga.jpg') center/cover;",
    body: `...`
}
```

---

## 📰 ADDING NEWS ARTICLE PICTURES

### Image Requirements for News Articles

| Specification | Requirement |
|---------------|-------------|
| **Format** | JPG or PNG |
| **Size** | 1200x630 pixels (landscape) |
| **File Size** | Under 300 KB |
| **Aspect Ratio** | 1.91:1 (Facebook/LinkedIn optimal) |
| **Quality** | High resolution, professional |
| **Naming** | descriptive-name.jpg (lowercase, hyphens) |

### Step-by-Step: Add News Images

#### 1. Prepare Your Images

**Example file names:**
```
law-society-listing.jpg
regional-partnerships.jpg
legal-commentary.jpg
pro-bono-services.jpg
knowledge-center.jpg
career-opportunities.jpg
```

#### 2. Optimize Images

Use the same tools as staff photos:
- Target: 1200x630px
- Under 300 KB
- High quality

#### 3. Upload Images

Upload all news images to: `images/news/`

#### 4. Update HTML Code

Open **index.html** and find the News Section.

**FIND THIS (for each news card):**
```html
<div class="news-image" style="background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg..."></div>
```

**REPLACE WITH THIS:**
```html
<div class="news-image" style="background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('images/news/law-society-listing.jpg') center/cover;"></div>
```

### Complete Example for First News Article

**BEFORE:**
```html
<div class="glass-card news-card" onclick="openModal('news1')">
    <div class="news-image" style="background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23151D41%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%22200%22 y=%22150%22 font-family=%22Arial%22 font-size=%2224%22 fill=%22%23E2A539%22 text-anchor=%22middle%22%3ELaw Society Recognition%3C/text%3E%3C/svg%3E'); background-size: cover; background-position: center;"></div>
    <div class="news-date">January 2025</div>
    <h3>TBLI Listed by Law Society of Zimbabwe</h3>
    <p class="preview">Tsunga Bamu Law International was officially listed among new law firms by the Law Society of Zimbabwe in 2025...</p>
    <span class="read-more">Read More →</span>
</div>
```

**AFTER:**
```html
<div class="glass-card news-card" onclick="openModal('news1')">
    <div class="news-image" style="background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('images/news/law-society-listing.jpg') center/cover;"></div>
    <div class="news-date">January 2025</div>
    <h3>TBLI Listed by Law Society of Zimbabwe</h3>
    <p class="preview">Tsunga Bamu Law International was officially listed among new law firms by the Law Society of Zimbabwe in 2025...</p>
    <span class="read-more">Read More →</span>
</div>
```

### All 6 News Articles to Update

Replace image source for each article in **index.html**:

1. **News 1** (Law Society) → `images/news/law-society-listing.jpg`
2. **News 2** (Partnerships) → `images/news/regional-partnerships.jpg`
3. **News 3** (Commentary) → `images/news/legal-commentary.jpg`
4. **News 4** (Pro Bono) → `images/news/pro-bono-services.jpg`
5. **News 5** (Knowledge Center) → `images/news/knowledge-center.jpg`
6. **News 6** (Careers) → `images/news/career-opportunities.jpg`

### Update Modal Images Too!

**Also update in script.js:**

Open **script.js** and find the `modalData` section.

**FIND THIS (in each news item):**
```javascript
image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,..."
```

**REPLACE WITH THIS:**
```javascript
image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('images/news/law-society-listing.jpg') center/cover;"
```

**Example for News 1 in script.js:**

**BEFORE:**
```javascript
news1: {
    title: 'TBLI Listed by Law Society of Zimbabwe',
    subtitle: 'January 2025',
    image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg...",
    body: `...`
}
```

**AFTER:**
```javascript
news1: {
    title: 'TBLI Listed by Law Society of Zimbabwe',
    subtitle: 'January 2025',
    image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('images/news/law-society-listing.jpg') center/cover;",
    body: `...`
}
```

---

## 🔍 QUICK SEARCH & REPLACE GUIDE

### For Staff Photos (index.html)

Use Find & Replace (Ctrl+F) in your text editor:

**Staff Member 1:**
- **Find:** `src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23151D41' width='300' height='300'/%3E%3Ccircle cx='150' cy='120' r='50' fill='%23E2A539'/%3E%3Cpath d='M 90 250 Q 150 200 210 250' fill='%23E2A539'/%3E%3Ctext x='150' y='280' font-family='Arial' font-size='14' fill='%238A8CA0' text-anchor='middle'%3EArnold Tsunga%3C/text%3E%3C/svg%3E" alt="Arnold Tsunga"`
- **Replace:** `src="images/team/arnold-tsunga.jpg" alt="Arnold Tsunga - Managing Partner"`

Repeat for each staff member with their specific name and photo filename.

---

## 📷 WHERE TO GET PROFESSIONAL PHOTOS

### For Staff Photos

**Option 1: Professional Photographer**
- Hire local photographer
- Consistent lighting and background
- Professional quality guaranteed
- Cost: $50-200 for 8 photos

**Option 2: DIY Professional Look**
- Good smartphone camera (iPhone, Samsung)
- Natural lighting (near window)
- Solid background (white wall, office)
- Edit with free apps (Snapseed, VSCO)

**Photo Guidelines:**
- Face should occupy 60-80% of frame
- Eye level camera position
- Smile naturally
- Professional attire
- Remove distractions from background

### For News Photos

**Free Stock Photos:**
- Unsplash: https://unsplash.com/
- Pexels: https://pexels.com/
- Pixabay: https://pixabay.com/

**Search Terms:**
- "law office"
- "business meeting"
- "legal documents"
- "office professionals"
- "courtroom"
- "Zimbabwe business"

**Custom Photos:**
- Office photos
- Event photos
- Team gatherings
- Document signing ceremonies
- Court appearances

---

## ✅ TESTING CHECKLIST

After adding images:

- [ ] All staff photos load correctly
- [ ] All news images load correctly
- [ ] Images are not pixelated or blurry
- [ ] Modal popups show correct images
- [ ] Images load fast (under 2 seconds)
- [ ] Mobile version displays images properly
- [ ] Alt text is descriptive
- [ ] File sizes are optimized

---

## 🐛 TROUBLESHOOTING

### Image Not Showing

**Problem:** Image appears as broken icon
**Solutions:**
1. Check file path is correct
2. Verify file was uploaded
3. Check file name spelling (case-sensitive)
4. Ensure image file isn't corrupted
5. Clear browser cache (Ctrl+Shift+R)

### Image Too Large/Slow

**Problem:** Page loads slowly
**Solutions:**
1. Compress images (use TinyPNG)
2. Reduce dimensions (500x500 for staff, 1200x630 for news)
3. Convert to WebP format (better compression)
4. Use image optimization tools

### Image Looks Stretched

**Problem:** Image doesn't fit properly
**Solutions:**
1. Ensure correct aspect ratio (square for staff, 1.91:1 for news)
2. Use `background-size: cover` (already in code)
3. Crop image before uploading

### Wrong Image Shows in Modal

**Problem:** Clicking card shows different image
**Solutions:**
1. Check script.js has correct image path
2. Verify modal ID matches (team1, news1, etc.)
3. Clear browser cache

---

## 📝 SUMMARY

### Files to Edit:
1. **index.html** - Update all image src attributes (14 staff + 12 news = 26 changes)
2. **script.js** - Update all modal images (8 staff + 6 news = 14 changes)

### Folders to Create:
- `images/team/` - Upload 8 staff photos
- `images/news/` - Upload 6 news images

### Total Images Needed:
- **8 staff photos** (500x500px each, under 200 KB)
- **6 news images** (1200x630px each, under 300 KB)

---

## 🚀 QUICK ACTION PLAN

1. **Prepare images** (get photos, optimize)
2. **Create folders** (images/team/ and images/news/)
3. **Upload images** (via cPanel or FTP)
4. **Edit index.html** (update 26 image paths)
5. **Edit script.js** (update 14 modal images)
6. **Test website** (check all images load)
7. **Clear cache** (Ctrl+Shift+R)
8. **Done!** ✅

---

**Need Help?**
- Email: info@tsungalawinc.africa
- Phone: +263 777 283 249

**Estimated Time:** 30-60 minutes (including image preparation)

**Good luck!** 📸✨
