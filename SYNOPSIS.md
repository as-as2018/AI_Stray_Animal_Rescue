# PROJECT SYNOPSIS

---

## AI-POWERED STRAY ANIMAL RESCUE & TRIAGE PLATFORM

---

| Field                | Details                                                    |
|----------------------|------------------------------------------------------------|
| **Project Title**    | AI-Powered Stray Animal Rescue & Triage System             |
| **Author**           | Aman                                                       |
| **Type**             | College Final Year Project (Web Application)               |
| **Domain**           | Artificial Intelligence / Computer Vision / Social Welfare |
| **Category**         | AI & ML — Full Stack Web Application                       |
| **Version**          | 2.0                                                        |
| **Date**             | February 2026                                              |

---

## 1. INTRODUCTION

Millions of stray animals suffer across urban India due to delayed emergency response, inaccurate location tracking, and the absence of a prioritized, data-driven rescue system. Rescue NGOs and municipal animal welfare teams are chronically overwhelmed and often reach critically injured animals too late — a consequence of relying on manual, unstructured reporting via phone calls and social media.

This project proposes and implements a **centralized, AI-driven, web-based Rescue Management Platform** that empowers ordinary citizens to report distressed animals through any web browser. Using state-of-the-art Computer Vision and Deep Learning, the system automates the entire triage pipeline — from species identification to injury severity assessment — and routes cases to the nearest registered NGO with a computed urgency score, eliminating human guesswork in prioritization.

---

## 2. PROBLEM STATEMENT

Stray animal welfare in urban India faces three critical operational challenges:

1. **No Standardized Reporting Channel** — Citizens use phone calls, social media, or WhatsApp groups to report distressed animals. Reports are unstructured, duplicate-prone, and untracked.
2. **Manual Triage is Slow and Inaccurate** — NGO volunteers manually assess injury severity from verbal descriptions or photos sent informally, leading to misclassification and poor resource allocation.
3. **No Prioritization Mechanism** — Without a scoring system, all reports are treated with equal urgency, causing rescuers to respond to low-severity cases while critical animals perish.

**The Impact:** NGOs report that up to **40% of critical cases** receive delayed responses due to the above operational gaps.

---

## 3. OBJECTIVES

1. **Automate Animal Triage** — Reduce manual injury assessment time from minutes to under 3 seconds using AI inference.
2. **Accurate Species & Injury Detection** — Achieve mAP@0.5 > 0.87 for species detection and Top-1 Accuracy > 80% for 5-class injury severity classification.
3. **Easy Public Reporting** — Enable any citizen to submit a geotagged animal distress report in under 2 minutes from any browser.
4. **NGO Empowerment** — Provide an admin dashboard that reduces case management overhead by ~60% through intelligent prioritization and real-time status tracking.
5. **Zero-Cost Deployment** — Build entirely on free-tier cloud infrastructure suitable for a college project.

---

## 4. PROPOSED SOLUTION

The platform is a full-stack web application with three integrated components:

### 4.1 Citizen Reporting Portal
A React.js progressive web interface where any user can:
- Register/Login with JWT-secured accounts
- Upload a photo of a distressed animal (drag-and-drop or camera)
- Capture GPS location from the browser's Geolocation API
- Submit the report and immediately receive AI-generated triage results

### 4.2 AI Triage Engine (Backend — FastAPI)
A synchronous Python inference pipeline that runs upon every report submission:
- **Model A (Species Detection):** YOLOv8m fine-tuned on ~24,000 images detects and classifies the animal species (dog, cat, crow, monkey, cow, etc.) with bounding boxes and confidence scores.
- **Model B (Injury Severity Classifier):** EfficientNetV2-S fine-tuned on ~5,500 labeled injury images classifies the animal's health condition into 5 tiers: Healthy → Mild Distress → Moderate Injury → Severe Injury → Critical.
- **Urgency Score Engine:** A deterministic Python function combines injury class, AI confidence, time elapsed, and vulnerability factors to compute a priority score (0–100).

### 4.3 NGO Admin Dashboard
A web panel for registered rescue organizations featuring:
- Prioritized, filterable reports table (sorted by urgency score)
- Interactive map (Leaflet.js + OpenStreetMap) showing all active cases as GPS pins
- Case lifecycle management (Pending → Assigned → In Progress → Resolved)
- Monthly analytics charts (total reports, resolution rates, average response time)

---

## 5. TECHNOLOGY STACK

