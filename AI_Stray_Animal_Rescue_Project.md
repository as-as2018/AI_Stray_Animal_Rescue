# 🐾 PROJECT DOCUMENTATION: AI-Powered Stray Animal Rescue & Triage Platform

---

## 1. PROJECT ABSTRACT

**Title:** AI-Powered Stray Animal Rescue & Triage System
**Author/Lead Developer:** Aman
**Category:** Artificial Intelligence / Computer Vision / Social Welfare
**Type:** College Final Year Project (Web Application)
**Version:** 2.0
**Date:** February 2026

---

### Overview

Millions of stray animals suffer in urban environments due to delayed reporting, inaccurate location tracking, and lack of prioritization. Rescue NGOs and municipal teams are overwhelmed, often reaching critical animals too late.

This platform introduces a **centralized, AI-driven web-based rescue management system** that enables citizens to report distressed animals via a web browser. The system leverages **state-of-the-art Computer Vision and Deep Learning** to:

1. **Detect and identify** the animal species (dog, cat, crow, monkey, cow, etc.)
2. **Assess health condition** (healthy, injured, severely injured, dead) from the uploaded image
3. **Capture location info** from the browser's Geolocation API
4. **Compute a dynamic Urgency Score** combining AI confidence, injury severity, and time elapsed
5. **Route the case** to the nearest registered NGO/veterinary team
6. **Provide a real-time admin dashboard** for case lifecycle management

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js + Vite | Citizen reporting UI + NGO dashboard |
| Backend API | Python (FastAPI) | REST API + synchronous ML inference |
| AI / ML Engine | PyTorch + Ultralytics YOLOv8 | Object detection & classification |
| Image Pre-processing | OpenCV, Pillow | Image normalization, EXIF extraction |
| Database | MongoDB Atlas | Reports, users, NGO records |
| ODM | Beanie (async MongoDB ODM) | Pydantic-based async MongoDB models |
| Storage | Cloudinary | Image upload, storage, CDN delivery |
| Maps | Leaflet.js + OpenStreetMap | GPS visualization (free, no API key) |
| Auth | JWT + OAuth2 (FastAPI Security) | User and admin authentication |
| Email Alerts | SMTP (Gmail / SendGrid free tier) | NGO case notification via email |
| Deployment | Render / Railway (Backend) + Vercel (Frontend) | Free college-grade hosting |

> **Note:** No Redis, no Celery, no push notifications — all ML inference is **synchronous** within the FastAPI request-response cycle.

---

## 3. DATASETS

### 3.1 Model A — Species Detection & Classification

