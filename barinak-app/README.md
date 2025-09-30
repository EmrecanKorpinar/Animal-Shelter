
# 🐾 Animals Shelter

🚀 Modern, açık kaynaklı hayvan barınağı yönetim platformu

Hayvan barınağı süreçlerinizi dijitalleştirin! Animals Shelter, güçlü yönetim araçları, hızlı arayüzü ve gelişmiş entegrasyonlarıyla barınak operasyonlarını kolaylaştırır.

**Öne Çıkan Özellikler**

- ⚡ **Redis Cache & Gerçek Zamanlı Bildirimler:** Hızlı veri erişimi, pub/sub ile anlık güncellemeler ve otomatik cache invalidation.
- 📥 **Admin için Excel/CSV Toplu Veri Aktarımı:** Hayvan ve başvuru verilerini kolayca içe/dışa aktarın. Tek tıkla toplu güncelleme ve yedekleme.
- 🔒 **Rol Tabanlı Güvenlik:** JWT tabanlı kimlik doğrulama, admin ve kullanıcı rolleriyle güvenli erişim.
- 🐶 **Kapsamlı Hayvan ve Başvuru Yönetimi:** Hayvan ekleme, güncelleme, silme, başvuru onay/red, kullanıcıya özel başvuru takibi.
- 🖥️ **Modern React Arayüzü:** Hızlı, kullanıcı dostu ve mobil uyumlu frontend.
- 🐳 **Kolay Kurulum:** Docker ile tek komutla PostgreSQL ve Adminer kurulumu.
- 🛡️ **Gelişmiş API:** RESTful uç noktalar, merkezi API client, hata yönetimi.

---

# Animals Shelter

Full-stack open source animal shelter management application.

**Frontend:** React + Vite  
**Backend:** Express.js + PostgreSQL