| Layer              | Technology                        | Purpose                                      |
|--------------------|-----------------------------------|----------------------------------------------|
| Frontend           | React.js + Vite                   | Citizen portal + NGO admin dashboard (SPA)   |
| Backend API        | Python + FastAPI                  | REST API, synchronous ML inference           |
| AI — Detection     | PyTorch + Ultralytics YOLOv8m     | Animal species detection & classification    |
| AI — Classification| PyTorch + timm (EfficientNetV2-S) | 5-class injury severity assessment           |
| Image Processing   | OpenCV, Pillow                    | Pre-processing, normalization                |
| Database           | MongoDB Atlas + Beanie ODM        | Reports, users, NGO records                  |
| Image Storage      | Cloudinary CDN                    | Photo upload, storage, and delivery          |
| Maps               | Leaflet.js + OpenStreetMap        | GPS visualization (no API key required)      |
| Authentication     | JWT + OAuth2 (FastAPI Security)   | Role-based access (citizen/NGO/super-admin)  |
| Email Alerts       | SendGrid / SMTP (Gmail)           | Automated NGO notification on new reports    |
| Deployment         | Render (backend) + Vercel (frontend) | Free-tier cloud hosting                  |

---

## 6. AI MODELS & DATASETS

### Model A — Species Detection: YOLOv8m

| Property           | Value                                       |
|--------------------|---------------------------------------------|
| Architecture       | YOLOv8 Medium (Ultralytics)                 |
| Pretrained Weights | COCO 2017 (80 classes, 330K images)         |
| Fine-tuned Dataset | Oxford-IIIT Pets + Roboflow Stray + Open Images (~24,000 images total) |
| Input Resolution   | 640 × 640 px                                |
| Expected mAP@0.5   | > 0.87                                      |
| Inference Speed    | ~180–250 ms/image (CPU)                     |
| Parameters         | 25.9 M                                      |

### Model B — Injury Severity: EfficientNetV2-S

| Property           | Value                                              |
|--------------------|----------------------------------------------------|
| Architecture       | EfficientNetV2-Small (via `timm` library)          |
| Pretrained Weights | ImageNet-21k (14M images, 21,841 classes)          |
| Fine-tuned Dataset | Roboflow Injured Animal + Kaggle Wound + NGO custom (~5,500 images) |
| Input Resolution   | 384 × 384 px                                       |
| Expected Accuracy  | > 80% (5-class Top-1)                              |
| Inference Speed    | ~200–300 ms/image (CPU)                            |
| Parameters         | 21.5 M                                             |

### Injury Severity Classes (5-Tier)

| Class | Label            | Description                                     |
|-------|------------------|-------------------------------------------------|
| 0     | Healthy          | No visible distress or injury                   |
| 1     | Mild Distress    | Limping, minor wound, scared                    |
| 2     | Moderate Injury  | Open wound, visible trauma, unable to run       |
| 3     | Severe Injury    | Immobile, multiple wounds, bleeding             |
| 4     | Critical         | Unresponsive, requires immediate life-saving care |

---

## 7. URGENCY SCORE ALGORITHM

A weighted, deterministic scoring function computes a **0–100 Priority Score** on every report:

```
score = (injury_weight × confidence_factor) + time_bonus + juvenile_bonus

Where:
  injury_weight      = {Healthy:0, Mild:25, Moderate:50, Severe:75, Critical:100}
  confidence_factor  = (ai_confidence × 0.7) + (detection_confidence × 0.3)
  time_bonus         = min(hours_elapsed × 2.0, 20)   [older cases escalate]
  juvenile_bonus     = 10 if pup/kitten, else 0

Priority Tiers:
  90–100  →  🔴 CRITICAL  (Dispatch immediately)
  70–89   →  🟠 HIGH      (Within 1 hour)
  40–69   →  🟡 MEDIUM    (Within 4 hours)
  10–39   →  🟢 LOW       (Schedule routine patrol)
   0–9    →  ⚪ MONITOR   (Healthy — log and watch)
```

---

## 8. SYSTEM ARCHITECTURE

```
USER (Browser)
      │  HTTPS
      ▼
React.js + Vite (SPA)
  ├── Citizen Portal (Report form, GPS, photo upload)
  └── NGO Admin Dashboard (Map, reports table, analytics)
      │  REST API calls
      ▼
FastAPI Backend (Python)
  ├── Auth Router      → JWT login/register
  ├── Reports Router   → POST /reports/ triggers full AI pipeline
  └── Admin Router     → Reports management, NGO control
       │
       ├── YOLOv8m       → Species detection
       ├── EfficientNetV2-S → Injury classification
       ├── Urgency Score Engine
       └── SendGrid Email Notifier
       │
       ├── MongoDB Atlas  (reports, users, NGOs)
       ├── Cloudinary     (image storage + CDN)
       └── SMTP/SendGrid  (email alerts to NGOs)
```

**End-to-end response time: 1.5 – 3 seconds** (fully synchronous, no task queues)

---

## 9. KEY API ENDPOINTS

| Method  | Endpoint                   | Access       | Description                          |
|---------|----------------------------|--------------|--------------------------------------|
| POST    | `/auth/register`           | Public       | Register new citizen account         |
| POST    | `/auth/login`              | Public       | Login — returns JWT token            |
| POST    | `/reports/`                | Citizen      | Submit report + image (AI runs here) |
| GET     | `/reports/`                | Citizen      | View own submitted reports           |
| GET     | `/admin/reports`           | NGO / Admin  | All reports with urgency filters     |
| PATCH   | `/admin/reports/{id}`      | NGO / Admin  | Update case status / assign NGO      |
| POST    | `/admin/ngos/`             | Super Admin  | Register new NGO                     |
| GET     | `/health`                  | Public       | API health check                     |