#### Primary Dataset: Oxford-IIIT Pet Dataset
- **Source:** [https://www.robots.ox.ac.uk/~vgg/data/pets/](https://www.robots.ox.ac.uk/~vgg/data/pets/)
- **Size:** 7,349 images | 37 classes (25 dog breeds + 12 cat breeds)
- **Annotations:** Bounding boxes (head), pixel-level segmentation, breed & species labels
- **Use:** Fine-tune YOLOv8 for dog/cat detection and breed classification
- **Format:** PASCAL VOC XML → converted to YOLO `.txt` format

#### Secondary Dataset: Roboflow — Stray Animal Detection
- **Source:** Roboflow Universe — "Stray Animal Detection" (Nov 2024)
- **Size:** ~3,500 images | Classes: `stray_dog`, `stray_cat`, `stray_cow`, `stray_monkey`
- **Annotations:** YOLO format bounding boxes
- **Use:** Domain-specific stray animal detection in real urban environments
- **Download:** [https://universe.roboflow.com/](https://universe.roboflow.com/)

#### Tertiary Dataset: Open Images V7 (Animal Subset)
- **Source:** [https://storage.googleapis.com/openimages/web/index.html](https://storage.googleapis.com/openimages/web/index.html)
- **Size:** Filtered for: `Dog`, `Cat`, `Crow`, `Monkey`, `Cattle` (~15,000 images)
- **Annotations:** Bounding boxes
- **Use:** Augment training with diverse real-world backgrounds

#### Combined Species Dataset Summary

| Source | Images | Classes | Task |
|---|---|---|---|
| Oxford-IIIT Pets | 7,349 | 37 breeds (dogs + cats) | Fine-grained species classification |
| Roboflow Stray Animal | ~3,500 | 4 stray categories | Domain-specific detection |
| Open Images V7 (filtered) | ~15,000 | 5 urban animal types | Diversity augmentation |
| **Total (after dedup)** | **~24,000** | **10+ classes** | **Detection + Classification** |

---

### 3.2 Model B — Health Condition / Injury Assessment

#### Primary Dataset: Roboflow — Injured Animal Detector
- **Source:** Roboflow Universe — "injured-animal-detector" (Updated 2024)
- **Size:** ~1,800 images
- **Classes:** `healthy`, `injured`, `severely_injured`, `dead`
- **Annotations:** Classification labels + bounding boxes for wound regions
- **Download:** [https://universe.roboflow.com/](https://universe.roboflow.com/)

#### Secondary Dataset: Kaggle — Animal Wound & Skin Condition
- **Source:** Kaggle — "Animal Wound and Skin Condition Dataset"
- **Size:** ~2,200 images | Classes: `normal`, `wound`, `skin_disease`, `fracture_suspected`
- **Use:** Supplement injury classifier with diverse wound types

#### Custom Data Collection Plan
- Partner with 2–3 local NGOs to collect labeled real-world images
- Target: **300+ images per class** over 2 months
- Labeling Tool: **Label Studio** (free, open-source, self-hosted on localhost)
- Annotation by: 1 veterinarian + 1 AI engineer, agreement > 0.80 (Cohen's Kappa)

#### Combined Injury Dataset Summary

| Source | Images | Classes | Task |
|---|---|---|---|
| Roboflow Injured Animal | ~1,800 | 4 severity levels | Injury detection |
| Kaggle Wound Dataset | ~2,200 | 4 wound types | Wound type detection |
| NGO Custom Data | ~1,500 (target) | 5-tier severity | Domain fine-tuning |
| **Total** | **~5,500** | **5 classes** | **Injury Triage** |

---

## 4. AI / ML MODELS

### 4.1 Model A: Animal Species Detection — YOLOv8m

**Architecture:** YOLOv8 Medium (`yolov8m.pt`) by Ultralytics

| Property | Value |
|---|---|
| Framework | PyTorch (via Ultralytics library) |
| Pretrained Weights | COCO 2017 (80 classes, 330K images) |
| Fine-tuned On | Oxford-IIIT Pets + Roboflow Stray + Open Images subset |
| Input Size | 640 × 640 px (auto-letterboxed) |
| Output | Bounding boxes + class labels + confidence scores |
| Inference Speed (CPU) | ~180–250 ms/image on college server CPU |
| Expected mAP@0.5 | ~0.87 (after fine-tuning) |
| Parameters | 25.9M |

**Why YOLOv8m?**
- Best speed-accuracy trade-off for CPU-based synchronous inference
- Simple `model.predict()` API — easy to integrate with FastAPI
- Ships with Ultralytics: `pip install ultralytics` — no complex setup
- Actively maintained, excellent documentation for students

**Training Configuration:**
```yaml
# yolov8_species_train.yaml
model: yolov8m.pt
data: stray_animals.yaml
epochs: 80
imgsz: 640
batch: 16
optimizer: AdamW
lr0: 0.001
lrf: 0.01
weight_decay: 0.0005
augment: true        # Mosaic, MixUp, Albumentations
patience: 15         # Early stopping
device: cpu          # or cuda:0 if GPU available on Colab
```

**Free Training Platform:** Google Colab (T4 GPU, free tier)

---

### 4.2 Model B: Injury Severity Classification — EfficientNetV2-S

**Architecture:** EfficientNetV2-Small (`tf_efficientnetv2_s` via `timm`)

| Property | Value |
|---|---|
| Framework | PyTorch + `timm` library |
| Pretrained Weights | ImageNet-21k (14M images, 21,841 classes) |
| Fine-tuned On | Injured Animal Dataset (Roboflow + Kaggle + custom) |
| Input Size | 384 × 384 px |
| Output | Softmax probabilities over 5 severity classes |
| Inference Speed (CPU) | ~200–300 ms/image |
| Expected Top-1 Accuracy | ~80% (5-class) |
| Parameters | 21.5M |

**Severity Classes (5-Tier System):**

| Class | Label | Description |
|---|---|---|
| 0 | Healthy | No visible distress or injury |
| 1 | Mild Distress | Limping, minor wound, scared |
| 2 | Moderate Injury | Open wound, visible trauma, unable to run |
| 3 | Severe Injury | Immobile, multiple wounds, bleeding |
| 4 | Critical | Unresponsive, requires immediate life-saving care |

**Why EfficientNetV2-S?**
- Outperforms ResNet-50 on fine-grained classification tasks
- ImageNet-21k pretraining provides rich injury/texture feature representations
- Small enough (21.5M params) to run synchronously on a free Render.com server
- Easy to fine-tune with `timm` in < 30 lines of PyTorch code

**Training Configuration:**
```python
model_name    = "tf_efficientnetv2_s"
pretrained    = True            # ImageNet-21k weights
num_classes   = 5
input_size    = 384
batch_size    = 32
optimizer     = AdamW(lr=3e-4, weight_decay=1e-4)
scheduler     = CosineAnnealingLR(T_max=30)
loss_fn       = FocalLoss(gamma=2.0)  # Handles class imbalance
epochs        = 30
```

---

### 4.3 Inference Pipeline (Synchronous — No Queue)

```
User Uploads Image via React.js
           │
           ▼
  POST /api/v1/reports/
  (FastAPI endpoint)
           │
           ▼
  ┌─────────────────────┐
  │  Image Pre-processor │  OpenCV: resize, normalize
  │  + GPS from form    │  + store on Cloudinary
  └─────────┬───────────┘
            │
      ┌─────┴──────┐
      │            │
      ▼            ▼
 ┌──────────┐  ┌──────────────────┐
 │ YOLOv8m  │  │ EfficientNetV2-S │
 │ (Species │  │ (Injury Severity)│
 │  Detect.)│  │                  │
 └──────┬───┘  └────────┬─────────┘
        │               │
        └───────┬────────┘
                ▼
   ┌────────────────────────┐
   │  Urgency Score Engine  │
   │  (Python function)     │
   └────────────┬───────────┘
                │
                ▼
   ┌────────────────────────┐
   │  MongoDB Atlas Save    │
   └────────────┬───────────┘
                │
                ▼
   ┌────────────────────────┐
   │  Email Alert to NGO   │
   │  (SMTP / SendGrid)    │
   └────────────────────────┘
                │
                ▼
      JSON Response to UI
   (urgency_score, species,
    injury_label, report_id)
```

**Total estimated response time: 1.5 – 3 seconds** (synchronous, acceptable for a college demo)

---

## 5. URGENCY SCORE ALGORITHM

The **Urgency Score (0–100)** is a weighted Python function:

```python
def compute_urgency_score(
    injury_class: int,           # 0–4 (from EfficientNetV2-S)
    injury_confidence: float,    # 0.0–1.0
    detection_confidence: float, # 0.0–1.0 (from YOLOv8m)
    hours_since_report: float,   # hours elapsed since submission
    is_juvenile: bool            # pup/kitten = more vulnerable
) -> float:

    INJURY_WEIGHTS = {0: 0, 1: 25, 2: 50, 3: 75, 4: 100}
    base = INJURY_WEIGHTS[injury_class]

    # AI confidence factor
    confidence_factor = (injury_confidence * 0.7 + detection_confidence * 0.3)

    # Time escalation (older unattended cases get higher priority)
    time_bonus = min(hours_since_report * 2.0, 20)

    # Vulnerability bonus
    vulnerability_bonus = 10 if is_juvenile else 0

    score = (base * confidence_factor) + time_bonus + vulnerability_bonus
    return min(round(score, 1), 100.0)

# Priority Tiers:
# 90–100 → 🔴 CRITICAL  (Dispatch immediately)
# 70–89  → 🟠 HIGH      (Dispatch within 1 hour)
# 40–69  → 🟡 MEDIUM    (Dispatch within 4 hours)
# 10–39  → 🟢 LOW       (Schedule routine patrol)
# 0–9    → ⚪ MONITOR   (Healthy, log and watch)
```

---

## 6. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER (CLIENT)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               React.js + Vite (SPA)                   │  │
│  │  ┌─────────────────┐    ┌────────────────────────────┐│  │
│  │  │  Citizen Portal  │    │   NGO / Admin Dashboard   ││  │
│  │  │  - Report form   │    │   - Live reports table    ││  │
│  │  │  - GPS capture   │    │   - Map view (Leaflet.js) ││  │
│  │  │  - Image upload  │    │   - Urgency score filter  ││  │
│  │  └─────────────────┘    └────────────────────────────┘│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────┘
                                  │  HTTPS REST API
┌─────────────────────────────────▼───────────────────────────┐
│                    FASTAPI BACKEND (Python)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Auth Router│  │ Reports API  │  │  Admin Router        │ │
│  │  /auth/     │  │ /api/v1/     │  │  /api/v1/admin/      │ │
│  └─────────────┘  └──────┬───────┘  └─────────────────────┘ │
│                           │                                   │
│              ┌────────────┴──────────┐                       │
│              ▼                       ▼                       │
│        ┌──────────┐         ┌─────────────────┐             │
│        │ YOLOv8m  │         │ EfficientNetV2-S│             │
│        │ (Species)│         │ (Injury)        │             │
│        └──────────┘         └─────────────────┘             │
│                    Urgency Score Engine                       │
│                    SMTP Email Notifier                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌──────────────┐
   │ MongoDB    │   │ Cloudinary │   │  SMTP/Email  │
   │ Atlas      │   │ (Images)   │   │  (SendGrid)  │
   └────────────┘   └────────────┘   └──────────────┘
```

---

## 7. DATABASE SCHEMA (MongoDB)

### Collection: `reports`
```json
{
  "_id": "ObjectId",
  "report_id": "RPT-2026-0001",
  "status": "pending | assigned | in_progress | resolved",
  "urgency_score": 87.5,
  "urgency_tier": "HIGH",
  "created_at": "2026-02-20T14:30:00Z",
  "updated_at": "2026-02-20T15:00:00Z",

  "reporter": {
    "user_id": "ObjectId",
    "name": "Aman Sharma",
    "email": "aman@example.com",
    "phone": "+91-9876543210"
  },

  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Connaught Place, New Delhi, 110001"
  },

  "media": {
    "image_url": "https://res.cloudinary.com/stray-rescue/reports/img_001.jpg",
    "thumbnail_url": "https://res.cloudinary.com/.../img_001_thumb.jpg"
  },

  "ai_analysis": {
    "species": "dog",
    "breed_estimate": "Indian Pariah Dog",
    "detection_confidence": 0.94,
    "injury_class": 3,
    "injury_label": "Severe Injury",
    "injury_confidence": 0.88,
    "is_juvenile": false,
    "model_version": "yolov8m-v1.2 | effnetv2s-v1.0",
    "inference_time_ms": 2100
  },

  "assignment": {
    "ngo_id": "ObjectId",
    "ngo_name": "Friendicoes Delhi",
    "assigned_at": "2026-02-20T14:45:00Z",
    "responder_name": "Dr. Priya Mehta",
    "resolved_at": null
  },

  "description": "Dog lying near flyover, not moving",
  "outcome": {
    "animal_rescued": true,
    "vet_notes": "Hind leg fracture, admitted for treatment"
  }
}
```

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "Aman Sharma",
  "email": "aman@example.com",
  "password_hash": "bcrypt_hash",
  "role": "citizen | ngo_admin | super_admin",
  "reports_submitted": 12,
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Collection: `ngos`
```json
{
  "_id": "ObjectId",
  "name": "Friendicoes SECA",
  "city": "New Delhi",
  "coverage_radius_km": 15,
  "location": { "latitude": 28.6139, "longitude": 77.2090 },
  "contact_email": "rescue@friendicoes.org",
  "is_active": true,
  "total_rescues": 1248
}
```

---

## 8. API DESIGN

### Base URL: `http://localhost:8000/api/v1` (dev) | `https://stray-rescue.onrender.com/api/v1` (prod)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new user |
| `POST` | `/auth/login` | Public | Login, get JWT token |
| `GET` | `/auth/me` | Citizen | Get current user profile |
| `POST` | `/reports/` | Citizen | Submit report + image (AI runs here) |
| `GET` | `/reports/` | Citizen | Get own reports |
| `GET` | `/reports/{id}` | Citizen/NGO | Get single report detail |
| `GET` | `/admin/reports` | NGO/Admin | Get all reports (with filters) |
| `PATCH` | `/admin/reports/{id}` | NGO/Admin | Update status / assign to NGO |
| `GET` | `/admin/ngos` | Admin | List all NGOs |
| `POST` | `/admin/ngos/` | Admin | Register new NGO |
| `GET` | `/health` | Public | API health check |

### Sample: Submit Report
```http
POST /api/v1/reports/
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Fields:
  image        → binary file (jpg/png)
  latitude     → 28.6139
  longitude    → 77.2090
  description  → "Dog lying near flyover, not moving"
```

### Sample Response (200 OK)
```json
{
  "status": "success",
  "report_id": "RPT-2026-0001",
  "urgency_score": 87.5,
  "urgency_tier": "HIGH",
  "ai_result": {
    "species": "dog",
    "injury_label": "Severe Injury",
    "detection_confidence": 0.94,
    "injury_confidence": 0.88
  },
  "message": "Report submitted. An NGO has been notified via email."
}
```

---

## 9. WORKING FLOW (Detailed)

### 9.1 Citizen Workflow
```
1. Open web app in browser
2. Register / Login
3. Click "Report Animal"
4. Upload photo from device
5. Click "Use My Location" (browser Geolocation API)
6. Optionally add description text
7. Click Submit
8. See result card:
   - Species detected ("Dog - Indian Pariah")
   - Injury severity ("Severe Injury")
   - Urgency Score (87.5 / 100 — HIGH 🟠)
   - Status: "NGO has been notified via email"
9. Track status on "My Reports" page
```

### 9.2 System (AI) Workflow
```
1. Image + form data received at FastAPI POST /reports/
2. Image uploaded to Cloudinary → CDN URL returned
3. YOLOv8m runs synchronously:
   → Detects animal + bounding box + species + confidence
4. Cropped animal region sent to EfficientNetV2-S:
   → Returns injury class (0–4) + confidence
5. Urgency Score computed via Python function
6. Nearest active NGO queried from MongoDB
7. Email sent to NGO contact email (SMTP/SendGrid)
8. Report document saved to MongoDB Atlas
9. JSON response returned to frontend (< 3 sec)
```

### 9.3 NGO Admin Workflow
```
1. NGO admin receives email alert: "New CRITICAL case in your area"
2. Login to admin dashboard on web
3. View prioritized report table (sorted by urgency score)
4. Click report → see photo + AI analysis + map pin (Leaflet.js)
5. Change status: "Assigned" → "In Progress" → "Resolved"
6. Add vet notes on resolution
7. View monthly stats (total reports, resolution rate, avg response time)
```

---

## 10. REQUIREMENTS

### 10.1 Python Backend (requirements.txt)
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
beanie==1.25.0
motor==3.3.2
pydantic==2.6.0
ultralytics==8.1.0          # YOLOv8
torch==2.2.0
torchvision==0.17.0
timm==0.9.12                # EfficientNetV2
Pillow==10.2.0
opencv-python-headless==4.9.0.80
cloudinary==1.39.0          # Image storage
python-jose[cryptography]   # JWT
passlib[bcrypt]             # Password hashing
sendgrid==6.11.0            # Email notifications
python-multipart==0.0.9
python-dotenv==1.0.0
```

### 10.2 React Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "@tanstack/react-query": "^5.0.0",
    "react-dropzone": "^14.2.3",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### 10.3 Hardware & Hosting

| Environment | Option |
|---|---|
| **Development** | Any laptop: 8 GB RAM, Python 3.11, Node.js 20 |
| **Model Training** | Google Colab (free T4 GPU) |
| **Backend Hosting** | [Render.com](https://render.com) — Free tier (512 MB RAM) |
| **Frontend Hosting** | [Vercel](https://vercel.com) — Free tier |
| **Database** | MongoDB Atlas — Free M0 cluster (512 MB) |
| **Image Storage** | Cloudinary — Free tier (25 GB storage) |
| **Email** | SendGrid — Free tier (100 emails/day) |

**Total monthly cost for college project: ₹0 (entirely free tier)**

### 10.4 Environment Variables (.env)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/stray_rescue
SECRET_KEY=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SENDGRID_API_KEY=SG.your_sendgrid_key
YOLO_MODEL_PATH=./models/yolov8m_stray.pt
EFFNET_MODEL_PATH=./models/effnetv2s_injury.pt
```

---

## 11. FOLDER STRUCTURE

```
AI_Stray_Animal_Rescue/
│
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Env vars + settings
│   │   ├── database.py             # MongoDB / Beanie init
│   │   ├── models/                 # Beanie document models
│   │   │   ├── report.py
│   │   │   ├── user.py
│   │   │   └── ngo.py
│   │   ├── routers/
│   │   │   ├── auth.py             # /auth endpoints
│   │   │   ├── reports.py          # /api/v1/reports
│   │   │   └── admin.py            # /api/v1/admin
│   │   ├── services/
│   │   │   ├── ml_inference.py     # YOLOv8 + EfficientNetV2 pipeline
│   │   │   ├── urgency_score.py    # Score computation function
│   │   │   ├── cloudinary_svc.py   # Image upload service
│   │   │   └── email_svc.py        # SendGrid email alerts
│   │   └── schemas/                # Pydantic request/response schemas
│   ├── models/                     # Trained .pt model weights
│   │   ├── yolov8m_stray.pt
│   │   └── effnetv2s_injury.pt
│   └── requirements.txt
│
├── frontend/                       # React.js + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ReportPage.jsx      # Citizen report form
│   │   │   ├── MyReports.jsx
│   │   │   ├── AdminDashboard.jsx  # NGO admin panel
│   │   │   └── LoginPage.jsx
│   │   ├── components/
│   │   │   ├── MapView.jsx         # Leaflet.js map
│   │   │   ├── UrgencyBadge.jsx
│   │   │   ├── ReportCard.jsx
│   │   │   └── ImageDropzone.jsx
│   │   └── services/
│   │       └── api.js              # Axios API client
│   ├── public/
│   └── package.json
│
├── training/                       # Jupyter Notebooks for model training
│   ├── 01_species_detection.ipynb  # YOLOv8 training notebook
│   └── 02_injury_classifier.ipynb  # EfficientNetV2-S training notebook
│
└── AI_Stray_Animal_Rescue_Project.md
```

---

## 12. SETUP & RUN (Local Development)

```bash
# 1. Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Fill in your keys
uvicorn app.main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                  # Runs at http://localhost:5173

# 3. Access
Citizen App  → http://localhost:5173
Admin Panel  → http://localhost:5173/admin
API Docs     → http://localhost:8000/docs   (FastAPI Swagger UI)
```

---

## 13. PROJECT OBJECTIVES & SUCCESS METRICS

### Primary Objectives
1. **Automate Triage** — Reduce manual assessment time to < 3 seconds (AI inference)
2. **Accurate Detection** — mAP@0.5 > 0.85 for species | Accuracy > 80% for injury severity
3. **Easy Reporting** — Any citizen can report in < 2 minutes with browser
4. **NGO Empowerment** — Dashboard reduces case management overhead by ~60%

### Evaluation Metrics

#### ML Model Performance
| Metric | Model A (Species) | Model B (Injury) |
|---|---|---|
| mAP@0.5 / Accuracy | > 0.87 | > 80% |
| Precision | > 0.85 | > 0.78 |
| Recall | > 0.83 | > 0.76 |
| F1 Score | > 0.84 | > 0.77 |
| Inference Time (CPU) | < 250 ms | < 300 ms |

#### System Performance
| Metric | Target |
|---|---|
| End-to-end API response | < 3 seconds |
| Uptime (Render free tier) | > 95% |
| Email delivery (SendGrid) | > 98% |

---

## 14. FUTURE SCOPE

| Feature | Description |
|---|---|
| **Mobile App** | React Native version (post-college) |
| **CCTV Integration** | Real-time video feed analysis with YOLOv8 |
| **LLM Integration** | GPT-4V / Gemini Vision for detailed case summaries |
| **Offline Mode** | On-device TFLite inference (no internet needed) |
| **Heatmap Analytics** | Urban stray density visualization |
| **Adoption Portal** | Rescued animals matched to adopters |

---

## 15. REFERENCES

### Datasets
- Oxford-IIIT Pet Dataset: [https://www.robots.ox.ac.uk/~vgg/data/pets/](https://www.robots.ox.ac.uk/~vgg/data/pets/)
- Roboflow Universe (Stray + Injured): [https://universe.roboflow.com/](https://universe.roboflow.com/)
- Open Images V7: [https://storage.googleapis.com/openimages/web/index.html](https://storage.googleapis.com/openimages/web/index.html)

### Models & Libraries
- Ultralytics YOLOv8: [https://docs.ultralytics.com/](https://docs.ultralytics.com/)
- PyTorch Image Models (timm): [https://huggingface.co/timm](https://huggingface.co/timm)
- FastAPI: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- Beanie ODM: [https://beanie-odm.dev/](https://beanie-odm.dev/)

### Research Papers
- Redmon et al. — *"You Only Look Once: Unified, Real-Time Object Detection"* (CVPR 2016)
- Tan & Le — *"EfficientNetV2: Smaller Models and Faster Training"* (ICML 2021)
- Parkhi et al. — *"Cats and Dogs"* (CVPR 2012) — Oxford-IIIT Pets Dataset

---

*Last Updated: February 2026 | Version 2.0 (Web-Only, College Edition)*
*Project by Aman — AI & Web Developer*
