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
- **Model A (Vision-Language Agent):** Moondream2 (1.8B) reads the uploaded image and generates a highly detailed semantic text description of the animal, its species, and any visible injuries or distress.
- **Model B (Custom Tier Classifier with RLHF):** A custom-trained BERT model (`bert-tiny`) processes Moondream's text and directly classifies the urgency into 5 tiers (Healthy → Critical). This model utilizes an RLHF (Reinforcement Learning from Human Feedback) loop to continuously improve based on NGO Admin corrections.
- **Urgency Score Engine:** A deterministic Python function combines injury class, AI confidence, time elapsed, and vulnerability factors to compute a priority score (0–100).

### 4.3 Role-Based Administration & Dashboards
The platform utilizes a secure JWT-based Role Access System (Citizen, NGO Admin, Super Admin) with distinct portals:
- **Super Admin Dashboard**: A high-level platform control center displaying live KPI metrics (Registered Citizens, Active NGOs, Pending NGO approvals) and a real-time Live Rescue Feed. It features deep regex-based searching capabilities allowing admins to manage all system entities.
- **NGO Admin Dashboard**: A localized control panel for registered rescue organizations to manage their specific triage queue. It features prioritized, filterable report tables, interactive maps (Leaflet.js + OpenStreetMap), and case lifecycle management (Pending → Assigned → In Progress → Resolved).
- **Citizen "My Reports" Dashboard**: A dedicated portal for ordinary users to track the real-time resolution status of the specific animals they reported, equipped with unified list controls (sort/filter/search).

---

## 5. TECHNOLOGY STACK

| Layer              | Technology                        | Purpose                                      |
|--------------------|-----------------------------------|----------------------------------------------|
| Frontend           | React.js + Vite                   | Citizen portal + NGO admin dashboard (SPA)   |
| Backend API        | Python + FastAPI                  | REST API, synchronous ML inference           |
| AI — Vision        | PyTorch + Moondream2              | Zero-shot visual extraction & dense captioning |
| AI — NLP & RLHF    | PyTorch + HuggingFace             | Custom BERT model for Tier Classification    |
| Image Processing   | OpenCV, Pillow                    | Pre-processing, normalization                |
| Database           | MongoDB Atlas + Beanie ODM        | Reports, users, NGO records                  |
| Image Storage      | Cloudinary CDN                    | Photo upload, storage, and delivery          |
| Maps               | Leaflet.js + OpenStreetMap        | GPS visualization (no API key required)      |
| Authentication     | JWT + OAuth2 (FastAPI Security)   | Role-based access (citizen/NGO/super-admin)  |
| Email Alerts       | SendGrid / SMTP (Gmail)           | Automated NGO notification on new reports    |
| Deployment         | Render (backend) + Vercel (frontend) | Free-tier cloud hosting                  |

---

## 6. AI MODELS & DATASETS

### Model A — Vision-Language Extraction: Moondream2

| Property           | Value                                       |
|--------------------|---------------------------------------------|
| Architecture       | Moondream2 (1.8B parameters)                |
| Pretrained Weights | vikhyatk/moondream2                         |
| Function           | Zero-shot semantic extraction of injuries   |
| Inference Speed    | ~1-2 sec/image (CPU)                        |
| Parameters         | 1.8B                                        |

### Model B — Injury Tier Classification: RLHF BERT

| Property           | Value                                              |
|--------------------|----------------------------------------------------|
| Architecture       | Custom Fine-Tuned BERT (`prajjwal1/bert-tiny`)     |
| Training Method    | Supervised Fine-Tuning + RLHF loop                 |
| Input Data         | Raw text output generated by Moondream2            |
| Expected Accuracy  | > 90% (5-class Tier Classification)                |
| Inference Speed    | ~50 ms/image (CPU)                                 |
| Parameters         | 4.4 M                                              |

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
       ├── Moondream2    → Vision Extraction
       ├── RLHF BERT     → Tier Predictor
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

| Metric             | Model A (Vision Extraction — Moondream2) | Model B (Tier Predictor — RLHF BERT) |
|--------------------|------------------------------------------|--------------------------------------|
| mAP@0.5 / Accuracy | N/A (Generative)                         | > 98%                                |
| Precision          | High Semantic Accuracy                   | > 0.95                               |
| Recall             | High Detail Extraction                   | > 0.95                               |
| F1 Score           | N/A                                      | > 0.96                               |
| Inference (CPU)    | < 2 seconds                              | < 50 ms                              |

### System Performance Targets

| Metric                      | Target                |
|-----------------------------|-----------------------|
| End-to-end API response     | < 3 seconds           |
| Platform uptime             | > 95%                 |
| Email delivery rate         | > 98%                 |
| Citizen reporting time      | < 2 minutes per case  |

---

## 12. INNOVATION & NOVELTY

