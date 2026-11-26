import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(WEB_DIR, '.env');
const IMAGES_DIR = path.join(WEB_DIR, 'public', 'images');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}. Copy web/.env.example to web/.env first.`);
  }
  const map = {};
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq > 0) map[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return map;
}

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--emulator') args.emulator = true;
    else if (token.startsWith('--') && i + 1 < argv.length) {
      args[token.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function readFoodBase64(filename) {
  const full = path.join(IMAGES_DIR, filename);
  const b64 = fs.readFileSync(full).toString('base64');
  return `data:image/jpeg;base64,${b64}`;
}

const DEMO_STORES = [
  {
    ownerEmail: 'gulzor_owner@dasturxon.test',
    ownerName: 'Akmaljon Novvoy',
    ownerNick: 'gulzor_patir',
    ownerPhone: '+998 90 127 33 33',
    business: {
      name: 'Gulzor Patir Nonvoyxonasi',
      type: 'bakery',
      address: "Yunusobod ko'chasi, 5A (Shahriston metrosi), Toshkent",
      phone: '+998 90 127 33 33',
    },
    expenses: [
      { title: 'Oliy navli un (2 qop)', amount: 480000, category: 'Xomashyo' },
      { title: 'Tandir gazi va elektr', amount: 165000, category: 'Kommunal' },
    ],
    products: [
      {
        name: 'Issiq Tandir Non',
        category: 'bakery',
        description: "Har soatda yangi uziladigan, kunjutli va xushbo'y mahalla tandir noni.",
        imageFile: 'food_tandir_non.jpg',
        price: 5000,
        costPrice: 2500,
        stock: 60,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Sariyog'li Samarqand Patir",
        category: 'bakery',
        description: "Toza sariyog' va sutda qorilgan, qarsildoq chetli milliy patir.",
        imageFile: 'food_patir_non.jpg',
        price: 14000,
        costPrice: 7200,
        stock: 24,
        discountPercent: 10,
        status: 'hot_ready',
      },
      {
        name: "Tandir Go'shtli Somsa",
        category: 'bakery',
        description: "Qo'lda yoyilgan qatlama xamir va maydalangan mol go'shtli somsa.",
        imageFile: 'food_somsa.jpg',
        price: 9000,
        costPrice: 4800,
        stock: 40,
        discountPercent: 0,
        status: 'hot_ready',
      },
    ],
  },
  {
    ownerEmail: 'oznon_owner@dasturxon.test',
    ownerName: 'Rustamjon Karimov',
    ownerNick: 'oz_non_yunusobod',
    ownerPhone: '+998 90 412 88 10',
    business: {
      name: "O'z Non Mahalla Novvoyxonasi",
      type: 'bakery',
      address: 'Yunusobod tumani, 8-mavze, 45-uy, Toshkent',
      phone: '+998 90 412 88 10',
    },
    expenses: [{ title: 'Kunjut, sut va xamirturush', amount: 195000, category: 'Xomashyo' }],
    products: [
      {
        name: 'Kunjutli Shirmoy Patir',
        category: 'bakery',
        description: 'Nozik sutli ta’mga ega an’anaviy shirmoy patir noni.',
        imageFile: 'food_patir_non.jpg',
        price: 11000,
        costPrice: 5500,
        stock: 30,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: 'Oilaviy Tandir Non',
        category: 'bakery',
        description: 'Katta o‘lchamli kundalik non, issiq holda topshiriladi.',
        imageFile: 'food_tandir_non.jpg',
        price: 4500,
        costPrice: 2200,
        stock: 75,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Kichik Qovoqli Somsa (2 dona)',
        category: 'bakery',
        description: 'Shirin qovoq va ziravorlar bilan pishirilgan yengil somsa.',
        imageFile: 'food_somsa.jpg',
        price: 10000,
        costPrice: 4500,
        stock: 28,
        discountPercent: 0,
        status: 'available',
      },
    ],
  },
  {
    ownerEmail: 'caramellina_owner@dasturxon.test',
    ownerName: 'Dilnoza Qandolatchi',
    ownerNick: 'caramellina_uz',
    ownerPhone: '+998 90 321 18 23',
    business: {
      name: 'Caramellina Qandolat Sexi',
      type: 'confectionery',
      address: 'Yunusobod tumani, 18-mavze, 23-uy, Toshkent',
      phone: '+998 90 321 18 23',
    },
    expenses: [{ title: 'Asal, qaymoq va shokolad', amount: 420000, category: 'Xomashyo' }],
    products: [
      {
        name: "Klassik Medovik (bo'lak)",
        category: 'confectionery',
        description: "Tog' asali va smetanali kremdan tayyorlangan yumshoq asalli tort.",
        imageFile: 'food_medovik.jpg',
        price: 28000,
        costPrice: 14500,
        stock: 16,
        discountPercent: 15,
        status: 'available',
      },
      {
        name: 'San-Sebastyan Chizkeyk',
        category: 'pastry',
        description: "Filadelfiya pishlog'i va rezavor sousli nozik pishirilgan chizkeyk.",
        imageFile: 'food_cheesecake.jpg',
        price: 36000,
        costPrice: 19000,
        stock: 12,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Butun Medovik Tort (1 kg)',
        category: 'confectionery',
        description: 'Mehmondorchilik va tug‘ilgan kunlar uchun tayyor qadoqlangan tort.',
        imageFile: 'food_medovik.jpg',
        price: 145000,
        costPrice: 82000,
        stock: 6,
        discountPercent: 0,
        status: 'available',
      },
    ],
  },
  {
    ownerEmail: 'bon_yunusobod@dasturxon.test',
    ownerName: 'Sardorbek Bek',
    ownerNick: 'bon_yunusobod4',
    ownerPhone: '+998 78 140 80 80',
    business: {
      name: 'Bon! Qahva va Pishiriqlar',
      type: 'cafe',
      address: 'Yunusobod tumani, 4-mavze, 80-uy (Yunusobod metrosi), Toshkent',
      phone: '+998 78 140 80 80',
    },
    expenses: [],
    products: [
      {
        name: 'Reza Mevali Chizkeyk',
        category: 'pastry',
        description: "Yangi malina va qulupnay bilan bezatilgan sovuq chizkeyk bo'lagi.",
        imageFile: 'food_cheesecake.jpg',
        price: 34000,
        costPrice: 18000,
        stock: 14,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: "Ko'k Choy va Limon (choynak)",
        category: 'cafe',
        description: "Tog' o'simliklari va yangi limon qo'shilgan tetiklashtiruvchi choy.",
        imageFile: 'food_tea.jpg',
        price: 15000,
        costPrice: 4500,
        stock: 45,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Qaymoqli Karamel Medovik",
        category: 'pastry',
        description: "Yumshoq biskvit va yengil karamel kremi uyg'unligi.",
        imageFile: 'food_medovik.jpg',
        price: 27000,
        costPrice: 13500,
        stock: 10,
        discountPercent: 0,
        status: 'available',
      },
    ],
  },
  {
    ownerEmail: 'yettimoijiza@dasturxon.test',
    ownerName: 'Baxtiyor Oshpaz',
    ownerNick: 'yetti_mojiza_17',
    ownerPhone: '+998 90 917 07 07',
    business: {
      name: "Yetti Mo'jiza Milliy Choyxonasi",
      type: 'teahouse',
      address: 'Yunusobod tumani, 17-mavze, 7A-uy, Toshkent',
      phone: '+998 90 917 07 07',
    },
    expenses: [{ title: "Guruch (Lazer) va mol go'shti", amount: 640000, category: 'Xomashyo' }],
    products: [
      {
        name: "Toshkent To'y Oshi (1 porsiya)",
        category: 'teahouse',
        description: "Sariq sabzi, no'xat, mayiz va qazili an'anaviy bayramona palov.",
        imageFile: 'food_plov.jpg',
        price: 38000,
        costPrice: 21000,
        stock: 25,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Ko'mirda Qiyma Shashlik (1 six)",
        category: 'teahouse',
        description: "Saksovul cho'g'ida pishirilgan sersuv qiyma kabob.",
        imageFile: 'food_shashlik.jpg',
        price: 24000,
        costPrice: 13000,
        stock: 30,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Novvotli Qora Choy (1 L choynak)",
        category: 'teahouse',
        description: 'Taom bilan birga tortiladigan xushbo‘y navvotli choy.',
        imageFile: 'food_tea.jpg',
        price: 12000,
        costPrice: 3500,
        stock: 50,
        discountPercent: 0,
        status: 'available',
      },
    ],
  },
  {
    ownerEmail: 'bogishamol_kitchen@dasturxon.test',
    ownerName: 'Otabek Qozonchi',
    ownerNick: 'bogishamol_oshxona',
    ownerPhone: '+998 90 831 31 00',
    business: {
      name: "Bog'ishamol Milliy Oshxonasi",
      type: 'kitchen',
      address: "Yunusobod tumani, Bog'ishamol tor ko'chasi, 131-uy, Toshkent",
      phone: '+998 90 831 31 00',
    },
    expenses: [],
    products: [
      {
        name: 'Choyxona Palovi (maxsus)',
        category: 'kitchen',
        description: "Devzira guruch va qo'y yog'ida damlangan haqiqiy choyxona oshi.",
        imageFile: 'food_plov.jpg',
        price: 44000,
        costPrice: 24000,
        stock: 20,
        discountPercent: 10,
        status: 'hot_ready',
      },
      {
        name: 'Jaz Shashlik (1 six)',
        category: 'kitchen',
        description: "Marinadlangan yumshoq mol go'shtidan tayyorlangan jaz kabob.",
        imageFile: 'food_shashlik.jpg',
        price: 29000,
        costPrice: 16000,
        stock: 18,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: 'Tomchi Somsa (bugun tugagan namuna)',
        category: 'kitchen',
        description: 'Ertalabki partiyasi sotilib ketgan mashhur somsa (zaxira 0 ta).',
        imageFile: 'food_somsa.jpg',
        price: 22000,
        costPrice: 11000,
        stock: 0,
        discountPercent: 0,
        status: 'sold_out',
      },
    ],
  },
];

async function signInOrRegister(auth, db, params) {
  try {
    const cred = await signInWithEmailAndPassword(auth, params.email, params.password);
    return cred.user.uid;
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    const uid = cred.user.uid;
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid), {
      uid,
      fullName: params.fullName,
      normalizedNickname: params.nick,
      email: params.email,
      phone: params.phone,
      role: params.role,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'usernames', params.nick), {
      uid,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return uid;
  }
}

async function ensureBusinessAndProducts(db, ownerUid, store, demoPassword, auth) {
  await signInWithEmailAndPassword(auth, store.ownerEmail, demoPassword);
  const existingBizSnap = await getDocs(
    query(collection(db, 'businesses'), where('ownerId', '==', ownerUid))
  );

  let businessId;
  let businessStatus;
  if (!existingBizSnap.empty) {
    businessId = existingBizSnap.docs[0].id;
    businessStatus = existingBizSnap.docs[0].data().status;
  } else {
    const ref = await addDoc(collection(db, 'businesses'), {
      ownerId: ownerUid,
      name: store.business.name,
      type: store.business.type,
      address: store.business.address,
      phone: store.business.phone,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    businessId = ref.id;
    businessStatus = 'pending';
  }

  const existingProds = await getDocs(
    query(collection(db, 'products'), where('businessId', '==', businessId))
  );
  const existingNames = new Set(existingProds.docs.map((d) => d.data().name));
  const createdProductIds = [];

  for (const prod of store.products) {
    if (existingNames.has(prod.name)) {
      const match = existingProds.docs.find((d) => d.data().name === prod.name);
      if (match) createdProductIds.push({ id: match.id, ...prod });
      continue;
    }
    const prodRef = await addDoc(collection(db, 'products'), {
      businessId,
      businessName: store.business.name,
      businessType: store.business.type,
      businessAddress: store.business.address,
      businessPhone: store.business.phone,
      category: prod.category,
      name: prod.name,
      description: prod.description,
      imageUrl: readFoodBase64(prod.imageFile),
      price: prod.price,
      published: true,
      status: prod.status,
      stock: prod.stock,
      discountPercent: prod.discountPercent,
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'products', prodRef.id, 'private', 'cost'), {
      costPrice: prod.costPrice,
      updatedAt: serverTimestamp(),
    });
    createdProductIds.push({ id: prodRef.id, ...prod });
  }

  const existingExp = await getDocs(
    query(collection(db, 'expenses'), where('businessId', '==', businessId))
  );
  if (existingExp.empty) {
    for (const exp of store.expenses) {
      await addDoc(collection(db, 'expenses'), {
        businessId,
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        createdAt: serverTimestamp(),
      });
    }
  }

  await signOut(auth);
  return { businessId, businessStatus, business: store.business, products: createdProductIds, store };
}

async function seedCustomerOrders(auth, db, firstApprovedBiz, customerEmail, customerPass) {
  if (!firstApprovedBiz || firstApprovedBiz.products.length === 0) return null;
  const custUid = await signInOrRegister(auth, db, {
    email: customerEmail,
    password: customerPass,
    fullName: 'Azizbek Toshmatov',
    nick: 'azizbek_demo',
    phone: '+998 90 700 11 22',
    role: 'customer',
  });

  const existingOrders = await getDocs(
    query(collection(db, 'orders'), where('customerId', '==', custUid))
  );
  if (!existingOrders.empty) {
    await signOut(auth);
    return existingOrders.docs.map((d) => ({ id: d.id, productId: d.data().productId }));
  }

  const targetProduct = firstApprovedBiz.products[0];
  const created = [];
  for (const qty of [4, 2]) {
    const orderRef = doc(collection(db, 'orders'));
    const itemRef = doc(collection(orderRef, 'items'));
    await runTransaction(db, async (tx) => {
      const pSnap = await tx.get(doc(db, 'products', targetProduct.id));
      const curStock = pSnap.data().stock;
      const nextStock = curStock - qty;
      tx.set(orderRef, {
        customerId: custUid,
        customerName: 'Azizbek Toshmatov',
        customerPhone: '+998 90 700 11 22',
        businessId: firstApprovedBiz.businessId,
        businessName: firstApprovedBiz.business.name,
        productId: targetProduct.id,
        productName: targetProduct.name,
        quantity: qty,
        unitPrice: targetProduct.price,
        totalPrice: targetProduct.price * qty,
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentType: 'pickup',
        deliveryAddress: '',
        pickupTime: Timestamp.fromMillis(Date.now() + 3600_000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.set(itemRef, {
        productId: targetProduct.id,
        name: targetProduct.name,
        qty,
        unitPrice: targetProduct.price,
      });
      tx.update(doc(db, 'products', targetProduct.id), {
        stock: nextStock,
        status: nextStock === 0 ? 'sold_out' : targetProduct.status,
        lastCheckoutOrderId: orderRef.id,
        updatedAt: serverTimestamp(),
      });
    });
    created.push({ id: orderRef.id, productId: targetProduct.id, costPrice: targetProduct.costPrice });
  }
  await signOut(auth);
  return created;
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const adminEmail = args['admin-email'] || process.env.ADMIN_EMAIL;
  const adminPassword = args['admin-password'] || process.env.ADMIN_PASSWORD;
  const demoPassword = args['demo-password'] || 'Dasturxon2026!';
  const customerEmail = 'mijoz_demo@dasturxon.test';

  if (!adminEmail || !adminPassword) {
    console.error(
      'Usage: node scripts/seed_live_catalog.mjs --admin-email <admin@...> --admin-password <pass> [--emulator]'
    );
    process.exit(1);
  }

  const env = loadEnvFile(ENV_PATH);
  const useEmulator = Boolean(args.emulator) || env.VITE_USE_FIREBASE_EMULATOR === 'true';

  const app = initializeApp(
    args.emulator
      ? {
          apiKey: 'demo-dasturxon-api-key',
          authDomain: 'demo-dasturxon.firebaseapp.com',
          projectId: 'demo-dasturxon',
          appId: '1:437798898747:web:demo',
        }
      : {
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.VITE_FIREBASE_APP_ID,
        }
  );
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }

  // Verify admin login AND admin role in Firestore BEFORE creating catalog
  const adminCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  const adminSnap = await getDoc(doc(db, 'users', adminCred.user.uid));
  if (!adminSnap.exists() || adminSnap.data().role !== 'admin') {
    throw new Error(
      `${adminEmail} hisobining Firestore users/${adminCred.user.uid}.role maydoni "admin" emas! Avval Firebase Console da role = "admin" qiling.`
    );
  }
  await signOut(auth);

  const createdStores = [];
  for (const store of DEMO_STORES) {
    const uid = await signInOrRegister(auth, db, {
      email: store.ownerEmail,
      password: demoPassword,
      fullName: store.ownerName,
      nick: store.ownerNick,
      phone: store.ownerPhone,
      role: 'owner',
    });
    await signOut(auth);
    const created = await ensureBusinessAndProducts(db, uid, store, demoPassword, auth);
    createdStores.push(created);
    console.log(`Prepared business: ${store.business.name} (${store.products.length} products)`);
  }

  // Approve all created pending businesses as Admin
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  for (const s of createdStores) {
    if (s.businessStatus !== 'approved') {
      await updateDoc(doc(db, 'businesses', s.businessId), {
        status: 'approved',
        rejectionReason: '',
        updatedAt: serverTimestamp(),
      });
      console.log(`Admin approved: ${s.business.name}`);
    }
  }
  await signOut(auth);

  // Place sample orders + complete the first one for realistic Owner Analytics
  const orders = await seedCustomerOrders(auth, db, createdStores[0], customerEmail, demoPassword);
  if (orders && orders.length >= 2) {
    await signInWithEmailAndPassword(auth, createdStores[0].store.ownerEmail, demoPassword);
    const firstOrderRef = doc(db, 'orders', orders[0].id);
    await updateDoc(firstOrderRef, {
      status: 'completed',
      paymentStatus: 'paid',
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const itemsSnap = await getDocs(collection(firstOrderRef, 'items'));
    if (!itemsSnap.empty) {
      await updateDoc(itemsSnap.docs[0].ref, { unitCost: orders[0].costPrice || 2500 });
    }
    await signOut(auth);
  }

  console.log('\n=== DEMO SEED COMPLETE ===');
  console.log(`Businesses: ${createdStores.length}, Total products: ${createdStores.reduce((n, s) => n + s.products.length, 0)}`);
  console.log(`Demo Customer: ${customerEmail} / ${demoPassword}`);
  console.log(`Demo Owner (Gulzor Patir w/ analytics & pending order): ${DEMO_STORES[0].ownerEmail} / ${demoPassword}`);
  console.log(`Admin: ${adminEmail}`);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
