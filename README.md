# DevFlow

**DevFlow** este o aplicație de management agil al proiectelor, inspirată de Jira. Este construită ca
implementare de referință pentru stack-ul modern **Next.js 16 + React 19 + Prisma 7** și include un panou
Kanban cu drag-and-drop, un panou lateral pentru detaliile tichetelor (cu editare directă), comentarii,
filtre, backlog, setări de proiect, căutare globală și temă luminoasă/întunecată.

Aplicația este gândită atât ca proiect de învățare (fiecare tipar — citiri în Server Components, scrieri
în Server Actions, stare în URL, UI optimist — apare într-un singur loc clar), cât și ca proiect de
portofoliu cu o interfață îngrijită, în stilul Linear/Atlassian.

## Funcționalități

- **Panou Kanban** — cinci coloane de status (Backlog, To Do, In Progress, In Review, Done), cu
  drag-and-drop (`@hello-pangea/dnd`), mutări optimiste (cardul se mută instantaneu, înainte de răspunsul
  serverului), număr de tichete și total de story points pe fiecare coloană. Funcționează și din tastatură
  (Tab pe card, Space pentru a-l ridica, săgeți pentru a-l muta, Space pentru a-l lăsa).
- **Panoul lateral al tichetului** — se deschide prin click pe card și are link propriu
  (`?issue=DEV-104`), deci poate fi trimis altcuiva. Permite editarea directă a titlului și a descrierii
  (Markdown), schimbarea statusului, priorității, tipului, persoanei asignate, părintelui și a story
  points, plus ștergerea cu confirmare.
- **Comentarii** — Markdown cu previzualizare, publicare optimistă (comentariul apare imediat), iar
  autorii își pot șterge propriile comentarii. `⌘/Ctrl+Enter` trimite comentariul.
- **Filtre** — după persoana asignată (avatare, inclusiv „neasignat”), după tipul tichetului și căutare
  după text în titlu sau cheie. Toate filtrele sunt păstrate în URL, deci butonul Back le anulează.
- **Backlog** — listă grupată după status, cu grupuri care se pot restrânge și aceleași filtre ca pe panou.
- **Ierarhie de tichete** — Epic → Story/Task/Bug → Subtask, validată pe server (de exemplu, un subtask
  trebuie să aibă un părinte, iar un epic nu poate avea părinte).
- **Căutare globală** — `⌘K`/`Ctrl+K` mută focusul în căutare; caută după titlu (cu index trigram) și
  după prefixul cheii (ex. `DEV-10`), în toate proiectele.
- **Setări de proiect** — redenumirea proiectului și editarea descrierii (Markdown).
- **Schimbarea utilizatorului** — versiunea 1 nu are autentificare. Din meniul avatarului (dreapta sus →
  „Switch user”) alegi în numele cărui utilizator din datele demo lucrezi.
- **Temă luminoasă / întunecată / de sistem** — din butonul cu soare/lună din bara de sus.

## Tehnologii folosite

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Limbaj | TypeScript (`strict`, `noUncheckedIndexedAccess`) |
| Interfață | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, next-themes, sonner |
| Drag & drop | @hello-pangea/dnd |
| Date | PostgreSQL 17 (în Docker), Prisma 7 cu `@prisma/adapter-pg` |
| Validare | zod 4 |
| Teste | Vitest (teste unitare + teste de integrare pe un Postgres real) |

## Cerințe preliminare

Înainte de a începe, ai nevoie de:

1. **Node.js versiunea 20.9 sau mai nouă** (împreună cu npm, care vine odată cu Node.js).
   Verifică în terminal:

   ```bash
   node -v    # trebuie să afișeze v20.9.0 sau mai mare
   npm -v
   ```

2. **Docker** cu **Docker Compose** (Docker Desktop pe Windows/macOS sau Docker Engine pe Linux).
   Verifică:

   ```bash
   docker --version
   docker compose version
   ```

   Asigură-te că Docker rulează (pe Windows/macOS trebuie pornită aplicația Docker Desktop).

3. **Git**, pentru a clona proiectul.

## Rularea aplicației local — pas cu pas

Toate comenzile de mai jos se rulează din **folderul rădăcină al proiectului** (cel care conține
`package.json` și `docker-compose.yml`).

### Pasul 1 — Obține codul

```bash
git clone <url-ul-repository-ului> devflow
cd devflow
```

Dacă ai deja proiectul pe disc, intră doar în folderul lui (ex. `cd ~/Documents/Personal/devflow`).

### Pasul 2 — Configurează variabilele de mediu

Proiectul vine cu un fișier model, `.env.example`. Copiază-l într-un fișier `.env`:

```bash
cp .env.example .env
```

> Pe Windows, în Command Prompt, folosește `copy .env.example .env`.

Fișierul `.env` conține două variabile:

| Variabilă | Rol |
|---|---|
| `DATABASE_URL` | Conexiunea la baza de date principală (`devflow`), folosită de aplicație, de Prisma CLI și de scriptul de seed. |
| `TEST_DATABASE_URL` | Conexiunea la baza de date pentru teste (`devflow_test`), folosită doar de `npm run test:integration`. Datele de aici sunt șterse între teste. |

