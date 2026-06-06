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
| AI / ML Engine | PyTorch + HuggingFace Transformers | Zero-shot visual extraction & text classification |
| Image Pre-processing | Pillow | Image normalization, manipulation |
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

#### Synthetic RLHF Dataset
- **Source:** Generated programmatically
- **Size:** Base 50 examples, expanding via Human Feedback
- **Classes:** 5 Urgency Tiers
- **Annotations:** Text → Severity mapping
- **Use:** Fine-tune custom BERT model

#### Combined Dataset Summary

| Source | Tasks |
|---|---|
| Synthetic Tier Database | Tier Classification |
| NGO RLHF Corrections | Continuous Learning |

---

## 4. AI / ML MODELS

### 4.1 Model A: Vision-Language Agent — Moondream2

**Architecture:** Moondream2 (1.8B Parameter VLM)

| Property | Value |
|---|---|
| Framework | PyTorch (HuggingFace Transformers) |
| Pretrained Weights | Moondream2 (vikhyatk/moondream2) |
| Function | Zero-shot visual question answering & dense captioning |
| Input Size | Any image resolution |
| Output | Natural language description of species, posture, and visible injuries |
| Inference Speed | ~1-2 seconds on CPU |
| Parameters | 1.8B |

**Why Moondream2?**
- Eliminates the need for traditional bounding-box datasets
- Can extract highly nuanced, semantic descriptions (e.g., "limping", "visible distress")
- Acts as the "Eyes" of the pipeline, providing raw textual data for downstream processing.

---

### 4.2 Model B: Custom Injury Tier Classifier (RLHF Fine-Tuned BERT)

**Architecture:** Fine-Tuned BERT (`prajjwal1/bert-tiny` core)

| Property | Value |
|---|---|
| Framework | PyTorch + HuggingFace `transformers` |
| Training Method | Supervised Fine-Tuning + RLHF |
| Input Data | Raw text output generated by Moondream2 |
| Output | Softmax probabilities over 5 Urgency Tiers (MONITOR, LOW, MEDIUM, HIGH, CRITICAL) |
| Inference Speed | ~50 ms (Lightning fast) |
| Parameters | 4.4M |

**The RLHF Pipeline (Reinforcement Learning from Human Feedback):**
In this platform, RLHF is the bridge between human veterinary expertise and artificial intelligence. While the data collection happens **automatically**, the actual training happens offline so the web server is not impacted. Here is exactly how it works:

1. **The Pre-Trained AI Makes a Prediction:** When a citizen uploads a photo, the Vision Model (Moondream2) looks at the image and generates a text description (e.g., *"A brown street dog with a severe open wound..."*). That text is passed to the custom BERT model, which makes an initial Urgency Tier prediction (e.g., `HIGH`).
2. **The Human Reward Signal (Automatic Data Collection):** An NGO Admin sees this report on their dashboard, realizes the injury is actually life-threatening, and manually corrects the tier from `HIGH` to `CRITICAL`. The moment they save this change, the backend automatically pairs the AI's original visual description with the Admin's corrected tier and logs it into `rlhf_dataset.json`. This acts as the "Human Feedback" or reward signal.
3. **The Reinforcement Learning (Scheduled Re-Training):** Once the dataset has grown with hundreds of corrections, the automated `retrain_scheduler.py` script runs. The BERT model undergoes **Supervised Fine-Tuning based on Human Preferences**. It mathematically adjusts its internal weights, getting "penalized" for its old wrong answers and "rewarded" for matching the human's preferred answers. A **Majority Voting** algorithm resolves any conflicting corrections between different NGO Admins.
4. **The Result (A Smarter AI):** Once the new weights are saved and loaded into the live server, the AI becomes smarter. The next time a citizen uploads a photo with similar symptoms, the AI will confidently predict `CRITICAL` right out of the gate. By having humans "in the loop", the model trains itself over time, aligning with professional medical standards without requiring new code.

**RLHF Automation Scripts** (inside `custome_model/`):

| File | Purpose |
|---|---|
| `retrain_scheduler.py` | Main Python scheduler — checks sample threshold, backs up old model, runs training, logs all activity |
| `setup_windows_scheduler.bat` | Registers a Windows Task Scheduler job (runs every Sunday at 2:00 AM) |
| `setup_cron.sh` | Adds a Linux/Mac cron job entry (runs every Sunday at 2:00 AM) |