Public repository: [github.com/EmrecanKorpinar/animals-shelter](https://github.com/EmrecanKorpinar/animals-shelter)

License: MIT

---

## Demo

![Animals Shelter Demo](demo.gif)

---

---

# Barınak (Shelter) App – Overview

## Kullanıcı Senaryoları
- 👀 **Ziyaretçi:** `/animals` sayfasında sahiplendirilmemiş hayvanları görüntüler. Sahiplenmek için giriş yapması istenir.
- 🙋‍♂️ **Kullanıcı:** Kayıt olur, giriş yapar, hayvan sahiplenme başvurusu yapar, kendi başvurularını takip ve iptal edebilir. Onaylanınca teşekkür sayfası görür.
- 🛠️ **Admin:** Giriş sonrası `/admin` paneline yönlendirilir. Hayvan ekler/günceller/siler, başvuruları onaylar veya reddeder. Excel/CSV ile toplu veri aktarımı yapabilir.

## Mimarî

- **Backend:** Express.js, PostgreSQL, Redis (cache & pub/sub), JWT, Docker
- **Frontend:** React + Vite, Context API, modern component mimarisi
- **Entegrasyonlar:** Adminer (veritabanı arayüzü), Excel/CSV import/export, S3 uyumlu dosya yükleme

## Veritabanı Tasarımı (PostgreSQL)
## Güvenlik
- Şifreler `bcrypt` ile hashlenir.
- JWT ile kimlik doğrulama yapılır.
- Admin endpointleri korumalıdır.

## Temel API Uç Noktaları
## Yerelde Çalıştırma
- Backend (`barinak-backend/`)
  - `.env`:
    - `DATABASE_URL=postgres://postgres:postgres@localhost:5432/barinak`
    - `JWT_SECRET=your_strong_secret`
  - Docker: `docker compose up -d`
  - Kurulum:
    - `npm install`
    - `npm run migrate`
    - `npm run seed`
    - `npm run start` → http://localhost:3001/api
- Frontend (`barinak-app/`)
  - `.env`:
    - `VITE_API_URL=http://localhost:3001/api`
  - Kurulum:
    - `npm install`
    - `npm run dev`

## Veritabanı Görüntüleme (Docker)

## Demo Akışı
- Kullanıcı kayıt/giriş → `/animals` → başvuru gönderir.
- Admin giriş → `/admin` → başvuruyu onaylar (hayvan sahiplenildi).
- Kullanıcı `/my-requests` → ONAYLANDI → `/adopt/success` (teşekkür sayfası).

---

Bu proje MIT lisansı ile açık kaynak olarak sunulmaktadır.

This project is a full-stack animal shelter application with a React + Vite frontend and an Express + PostgreSQL backend. It supports user and admin roles, animal management, adoption requests, and a professional end-to-end flow with role-based access.

## How the Site Behaves (User & Admin)
- User (anonymous): sees animals on `/animals` (only not-adopted). Trying to adopt redirects to `/login`.
- User (authenticated): can submit adoption requests (`/animals` or `/adopt`), view/cancel own requests (`/my-requests`). When approved, can see a Thank-you page at `/adopt/success`.
- Admin: logs in at `/login` (same login, role checked) and is auto-redirected to `/admin`. Admin can manage animals and approve/reject adoption requests.

## Architecture
- Frontend: `barinak-app/src/` (React + Vite)
  - Central API client: `src/services/api.js` (reads `VITE_API_URL`, attaches JWT, handles 401).
  - Guards: `src/components/common/RequireAuth.jsx`, `RequireAdmin.jsx`.
  - Key pages: `AnimalList.jsx`, `MyRequests.jsx`, `AdoptionForm.jsx`, `AdoptSuccess.jsx`, `AdminDashboard.jsx`.
- Backend: `barinak-app/barinak-backend/` (Express + PostgreSQL)
  - Routes: `routes/users.js`, `routes/animals.js`, `routes/adoption_requests.js`
  - Controllers: `controllers/*`
  - Models: `models/*` (SQL via `pg`), DB connection: `db/pool.js`
  - Migrations/seed: `db/setup.sql`, `db/migrate.js`, `db/seed.js`

## Database Design (PostgreSQL)
- users: id, username (unique), password_hash, role (admin|user), created_at
- animals: id, name, species, age, imageurl, adopted (bool), adopted_by (FK users.id), created_at
- adoption_requests: id, user_id (FK), animal_id (FK), message, status (pending|approved|rejected), created_at, processed_at

## Security & Hashing
- Passwords are hashed with `bcrypt` before storage; login uses `bcrypt.compare`.
- JWT (`jsonwebtoken`) is used for authentication. Token contains `id`, `username`, `role` and is verified by middleware (`middleware/auth.js`).
- Admin-only endpoints are protected with `requireAdmin`.

## Key API Endpoints
- Auth/User
  - POST `/api/users/register` – register user (hashes password), returns token
  - POST `/api/users/login` – login, returns `{ token, user }`
  - GET `/api/users/me` – current user info (auth)
- Animals
  - GET `/api/animals` – list animals
  - POST `/api/animals` – create (admin)
  - PUT `/api/animals/:id` – update (admin)
  - DELETE `/api/animals/:id` – delete (admin)
- Adoption Requests
  - POST `/api/adoption_requests` – create request (auth)
  - GET `/api/adoption_requests` – list all (admin, enriched with user/animal data)
  - PUT `/api/adoption_requests/:id/process` – approve/reject (admin)
  - GET `/api/adoption_requests/mine` – list own requests with details (auth)
  - DELETE `/api/adoption_requests/mine/:id` – cancel own pending request (auth)

## Run Locally
- Backend (`barinak-backend/`)
  - `.env`:
    - `DATABASE_URL=postgres://postgres:postgres@localhost:5432/barinak`
    - `JWT_SECRET=your_strong_secret`
  - Docker: `docker compose up -d`
  - Install/migrate/seed/start:
    - `npm install`
    - `npm run migrate`
    - `npm run seed`
    - `npm run start` → http://localhost:3001/api
- Frontend (`barinak-app/`)
  - `.env`:
    - `VITE_API_URL=http://localhost:3001/api`
  - Install/run:
    - Windows (PowerShell): `"C:\\Program Files\\nodejs\\npm.cmd" install`
    - `"C:\\Program Files\\nodejs\\npm.cmd" run dev`

## View the Database (Docker)
- Adminer (already configured in `barinak-backend/docker-compose.yml`):
  - Start: `docker compose up -d`
  - Open: http://localhost:8080
  - Login: System=PostgreSQL, Server=db (or localhost), User=postgres, Pass=postgres, DB=barinak
- Or psql:
  - `psql "postgres://postgres:postgres@localhost:5432/barinak"`
  - `\dt`, `\d users`, `SELECT * FROM animals;`

## Demo Flow (End-to-End)
- User registers/logs in → browses `/animals` → sends adoption request.
- Admin logs in → `/admin` → approves the request (animal marked adopted).
- User opens `/my-requests` → sees APPROVED → clicks to `/adopt/success` (Thank-you page).