Valorile implicite se potrivesc exact cu containerul Docker din pasul următor, deci **nu trebuie să
modifici nimic**:

```dotenv
DATABASE_URL="postgresql://devflow:devflow@localhost:5433/devflow"
TEST_DATABASE_URL="postgresql://devflow:devflow@localhost:5433/devflow_test"
```

Formatul este `postgresql://UTILIZATOR:PAROLĂ@HOST:PORT/NUME_BAZĂ_DE_DATE`.

### Pasul 3 — Pornește PostgreSQL în Docker

```bash
docker compose up -d
```

Ce face această comandă:

- descarcă imaginea `postgres:17-alpine` (doar prima dată);
- pornește în fundal (`-d`) un container numit `devflow-db`, cu utilizatorul `devflow`, parola `devflow`
  și baza de date `devflow`;
- expune Postgres pe portul **5433** al calculatorului tău (nu pe 5432, ca să nu intre în conflict cu un
  Postgres instalat local);
- la prima pornire rulează `docker/init.sql`, care activează extensia `pg_trgm` (pentru căutare) și creează
  baza de date de test `devflow_test`;
- păstrează datele într-un volum Docker (`devflow-pgdata`), deci nu se pierd la repornirea containerului.

Verifică faptul că baza de date este pornită și sănătoasă:

```bash
docker compose ps
```

În coloana de status trebuie să apară `healthy` (poate dura câteva secunde după pornire). Dacă apare
`starting`, mai așteaptă puțin și rulează comanda din nou.

### Pasul 4 — Instalează dependențele

```bash
npm install
```

Comanda instalează toate pachetele din `package.json` (Next.js, React, Prisma, shadcn/ui etc.) în folderul
`node_modules`. Poate dura un minut sau două la prima rulare.

### Pasul 5 — Creează tabelele și generează clientul Prisma

```bash
npx prisma db push
npx prisma generate
```

- `npx prisma db push` citește schema din `prisma/schema.prisma` și creează în baza de date tabelele
  `User`, `Project`, `Issue` și `Comment`, cu toate cheile străine și indexurile. La final trebuie să vezi
  mesajul `Your database is now in sync with your Prisma schema`.
- `npx prisma generate` generează clientul Prisma tipizat în `src/generated/prisma`. În Prisma 7, `db push`
  **nu** mai generează clientul automat, așa că această comandă este obligatorie. La final trebuie să vezi
  `Generated Prisma Client`.

### Pasul 6 — Populează baza de date cu date demo (seed)

```bash
npx prisma db seed
```

Scriptul `prisma/seed.ts` șterge datele existente și creează date demo:

- 6 utilizatori (cu avatare);
- proiectul **DevFlow Platform** (cheia `DEV`);
- 24 de tichete (`DEV-101` … `DEV-124`) cu toate statusurile, tipurile și prioritățile, inclusiv epice,
  bug-uri și subtask-uri;
- 20 de comentarii.

Mesajul de confirmare arată astfel:

```
Seeded 6 users, project DEV, 24 issues and 20 comments.
```

Poți rula comanda oricând dorești să revii la datele inițiale.

### Pasul 7 — Pornește serverul de dezvoltare Next.js

```bash
npm run dev
```

În terminal va apărea adresa la care rulează aplicația, de obicei:

```
- Local:   http://localhost:3000
```

Deschide adresa în browser. Vei fi redirecționat automat către panoul Kanban al proiectului
**DevFlow Platform** (`/projects/DEV/board`).

> Dacă portul 3000 este ocupat, Next.js alege automat următorul port liber (3001, 3002 …) și îl afișează în
> terminal. Poți alege și un port anume: `npm run dev -- -p 3005`.

Pentru a opri serverul, apasă `Ctrl+C` în terminal. Pentru a opri și baza de date: `docker compose stop`
(datele rămân salvate; o repornești cu `docker compose start` sau `docker compose up -d`).

### Rezumat — toate comenzile, în ordine

```bash
cp .env.example .env        # 1. variabilele de mediu
docker compose up -d        # 2. pornește PostgreSQL (port 5433)
npm install                 # 3. instalează dependențele
npx prisma db push          # 4. creează tabelele
npx prisma generate         # 5. generează clientul Prisma
npx prisma db seed          # 6. încarcă datele demo
npm run dev                 # 7. pornește aplicația
```

### Prima utilizare

- Trage cardurile între coloane sau reordonează-le într-o coloană — modificările se salvează automat.
- Dă click pe un card pentru a deschide panoul lateral și a edita tichetul.
- Folosește butonul **Create** din bara de sus pentru a crea un tichet nou.
- Din meniul avatarului (dreapta sus) → **Switch user**, poți lucra în numele altui utilizator (de exemplu,
  pentru a vedea că poți șterge doar comentariile proprii).

## Probleme frecvente