The scheduler includes safeguards:
- **Threshold Gate:** Only retrains when ≥ 5 new human corrections exist (configurable).
- **Model Backups:** Automatically backs up the current model before every retrain. Keeps the last 5 backups.
- **Full Logging:** All activity is written to `retrain_log.txt` for auditing.

```bash
# Manual usage
python retrain_scheduler.py --dry-run         # Check status without training
python retrain_scheduler.py --min-samples 10  # Train only if 10+ corrections exist
python retrain_scheduler.py                   # Run retraining now

# Windows: Register the weekly task (run as Administrator)
setup_windows_scheduler.bat

# Linux/Mac: Register the cron job
chmod +x setup_cron.sh && ./setup_cron.sh
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
  │  Image Pre-processor │  Pillow
  │  + GPS from form    │  + store on Cloudinary
  └─────────┬───────────┘
            │
      ┌─────┴──────┐
      │            │
      ▼            ▼
 ┌──────────┐  ┌──────────────────┐
 │Moondream2│  │ Custom RLHF BERT │
 │(Vision)  │  │ (Tier Predictor) │
 │          │  │                  │
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
    ai_confidence: float,    # 0.0–1.0
    detection_confidence: float, # 0.0–1.0 (from YOLOv8m)
    hours_since_report: float,   # hours elapsed since submission
    is_juvenile: bool            # pup/kitten = more vulnerable
) -> float:

    INJURY_WEIGHTS = {0: 0, 1: 25, 2: 50, 3: 75, 4: 100}
    base = INJURY_WEIGHTS[injury_class]

    # AI confidence factor
    confidence_factor = (ai_confidence * 0.7 + detection_confidence * 0.3)

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
    "ai_confidence": 0.88,
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
    "ai_confidence": 0.88
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

### 14.1 Proposed: Enriched Multimodal RLHF Dataset

Currently, the RLHF dataset only stores the Moondream text description and the human-corrected label. The proposed upgrade enriches every training sample to a **multimodal record**:

```json
[
  {
    "image_url": "https://res.cloudinary.com/.../cat_injury.jpg",
    "text": "A cat with a visible deep wound on its right leg, limping and unable to stand...",
    "label": 3,
    "animal": "cat",
    "confidence": 0.9,
    "source": "admin_correction",
    "corrected_from": 1,
    "annotator_id": "ngo_admin_xyz",
    "timestamp": "2026-06-06T14:30:00Z"
  }
]
```

| New Field | Purpose |
|---|---|
| `image_url` | Cloudinary URL — portable, no local storage needed. Training scripts download directly via HTTP |
| `animal` | Species label — enables species-specific expert model training in future |
| `confidence` | Annotator certainty (0.0–1.0) — enables **weighted loss** so uncertain corrections penalize less |
| `source` | `admin_correction` / `base_dataset` / `synthetic` — track data provenance |
| `corrected_from` | AI's original prediction — the true RLHF signal (the *delta* between AI and human) |
| `annotator_id` | Which NGO Admin corrected it — enables per-annotator trust scoring |
| `timestamp` | Correction time — enables filtering by recency, trend analysis |

### 14.2 Proposed: Phased AI Training Roadmap

The enriched dataset unlocks a clear progression from text-only to full multimodal intelligence:

```
Phase 1 — Current (Text-Only BERT)
  Input  : Moondream text description
  Output : Urgency Tier (0–4)
  Model  : bert-tiny (4.4M params)
  Status : ✅ LIVE

Phase 2 — Proposed (Text + Image Multimodal)
  Input  : Moondream text + Raw image (both together)
  Output : Urgency Tier (0–4)
  Model  : CLIP / ViLBERT / PaLI
  Benefit: AI sees the actual photo, not just a description
  Status : 🔵 Planned

Phase 3 — Future (Pure Vision CNN)
  Input  : Raw image only
  Output : Urgency Tier directly from pixels
  Model  : EfficientNet-B3 / ResNet50
  Benefit: No Moondream dependency — 10x faster inference
  Status : 🔵 Planned

