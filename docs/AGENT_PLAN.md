# DASTURXON v2 — full architecture + complete redesign + owner analytics (university course project)

## Role and goal
You are a senior Android engineer and product designer (Kotlin, Jetpack Compose, Material 3, Firebase) working inside my
Android Studio project. Dasturxon is a pickup marketplace for local food businesses in Uzbekistan (nonvoyxona, qandolatxona,
choyxona, ...): customers find fresh products and order them for pickup; business owners manage products and orders and
analyse their business; an admin approves businesses.
It is a course project (mustaqil ish). It must look and feel like a polished modern app with a logical, YouTube-like structure,
have a clean documented architecture, and include a real analytics module for owners.
No Play Store or legal work. Firebase Spark plan only: no Cloud Functions, no push (no server), no Firebase Storage.
The current app works but is visually plain and loosely structured: keep working behavior, rebuild structure and UI.

## Rules of engagement
1. Work in phases; do ONLY the phase I name. First action: save this whole prompt verbatim to docs/AGENT_PLAN.md and
   re-read it at the start of every phase.
2. After each phase run `./gradlew assembleDebug testDebugUnitTest lint`, fix errors, then report: (a) files changed
   (b) screens I should check on the phone (c) MANUAL STEPS (Firebase console, rules/indexes deploy) (d) max 3 questions
   (e) next phase. Then STOP and wait for my "go". If a spec item needs a big decision, ask instead of guessing.
3. Inspect before changing. Reuse existing collections, field names and stored values; add new fields as OPTIONAL and make
   every mapper null-tolerant; document each schema change in docs/DATA_MODEL.md; keep firestore.indexes.json and
   docs/RULES_PROPOSAL.md up to date; never deploy anything.
4. Never invent keys, secrets or URLs. No heavy new dependencies; justify each one.
5. My machine: Ubuntu, 8 GB RAM: Gradle heap <= 2 GB, KSP (not kapt), no emulator-dependent steps (I test on a physical phone).
6. No hardcoded UI strings: string resources, Uzbek default (values/), Russian (values-ru/).
7. Every screen: skeleton loading, empty state, error state with retry, light and dark @Preview.

## Target architecture
Single module, strict feature packages:
  core/designsystem  theme, tokens, components, charts, logo
  core/model         pure Kotlin domain: models, enums, OrderStatus state machine, PricingCalculator, Availability, AnalyticsCalculator
  core/data          repository interfaces, Firestore implementations + mappers, ImageStore, DataStore preferences, Fake (in-memory) implementations
  core/common        UiState/Result, Clock, Money, DateTime utils (Asia/Tashkent), formatters
  feature/{auth,customer,owner,analytics,admin,profile}   screens + ViewModels
  navigation         AppRoot, role graphs, type-safe routes
- MVVM + unidirectional data flow: Screen(uiState, onEvent) <- ViewModel(StateFlow<UiState>, one-shot effects via Channel).
- Domain code has no Android/Firebase imports and is unit-tested. Hilt (KSP) wires repositories (AuthRepository, UserRepository,
  BusinessRepository, ProductRepository, OrderRepository, FavoritesRepository, AnalyticsRepository, ImageStore, PreferencesRepository).
  Each has a Firestore impl and a Fake impl (previews, tests, Demo mode). Explain how SOLID applies in docs/ARCHITECTURE.md.
- Navigation Compose, type-safe routes, single Activity. AppRoot observes SessionState (Loading | SignedOut | NeedsEmailVerification |
  SignedIn(role, businessStatus)) and shows AuthGraph / CustomerGraph / OwnerGraph / AdminGraph. Each graph owns its NavigationBar
  with saveState/restoreState; detail screens sit above the bar. Edge-to-edge, insets handled in DxScaffold, predictive back.
- Realtime: snapshot listeners (lifecycle-aware stateIn WhileSubscribed) for orders and live availability; one-shot paginated queries
  (limit 20 + startAfter) for catalogs and history.
- Time: Asia/Tashkent, java.time (core library desugaring if minSdk < 26). Money: Long so'm, shown "12 000 so'm".
- Images: ImageStore interface; default impl compresses a picked photo (PickVisualMedia, no permission) to <= 600 px, JPEG/WebP ~75%,
  <= 80 KB and stores Base64 in field `image`; decode off the main thread with an LRU cache. No image -> designed placeholder
  (type-colored gradient + icon). Document the trade-off (not scalable; Storage/Cloudinary later = one class swap).

## Data model (adapt to existing names; new fields optional)
users/{uid}: name, email, phone, role, createdAt
businesses/{id}: ownerId, name, type, typeNote?, description?, address, phone, status(pending|approved|rejected|suspended),
  rejectReason?, image?, createdAt