| Problemă | Cauză și soluție |
|---|---|
| Pagina afișează „DevFlow couldn't load” | Baza de date nu rulează. Pornește-o cu `docker compose up -d` și verifică cu `docker compose ps`. |
| Pagina afișează „No projects yet” | Baza de date este goală. Rulează `npx prisma db seed`. |
| Eroare `Cannot find module '@/generated/prisma/...'` | Clientul Prisma nu a fost generat. Rulează `npx prisma generate`. |
| `docker compose up` eșuează cu „port is already allocated” | Portul 5433 este ocupat. Schimbă portul din stânga în `docker-compose.yml` (ex. `"5434:5432"`) **și** în ambele URL-uri din `.env`. |
| Eroare `extension "pg_trgm" is not available` sau lipsește baza `devflow_test` | `docker/init.sql` rulează doar la crearea unui volum nou. Recreează volumul: `docker compose down -v`, apoi reia pașii 3, 5 și 6. **Atenție:** aceasta șterge toate datele din baza de date. |
| `DATABASE_URL is not set` | Lipsește fișierul `.env`. Reia pasul 2. |
| Erori la `npm install` | Verifică versiunea Node.js (`node -v`, minimum 20.9). |

## Scripturi disponibile

| Comandă | Ce face |
|---|---|
| `npm run dev` | Pornește serverul de dezvoltare |
| `npm run build` / `npm start` | Build de producție / rulează build-ul de producție |
| `npm run typecheck` | Generează tipurile rutelor Next.js și verifică tipurile TypeScript |
| `npm run lint` | Rulează ESLint |
| `npm test` | Rulează toate testele |
| `npm run test:unit` | Teste pentru logica pură (fără bază de date) |
| `npm run test:integration` | Testează Server Actions și interogările pe baza de date `devflow_test` |
| `npm run db:push` / `db:generate` / `db:seed` / `db:studio` | Scurtături pentru comenzile Prisma (`db:studio` deschide interfața vizuală Prisma Studio) |

Testele de integrare au nevoie ca baza de date din Docker să ruleze. Ele aplică automat schema pe
`devflow_test` și golesc datele între teste — baza de date principală `devflow` nu este atinsă.

## Resetarea bazei de date

```bash
# Reîncarcă datele demo (șterge și recreează toate datele de test)
npx prisma db seed

# Pornește complet de la zero (șterge volumul Docker și TOATE datele)
docker compose down -v
docker compose up -d
npx prisma db push
npx prisma db seed
```

## Structura proiectului

```
prisma/              schema.prisma, seed.ts
docker/              init.sql (extensia pg_trgm + baza de date de test)
src/actions/         Server Actions — toate scrierile în baza de date
src/app/             Rute: /projects/[key]/{board,backlog,settings}, /search
src/components/      ui/ (shadcn), layout/, board/, issue/, comments/, backlog/, settings/, shared/
src/hooks/           useIssueHref, useOptimisticField
src/lib/             logica de domeniu (validare, filtre, ordonare), queries/, clientul de bază de date
tests/unit/          teste pentru logica pură
tests/integration/   teste pentru acțiuni și interogări pe Postgres
```

## Note de arhitectură

- **Citiri în Server Components, scrieri în Server Actions.** Paginile apelează funcții tipizate din
  `src/lib/queries/`. Modificările se află în `src/actions/` și trec toate prin `runAction`
  (`src/lib/action-result.ts`): validare zod → Prisma → `revalidatePath` → un `ActionResult` tipizat
  (`{ ok: true, data }` sau `{ ok: false, error, fieldErrors? }`). Acțiunile nu aruncă niciodată erori
  către client.
- **URL-ul ca stare.** Filtrele (`?assignee=&type=&q=`) și tichetul deschis (`?issue=`) sunt păstrate în
  URL, deci fiecare vizualizare este randată pe server, poate fi partajată și funcționează cu butonul Back.
- **UI optimist.** Drag-and-drop-ul, câmpurile din panoul lateral și comentariile folosesc `useOptimistic`;
  dacă salvarea eșuează, React revine la starea de pe server, iar o notificare explică motivul.
- **Ordonare fracționară.** Fiecare tichet are o poziție (`position`, număr real) în coloana lui. La mutare
  se ia media pozițiilor vecinilor (se actualizează un singur rând); serverul recitește vecinii, adaugă
  cardul la final dacă vizualizarea clientului este depășită și renumerotează coloana când precizia
  numerelor se epuizează (`src/lib/position.ts`).
- **Cheile tichetelor.** `createIssue` incrementează `Project.issueCounter` într-o tranzacție; blocarea
  rândului serializează creările simultane, astfel încât cheile nu se repetă niciodată.
- **Căutare.** Un index GIN `pg_trgm` pe `Issue.title` (extensia este activată de `docker/init.sql`)
  susține căutarea după subșiruri, fără a ține cont de majuscule.
- **Tailwind v4.** Variabilele temei sunt definite în `src/app/globals.css` (`@theme`); proiectul nu are
  fișier `tailwind.config.ts`.