Phase 4 — Advanced (Species-Specific Expert Models)
  Input  : Raw image, routed by detected species
  Output : Species-specific urgency tier
  Model  : Separate fine-tuned model per animal (dog, cat, cow, bird...)
  Benefit: Each model masters the injury patterns of one species
  Status : 🔵 Long-term
```

### 14.3 Other Future Features

| Feature | Description |
|---|---|
| **Mobile App** | React Native version for easier field reporting |
| **CCTV Integration** | Real-time video feed analysis with YOLOv8 |
| **LLM Case Summaries** | GPT-4V / Gemini Vision for detailed case descriptions |
| **Offline Mode** | On-device TFLite inference (no internet needed) |
| **Heatmap Analytics** | GIS-based urban stray density visualization |
| **Adoption Portal** | Rescued animals matched to potential adopters |
| **Dataset Export Tool** | Auto-query MongoDB and export enriched multimodal JSON |

---

## 14.4 Tiered RLHF Trust System — Citizen vs. Expert Feedback

### The Problem: Why Citizen Tier Overrides Are Not Used Currently

When a citizen submits a report, they can manually override the AI-predicted urgency tier before submitting. This is a valuable feedback signal — but it is **deliberately excluded** from the current RLHF training pipeline for three reasons:

| Risk | Explanation |
|---|---|
| **Emotional Over-Reporting** | Citizens who find an injured animal feel distress and tend to label everything `CRITICAL`. The AI would learn the wrong signal. |
| **Data Poisoning** | Any bad actor can create an account, submit fake reports with deliberately wrong labels, and corrupt the model. |
| **Annotation Noise** | An NGO Admin sees hundreds of cases and calibrates their judgment. A citizen sees 1–2 cases in a lifetime. Their label is a *feeling*, not an *expert assessment*. |

This is identical to the design of systems like ChatGPT — OpenAI uses **trained, vetted human annotators** for RLHF, not random users.

### The Solution: Tiered Trust Weights

Citizen feedback is genuinely valuable data but needs a **trust weight** applied during training so it cannot override expert knowledge:

```
RLHF Data Sources (Tiered by Trust):

  Tier 1 — NGO Admin Correction    →  trust_weight = 1.0  (expert, verified)
  Tier 2 — Citizen Override        →  trust_weight = 0.3  (layperson, unverified)
  Tier 3 — Citizen Majority Vote   →  trust_weight = 0.6  (if 3+ citizens agree)
```

The enriched dataset record would include a `trust_weight` and `annotator_role` field:

```json
{
  "image_url": "https://res.cloudinary.com/.../dog_wound.jpg",
  "text": "A dog with a visible open wound on its back leg, unable to stand...",
  "label": 4,
  "animal": "dog",
  "source": "citizen_override",
  "corrected_from": 2,
  "annotator_role": "citizen",
  "trust_weight": 0.3,
  "timestamp": "2026-06-06T14:30:00Z"
}
```

During training, the loss function is weighted — expert corrections influence model weights 3× more than citizen guesses:

```python
# Weighted Cross-Entropy Loss
loss = F.cross_entropy(logits, labels, reduction='none')
weighted_loss = (loss * trust_weights).mean()
```

### Data Flow Diagram

```
Citizen submits report
        │
        ├── AI predicts tier (e.g. HIGH)
        │
        ├── Citizen overrides to CRITICAL
        │            │
        │            ▼
        │    Saved to dataset:
        │    source: "citizen_override"
        │    trust_weight: 0.3     ← low influence
        │
        └── NGO Admin reviews and confirms CRITICAL
                     │
                     ▼
             Saved to dataset:
             source: "admin_correction"
             trust_weight: 1.0     ← full influence

Retrain: weighted loss ensures expert opinions dominate
```

### Implementation Status

| Component | Status |
|---|---|
| NGO Admin corrections → `rlhf_dataset.json` | ✅ Implemented |
| Citizen tier overrides → `rlhf_dataset.json` | 🔵 Proposed |
| Weighted loss training | 🔵 Proposed |
| Per-annotator trust scoring | 🔵 Proposed |
| Citizen majority-vote validation | 🔵 Proposed |


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