1. **Agentic Two-Model Pipeline** — By chaining a massive Vision-Language Model (Moondream2) with a lightning-fast custom NLP classifier (BERT), the system eliminates the need for expensive bounding box datasets and extracts human-like semantic meaning from images.
2. **Reinforcement Learning from Human Feedback (RLHF)** — A self-improving data loop bridging human expertise with AI. When an NGO Admin corrects an AI prediction on the dashboard, the system automatically logs the correction into `rlhf_dataset.json`. The `retrain_scheduler.py` script runs every Sunday at 2:00 AM (via OS-native Task Scheduler / cron), applies **Majority Voting** to resolve conflicting corrections, backs up the current model, and fine-tunes BERT on the merged dataset. This allows the system to continuously align with real-world veterinary triage standards in a production-grade, automated loop.
3. **Deep Searching & Universal List Engine** — A highly optimized backend search infrastructure using MongoDB `$or` regex blocks that allows users to instantly search across massive, heterogeneous datasets (Report IDs, Animal Species, Addresses, Contact Emails) all through a single, 500ms debounced UI control interface.
4. **Zero-Infrastructure Cost** — The entire platform — ML inference, database, image storage, email, and hosting — operates on free-tier cloud services, making it practically deployable by any college student or small NGO.
5. **Graceful Fallback Design** — When custom fine-tuned models are unavailable, the system falls back to pretrained COCO YOLOv8 weights and a heuristic injury estimator, remaining operational for demos at any time.

---

## 13. FUTURE SCOPE

### 13.1 Proposed: Enriched Multimodal RLHF Dataset

The current RLHF dataset stores only the Moondream text description and human-corrected label. The **proposed upgrade** enriches every training sample into a full multimodal record, unlocking a new generation of AI training:

| New Field | Purpose |
|---|---|
| `image_url` | Cloudinary URL — portable, downloads directly via HTTP during training |
| `animal` | Species label — enables species-specific expert model training |
| `confidence` | Annotator certainty (0.0–1.0) — enables weighted loss training |
| `source` | `admin_correction` / `base_dataset` / `synthetic` — data provenance tracking |
| `corrected_from` | AI's original prediction — the true RLHF delta signal |
| `annotator_id` | Which NGO Admin made the correction — per-annotator trust scoring |
| `timestamp` | When the correction was made — recency filtering and trend analysis |

### 13.2 Proposed: Phased AI Training Roadmap

The enriched dataset unlocks a clear progression from text-only to full multimodal intelligence:

| Phase | Model | Input | Status |
|---|---|---|---|
| **Phase 1** (Current) | `bert-tiny` | Moondream text only | ✅ Live |
| **Phase 2** (Proposed) | CLIP / ViLBERT | Text + Raw image | 🔵 Planned |
| **Phase 3** (Future) | EfficientNet-B3 | Raw image only (no text) | 🔵 Planned |
| **Phase 4** (Advanced) | Species-Expert CNNs | Per-animal routed models | 🔵 Long-term |

### 13.3 Tiered RLHF Trust System — Citizen vs. Expert Feedback

Citizens can also override the AI-predicted urgency tier when submitting a report. This signal is **deliberately excluded** from the current RLHF pipeline to prevent data poisoning, emotional over-reporting, and annotation noise from untrained users — the same principle used by OpenAI for ChatGPT's RLHF (vetted annotators only).

The **proposed** upgrade introduces a Tiered Trust System with weighted cross-entropy loss during training:

| Source | Role | Trust Weight |
|---|---|---|
| NGO Admin Correction | Expert, verified | 1.0 |
| Citizen Override | Layperson, unverified | 0.3 |
| Citizen Majority Vote (3+) | Crowd consensus | 0.6 |

This allows citizen feedback to contribute to training without being able to override expert knowledge, making the data pipeline more comprehensive while remaining scientifically rigorous.

### 13.4 Other Future Features

| Feature | Description |
|---|---|
| Mobile Application | React Native cross-platform app for easier field reporting |
| CCTV / Video Integration | Real-time stray animal detection from live camera feeds |
| LLM Case Summaries | GPT-4V / Gemini Vision for natural language case descriptions |
| On-Device Inference | TFLite models for offline reporting in low-connectivity areas |
| Heatmap Analytics | GIS-based urban stray density visualization for city planners |
| Adoption Portal | Match rescued and recovered animals with potential adopters |
| Dataset Export Tool | Auto-query MongoDB and export enriched multimodal JSON |

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
- Transformers (HuggingFace) — https://huggingface.co/docs/transformers
- FastAPI — https://fastapi.tiangolo.com/
- Beanie ODM — https://beanie-odm.dev/

### Research Papers
- VikhyatK — *"Moondream2: Tiny Vision Language Model"* (2024)
- Devlin et al. — *"BERT: Pre-training of Deep Bidirectional Transformers"* (2018)

---

*Synopsis prepared by: Aman | AI & Web Developer*
*Academic Year: 2025–2026 | College Final Year Project*
*Last Updated: March 2026*