products/{id}: businessId, name, description, price, stock, discountPercent, discountEndsAt?, active, image?,
  availableNowAt?, availableNowMinutes?, availableNowNote?, createdAt, updatedAt
orders/{id}: customerId, customerName, customerPhone, businessId, businessName, productId, productName, qty, unitPriceOriginal,
  discountPercent, unitPrice, total, status, pickupAt, createdAt, updatedAt, acceptedAt?, readyAt?, completedAt?, cancelledAt?,
  rejectReason?, rejectReasonCode?, fromAvailableNow
users/{uid}/favorites/{refId}: kind(shop|product), createdAt
- Order state machine (domain): pending -> accepted | rejected | cancelled(by customer); accepted -> ready | cancelled; ready -> completed.
  Stock is decremented on create and restored on reject/cancel, both inside Firestore transactions. Each transition writes updatedAt
  and its own timestamp field. Keep existing stored status values; map them.
- "Hozir mavjud": expiry = availableNowAt + availableNowMinutes (5..1440, note <= 60 chars). A product is available now iff not expired
  AND stock > 0 AND active AND its shop is approved. Labels refresh every 30 s; handle pending server timestamps (ESTIMATE).
- Business types, one enum (keep existing stored values exactly): Nonvoyxona, Qandolatxona, Pishiriq, Choyxona, Oshxona, Kafe,
  Boshqa (+ required typeNote 3-40 chars).