---

## 10. DATABASE SCHEMA OVERVIEW (MongoDB)

Three primary collections:

- **`reports`** — Stores full case data: GPS coordinates, Cloudinary image URL, AI analysis results (species, injury class, confidence scores), urgency score/tier, assignment details, and resolution outcome.
- **`users`** — Citizen and admin accounts with bcrypt-hashed passwords, roles (`citizen | ngo_admin | super_admin`), and report statistics.
- **`ngos`** — Registered rescue organizations with location, coverage radius, contact email, active status, and rescue count.

---

## 11. EXPECTED OUTCOMES & SUCCESS METRICS

### ML Performance Targets

| Metric             | Model A (Species — YOLOv8m) | Model B (Injury — EfficientNetV2-S) |
|--------------------|------------------------------|--------------------------------------|
| mAP@0.5 / Accuracy | > 0.87                       | > 80%                                |
| Precision          | > 0.85                       | > 0.78                               |
| Recall             | > 0.83                       | > 0.76                               |
| F1 Score           | > 0.84                       | > 0.77                               |
| Inference (CPU)    | < 250 ms                     | < 300 ms                             |

### System Performance Targets

| Metric                      | Target                |
|-----------------------------|-----------------------|
| End-to-end API response     | < 3 seconds           |
| Platform uptime             | > 95%                 |
| Email delivery rate         | > 98%                 |
| Citizen reporting time      | < 2 minutes per case  |

---

## 12. INNOVATION & NOVELTY

1. **Dual-Model AI Triage Pipeline** — The combination of an object detection model (YOLOv8m) for species identification and a fine-grained classifier (EfficientNetV2-S) for injury severity is purpose-built for the stray animal domain — no existing public system offers this combined capability.
2. **Dynamic Urgency Scoring** — The multi-factor urgency algorithm considers not just injury class but also AI confidence, case age, and animal vulnerability — producing a nuanced, actionable priority score rather than a simple label.
3. **Zero-Infrastructure Cost** — The entire platform — ML inference, database, image storage, email, and hosting — operates on free-tier cloud services, making it practically deployable by any college student or small NGO.
4. **Graceful Fallback Design** — When custom fine-tuned models are unavailable, the system falls back to pretrained COCO YOLOv8 weights and a heuristic injury estimator, remaining operational for demos at any time.

---

## 13. FUTURE SCOPE

| Feature                 | Description                                                        |
|-------------------------|--------------------------------------------------------------------|
| Mobile Application      | React Native cross-platform app for easier field reporting         |
| CCTV / Video Integration| Real-time stray animal detection from live camera feeds (YOLOv8)  |
| LLM Case Summaries      | GPT-4V / Gemini Vision for natural language case descriptions      |
| On-Device Inference     | TFLite models for offline reporting in low-connectivity areas      |
| Heatmap Analytics       | GIS-based urban stray density visualization for city planners      |
| Adoption Portal         | Match rescued and recovered animals with potential adopters        |

---

## 14. DEPLOYMENT SUMMARY

| Component  | Platform                  | Cost            |
|------------|---------------------------|-----------------|
| Backend    | Render.com (free tier)    | ₹0 / month      |
| Frontend   | Vercel (free tier)        | ₹0 / month      |
| Database   | MongoDB Atlas M0          | ₹0 / month      |
| Images     | Cloudinary (25 GB free)   | ₹0 / month      |
| Email      | SendGrid (100 emails/day) | ₹0 / month      |
| **Total**  | —                         | **₹0 / month**  |

---

## 15. REFERENCES

### Datasets
- Oxford-IIIT Pet Dataset — https://www.robots.ox.ac.uk/~vgg/data/pets/
- Roboflow Universe (Stray Animal Detection + Injured Animal Detector) — https://universe.roboflow.com/
- Open Images V7 (Google) — https://storage.googleapis.com/openimages/web/index.html
- Kaggle — Animal Wound and Skin Condition Dataset

### Libraries & Frameworks
- Ultralytics YOLOv8 — https://docs.ultralytics.com/
- PyTorch Image Models (timm) — https://huggingface.co/timm
- FastAPI — https://fastapi.tiangolo.com/
- Beanie ODM — https://beanie-odm.dev/

### Research Papers
- Redmon et al. — *"You Only Look Once: Unified, Real-Time Object Detection"* (CVPR 2016)
- Tan & Le — *"EfficientNetV2: Smaller Models and Faster Training"* (ICML 2021)
- Parkhi et al. — *"Cats and Dogs"* (CVPR 2012) — Oxford-IIIT Pets Dataset paper

---

*Synopsis prepared by: Aman | AI & Web Developer*
*Academic Year: 2025–2026 | College Final Year Project*
*Last Updated: March 2026*