## Design system
Concept: golden tandoor bread + Samarkand turquoise ceramics + pistachio green on warm cream. Warm, appetizing, friendly. Never default purple.
Material 3 ColorScheme, define light AND dark explicitly (verify text contrast >= 4.5:1, adjust tones if needed):
 light: primary #B7500A on #FFFFFF; primaryContainer #FFDCC2 / on #3A1A00; secondary #0F7C84 on #FFFFFF; secondaryContainer #C6EEF0 / on #00292C;
        tertiary #4C7A2B on #FFFFFF; tertiaryContainer #D2EDB6 / on #0C2000; background #FFF8F1; surface #FFFBF7;
        surfaceVariant #F3E5D8; outline #8A7566; onSurface #2A1C12; error #BA1A1A
 dark:  primary #FFB784 (on #4E2600); secondary #6FD6DE; tertiary #A9D486; background #1C1410; surface #241A15; onSurface #F1E0D4; derive the rest
 Status chips (bg/fg for both themes): Kutilmoqda amber, Qabul qilindi blue, Tayyor green, Yakunlandi teal-gray, Rad etildi red,
 Bekor qilindi gray. Discount badge red. "● Hozir mavjud" badge in tertiary with a pulsing dot (like YouTube's LIVE).
Typography: Material 3 scale, friendly rounded sans via ui-text-google-fonts (e.g. Nunito) with system fallback (check o' g' glyphs);
 tabular numbers for prices and KPIs. Shapes/spacing: 4 dp grid; cards 16 dp, sheets 28 dp, chips and buttons pill; tonal surfaces, soft shadows.
Components (core/designsystem, each with previews): DxScaffold, DxTopBar (logo bar / title bar), DxSearchField, DxChipRow, ProductCard,
 ProductRow, ShopCard, ShopAvatar (logo or initials), PriceText (old/new), StatusChip, LiveBadge, DiscountBadge, StockIndicator, KpiCard
 (value, delta, sparkline), SectionHeader, EmptyState, ErrorState, Skeleton/shimmer, button variants, DxTextField (leading icon, error,
 show/hide password), bottom-sheet templates, ConfirmDialog, StepTimeline, QuantityStepper, TimeLeftLabel.
Charts: custom Compose Canvas, no chart library (LineChart/AreaChart, BarChart, DonutChart, Sparkline), animated draw-in, touch tooltip,
 contentDescription summaries. Motion stays subtle (crossfade, AnimatedVisibility, animateContentSize, KPI count-up).
Logo and icon (vector only): mark = a round non (bread) seen from above: golden gradient disc (#F2B24C -> #B7500A), inner ring, radial
 chekich dot pattern in the centre, two small steam curves; wordmark "Dasturxon" in bold rounded type. Deliver ic_logo_mark.xml, DxLogo(size,
 showWordmark), adaptive launcher icon (foreground inside the 66 dp safe zone, cream background) + monochrome layer, Android 12+ splash
 with the mark, short animated in-app splash. The logo appears in: launcher, splash, auth hero, Home top bar (left, YouTube-style), About.

## Information architecture (YouTube-like logic)
Customer bar: Bosh sahifa | Do'konlar | Buyurtmalar | Siz
Owner bar:    Boshqaruv | Mahsulotlar | Buyurtmalar | Analitika | Profil
Admin bar:    Umumiy | Tasdiqlar | Bizneslar | Profil
Mapping: Home feed + chips = YouTube Home; "Hozir mavjud" shelf = LIVE/Shorts shelf; Do'konlar + Kuzatish = Subscriptions; shop page = channel
page; product page = watch page; Orders history = History; Sevimlilar = Watch later; Siz = You.

## Screens (redesign every one)
AUTH: Splash routes by SessionState. Onboarding (first launch, DataStore flag): 3 pager pages (find fresh food now / run your shop /
 order and pick up), Skip. Sign in / Sign up: logo hero with gradient, segmented control, role as two big cards (Xaridor | Biznes egasi),
 leading-icon fields, inline validation, loading button, forgot-password sheet, dedicated email-verification screen (resend, "Tasdiqladim" refresh, sign out).
CUSTOMER:
- Bosh sahifa: logo top bar + search + bell (in-app notifications derived from order status changes, unread badge via DataStore lastSeen).
  Sticky chips: Barchasi, ● Hozir mavjud, type chips, Kuzatilayotganlar. Under Barchasi: "Hozir mavjud" shelf, "Chegirmalar" shelf, then the
  vertical feed of large ProductCards (16:9 image, badges -% / ● Hozir mavjud / Faqat N ta qoldi, shop avatar + name + type, price with
  strike-through, save heart, overflow share/report). Sort menu (Yangi, Arzon, Chegirma, Tez tugaydi), pull-to-refresh, pagination.
- Qidiruv: field, recent searches, live suggestions, result tabs Mahsulotlar | Do'konlar, filter sheet (type, price range, only available now,
  only discounted, sort). Client-side filtering over loaded active products (document the limitation).
- Do'konlar: ShopCards (logo/initials, name, type chip, address, N mahsulot, ● N hozir mavjud, Kuzatish) + type chips.
- Do'kon sahifasi: gradient header, avatar, name, type, address (open in maps via geo: intent), call (ACTION_DIAL), Kuzatish;
  tabs Mahsulotlar | Hozir mavjud | Haqida.
- Mahsulot sahifasi: image, title, price block, stock indicator, availability note + time left, shop row, description, pickup date-time chips,
  sticky bottom bar (QuantityStepper + "Buyurtma berish · 24 000 so'm") -> confirm sheet -> success screen with short order code.
- Buyurtmalar: tabs Faol (realtime, soonest pickup first) | Tarix (paginated, newest first, grouped by month); card -> Buyurtma tafsiloti
  (StepTimeline, pickup info, shop contact, cancel while pending/accepted with confirmation, stock restored).
- Siz: avatar initials, name, email, role chip; shortcuts Buyurtmalar, Sevimlilar (saved products + followed shops); settings: Til (uz/ru),
  Mavzu (Yorug'/Qorong'u/Tizim), edit profile (name, phone), Ilova haqida, Chiqish.
OWNER:
- Business state screens (no business / pending / rejected-with-reason + resubmit / suspended) with vector illustrations and one clear CTA;
  creation form with type picker (+typeNote), logo upload.
- Boshqaruv: greeting + status; KPI cards (bugungi buyurtmalar, bugungi daromad, faol buyurtmalar, kam qolgan mahsulotlar);
  "Diqqat talab qiladi" list (new orders to answer, low stock, discounts ending < 24 h); quick actions (Mahsulot qo'shish, Hozir mavjud,
  Buyurtmalar); 7-day sparkline linking to Analitika.
- Mahsulotlar: search, chips (Hammasi, Faol, Nofaol, Kam qolgan, Chegirmali), rows with thumbnail, price, inline stock +/-, active switch,
  "Hozir mavjud" action (sheet: 30 daq / 1 / 2 / 4 soat / kun oxirigacha, optional note; extend / end), FAB. Product form: image picker,
  fields, discount slider + end date, live preview of the customer card.
- Buyurtmalar: tabs Yangi | Jarayonda | Tarix; cards with customer name + call, product, qty, pickup time + countdown, total; actions:
  Qabul qilish / Rad etish (reason chips: Zaxira tugadi, Do'kon yopiq, Vaqt mos emas, Boshqa -> rejectReasonCode) / Tayyor / Topshirildi.
- Analitika: see below. Profil: business edit (logo, name, type, address, phone, description), status chip, settings, logout.
ADMIN:
- Umumiy: KPI cards (users by role, businesses by status, orders today/total, completed turnover), 14-day orders chart, business-type
  donut, pending shortcut. Tasdiqlar: pending cards -> detail sheet -> Tasdiqlash / Rad etish (reason chips + text).
- Bizneslar: searchable list + status chips; detail with products/orders/revenue; Suspend / Reactivate. Profil: theme, language, logout.

## Owner analytics ("Analitika" tab; Boshqaruv = today + tasks, Analitika = history + insight)
Period chips: Bugun | 7 kun | 30 kun | 90 kun; toggle "Oldingi davr bilan solishtirish" (deltas with arrow + color + sign, never color alone).
Cards (skeleton while loading, empty state when no data):
1. KPIs: Daromad (completed orders; show pending/ready revenue as "kutilmoqda"), Buyurtmalar, O'rtacha chek, Yakunlash darajasi; each with delta + sparkline.
2. Trend: line/area chart, toggle Daromad | Buyurtmalar (hourly buckets for Bugun, daily otherwise), touch tooltip.
3. Holat taqsimoti: donut (Yakunlandi / Jarayonda / Rad etildi / Bekor qilindi) + counts.
4. Mahsulotlar: top 5 by revenue or quantity (toggle) as bars; "Sust sotilayotganlar" (<= 1 sale in period) with a "Chegirma qo'yish" shortcut to the product form.
5. Vaqt tahlili: orders by hour of day (peak highlighted), by weekday, most popular pickup hours.
6. Mijozlar: unique customers, new vs returning, repeat rate, top 5 customers by orders.
7. Chegirma va "Hozir mavjud": revenue share from discounted orders, total discount given, orders placed while an announcement was active vs not (fromAvailableNow).
8. Operatsion: average time to accept (createdAt->acceptedAt) and to prepare (acceptedAt->readyAt), rejection reasons breakdown.
9. Xulosalar: 3-5 rule-based insight cards (peak time, slow movers worth discounting, high rejection due to "Zaxira tugadi", falling repeat rate);
   each rule is a documented pure function with tests; no external AI.
Action: "Hisobotni ulashish" (CSV of the period + summary via share sheet, no permission).
Computation: pure-Kotlin AnalyticsCalculator(orders, period, zone, clock) -> AnalyticsReport; money as Long; null-safe for orders lacking new fields
(skip that metric and show "Ma'lumot yetarli emas", never fake zeros). Load the business's orders for [start, end] and the previous period of equal
length, ordered by createdAt desc, limit 2000, cached per period for 2 min; needs the (businessId, createdAt) index. Unit tests with a fixed clock for
every metric, empty data, a single order and period boundaries (Asia/Tashkent midnight).

## Phases (STOP after each)
P0 Audit (read-only except docs/AGENT_PLAN.md, docs/AUDIT.md): current screens, navigation, data usage, dependency versions, weak points;
   propose deviations from the target architecture.
P1 Foundation: packages, Hilt, domain models + state machine + calculators (with unit tests), repository interfaces with Firestore impls adapted
   from existing code, Fake impls, DataStore, design system (theme, tokens, components, charts), logo/launcher icon/splash, AppRoot with role
   graphs (screens may be placeholders).
P2 Auth, onboarding, email verification.
P3 Customer app (all screens above incl. Hozir mavjud, business types, history, favorites, notifications).
P4 Owner core (states, Boshqaruv, Mahsulotlar + images + Hozir mavjud, Buyurtmalar workflow, Profil).
P5 Owner analytics.
P6 Admin app.
P7 Rules and data integrity: final firestore.rules + firestore.indexes.json + docs/RULES_PROPOSAL.md (roles, ownership, status transitions,
   owner reads orders by businessId, favorites, field validation), rules test matrix, docs/SECURITY_NOTES.md (known limits of client-side stock handling).
P8 Polish and documentation: Demo mode (in-memory Fake repositories with rich realistic Uzbek data incl. 90 days of orders; switch via long-press
   on the logo on the sign-in screen), accessibility pass (contentDescription, 48 dp targets, 200% font scale), dark-mode pass,
   docs/ARCHITECTURE.md (Mermaid: layers, package map, ER diagram, navigation graph, order state diagram, sequence diagrams for
   sign-up + approval, order placement, analytics), docs/SCREENS.md, docs/DESIGN_SYSTEM.md, README.

## Done when
All screens above exist in light and dark, share one design system and logo; the three role flows work end to end on a physical phone;
analytics shows correct numbers (verified by unit tests); build, lint and tests pass; no hardcoded strings; docs exist.

Start now with Phase 0 only.