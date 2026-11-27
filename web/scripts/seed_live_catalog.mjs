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
        description:
          "Shahriston metrosi va Yunusobod 7-mavze to'yxonalari hamda do'konlari uchun kunjutli issiq tandir noni (optom 200 tadan 2 700 so'm).",
        imageFile: 'food_tandir_non.jpg',
        price: 5000,
        costPrice: 1900,
        stock: 1200,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 200,
        wholesalePrice: 2700,
      },
      {
        name: "Sariyog'li Samarqand Patir",
        category: 'bakery',
        description:
          "To'y va marosim dasturxonlari uchun toza sariyog' va sutda qorilgan Samarqand patiri (optom 40 tadan 9 500 so'm).",
        imageFile: 'food_patir_non.jpg',
        price: 14000,
        costPrice: 6800,
        stock: 240,
        discountPercent: 10,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 40,
        wholesalePrice: 9500,
      },
      {
        name: "Tandir Go'shtli Somsa",
        category: 'bakery',
        description:
          "Yunusobod ofislari va choyxonalar uchun qarsildoq tandir mol go'shtli somsa (optom 80 tadan 6 500 so'm).",
        imageFile: 'food_somsa.jpg',
        price: 9000,
        costPrice: 4400,
        stock: 400,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 80,
        wholesalePrice: 6500,
      },
      {
        name: "Yunusobod Obi Non (to'y partiyasi)",
        category: 'bakery',
        description:
          "Yunusobod 7-mavze (48A) va Universam bozori atrofidagi oshxonalar uchun standart issiq obi non (optom 300 tadan 2 500 so'm).",
        imageFile: 'food_tandir_non.jpg',
        price: 4000,
        costPrice: 1700,
        stock: 1500,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 300,
        wholesalePrice: 2500,
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
      address: 'Yunusobod tumani, 8-mavze, 45-uy (Universam yaqinida), Toshkent',
      phone: '+998 90 412 88 10',
    },
    expenses: [{ title: 'Kunjut, sut va xamirturush', amount: 195000, category: 'Xomashyo' }],
    products: [
      {
        name: 'Kunjutli Shirmoy Patir',
        category: 'bakery',
        description:
          "Yunusobod 8-mavze sexidan sutli an'anaviy shirmoy patir partiyasi (optom 50 tadan 7 800 so'm).",
        imageFile: 'food_patir_non.jpg',
        price: 11000,
        costPrice: 5200,
        stock: 300,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 50,
        wholesalePrice: 7800,
      },
      {
        name: 'Oilaviy Tandir Non',
        category: 'bakery',
        description:
          "Do'konlar, kichik kafelar va tadbirlar uchun kunlik tandir noni (optom 150 tadan 2 900 so'm).",
        imageFile: 'food_tandir_non.jpg',
        price: 4500,
        costPrice: 2000,
        stock: 900,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 150,
        wholesalePrice: 2900,
      },
      {
        name: 'Kichik Qovoqli Somsa (2 dona)',
        category: 'bakery',
        description:
          "Tushlik to'plamlari va korporativ buyurtmalar uchun shirin qovoqli somsa (optom 60 tadan 6 800 so'm).",
        imageFile: 'food_somsa.jpg',
        price: 10000,
        costPrice: 4300,
        stock: 300,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 60,
        wholesalePrice: 6800,
      },
      {
        name: 'Universam Mini-Market Obi Noni',
        category: 'bakery',
        description:
          "Yunusobod 8-mavze va 19-mavze mahalla do'konlariga tonggi yetkazib berish uchun obi non (optom 250 tadan).",
        imageFile: 'food_tandir_non.jpg',
        price: 3800,
        costPrice: 1800,
        stock: 1250,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 250,
        wholesalePrice: 2600,
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
      address: "Yunusobod tumani, 18-mavze, 23-uy (Mega Planet yo'nalishi), Toshkent",
      phone: '+998 90 321 18 23',
    },
    expenses: [{ title: 'Asal, qaymoq va shokolad', amount: 420000, category: 'Xomashyo' }],
    products: [
      {
        name: "Klassik Medovik (bo'lak)",
        category: 'confectionery',
        description:
          "Yunusobod kafe va kofe nuqtalari uchun tog' asalli medovik bo'laklari (optom 25 tadan 19 500 so'm).",
        imageFile: 'food_medovik.jpg',
        price: 28000,
        costPrice: 13500,
        stock: 150,
        discountPercent: 15,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 25,
        wholesalePrice: 19500,
      },
      {
        name: 'San-Sebastyan Chizkeyk',
        category: 'pastry',
        description:
          "Kofexona va tadbir shirinlik stoli uchun Filadelfiya pishloqli chizkeyk (optom 20 tadan 25 500 so'm).",
        imageFile: 'food_cheesecake.jpg',
        price: 36000,
        costPrice: 18000,
        stock: 100,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 20,
        wholesalePrice: 25500,
      },
      {
        name: 'Butun Medovik Tort (1 kg)',
        category: 'confectionery',
        description:
          "To'y, tug'ilgan kun va korporativ sovg'alar uchun qadoqlangan 1 kg tortlar (optom 8 tadan 110 000 so'm).",
        imageFile: 'food_medovik.jpg',
        price: 145000,
        costPrice: 78000,
        stock: 50,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 8,
        wholesalePrice: 110000,
      },
      {
        name: "Tadbir Medovik To'plami (12 bo'lak)",
        category: 'confectionery',
        description:
          "Banket va ofis ziyofatlari uchun 12 bo'lakli maxsus qutida qadoqlangan desert to'plami (optom 5 qutidan).",
        imageFile: 'food_medovik.jpg',
        price: 240000,
        costPrice: 125000,
        stock: 40,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 5,
        wholesalePrice: 185000,
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
        description:
          "Amir Temur shoh ko'chasi ofislari va uchrashuvlar uchun yangi malinali chizkeyk (optom 20 tadan 24 000 so'm).",
        imageFile: 'food_cheesecake.jpg',
        price: 34000,
        costPrice: 16500,
        stock: 120,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 20,
        wholesalePrice: 24000,
      },
      {
        name: "Ko'k Choy va Limon (choynak)",
        category: 'cafe',
        description:
          "Seminar va tushlik tadbirlari uchun termosda yoki choynakda tayyor limondor ko'k choy (optom 15 tadan).",
        imageFile: 'food_tea.jpg',
        price: 15000,
        costPrice: 4500,
        stock: 120,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 15,
        wholesalePrice: 10500,
      },
      {
        name: 'Qaymoqli Karamel Medovik',
        category: 'pastry',
        description:
          "Yumshoq biskvit va karamel kremli pishiriq bo'lagi, kafe hamkorlari uchun (optom 24 tadan 19 000 so'm).",
        imageFile: 'food_medovik.jpg',
        price: 27000,
        costPrice: 13000,
        stock: 120,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 24,
        wholesalePrice: 19000,
      },
      {
        name: "Kofe-Breyk Pishiriq To'plami (ofislar uchun)",
        category: 'cafe',
        description:
          'Yunusobod va Bodomzor atrofidagi biznes-markazlar kofe-breyklari uchun shirinlik qutisi (optom 15 tadan).',
        imageFile: 'food_cheesecake.jpg',
        price: 45000,
        costPrice: 21000,
        stock: 150,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 15,
        wholesalePrice: 32000,
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
      address: "Yunusobod tumani, 17-mavze, 7A-uy (Iftixor ko'chasi yo'nalishi), Toshkent",
      phone: '+998 90 917 07 07',
    },
    expenses: [{ title: "Guruch (Lazer) va mol go'shti", amount: 640000, category: 'Xomashyo' }],
    products: [
      {
        name: "Toshkent To'y Oshi (1 porsiya)",
        category: 'teahouse',
        description:
          "Sariq sabzi, no'xat, mayiz va qazili to'y oshi; Yunusobod va Iftixor atrofidagi marosimlarga (optom 30 porsiyadan 29 500 so'm).",
        imageFile: 'food_plov.jpg',
        price: 38000,
        costPrice: 21000,
        stock: 300,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 30,
        wholesalePrice: 29500,
      },
      {
        name: "Ko'mirda Qiyma Shashlik (1 six)",
        category: 'teahouse',
        description:
          "Saksovul cho'g'ida pishirilgan sersuv qiyma kabob, to'y va gap-gashtaklar uchun (optom 50 sixdan 17 500 so'm).",
        imageFile: 'food_shashlik.jpg',
        price: 24000,
        costPrice: 12500,
        stock: 500,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 50,
        wholesalePrice: 17500,
      },
      {
        name: 'Novvotli Qora Choy (1 L choynak)',
        category: 'teahouse',
        description:
          "Tadbir va choyxona stollari uchun xushbo'y navvotli choy partiyasi (optom 20 choynakdan 8 000 so'm).",
        imageFile: 'food_tea.jpg',
        price: 12000,
        costPrice: 3500,
        stock: 200,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 20,
        wholesalePrice: 8000,
      },
      {
        name: 'Bayramona Lazer Palov (1 kg lagan)',
        category: 'teahouse',
        description:
          "Katta oilaviy va ofis tushliklari uchun qazi va bedana tuxumli 1 kg lagan palov (optom 10 kgdan 105 000 so'm).",
        imageFile: 'food_plov.jpg',
        price: 135000,
        costPrice: 74000,
        stock: 80,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 10,
        wholesalePrice: 105000,
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
      address: "Yunusobod tumani, Bog'ishamol tor ko'chasi, 131-uy (Teleminora yaqini), Toshkent",
      phone: '+998 90 831 31 00',
    },
    expenses: [],
    products: [
      {
        name: 'Choyxona Palovi (maxsus)',
        category: 'kitchen',
        description:
          "Devzira guruch va qo'y yog'ida damlangan choyxona palovi; Iftixor va Bog'ishamol atrofiga (optom 25 porsiyadan 34 000 so'm).",
        imageFile: 'food_plov.jpg',
        price: 44000,
        costPrice: 24000,
        stock: 250,
        discountPercent: 10,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 25,
        wholesalePrice: 34000,
      },
      {
        name: 'Jaz Shashlik (1 six)',
        category: 'kitchen',
        description:
          "Marinadlangan yumshoq mol go'shtidan tayyorlangan jaz kabob (optom 50 sixdan 21 500 so'm).",
        imageFile: 'food_shashlik.jpg',
        price: 29000,
        costPrice: 15500,
        stock: 400,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleMinQty: 50,
        wholesalePrice: 21500,
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
        wholesaleEnabled: false,
      },
      {
        name: "To'yxona Tandir Somsasi (partiya)",
        category: 'kitchen',
        description:
          "Yunusobod va Toshkent bo'ylab tadbirlar uchun qalin go'shtli tandir somsasi (optom 100 tadan 8 500 so'm).",
        imageFile: 'food_somsa.jpg',
        price: 12000,
        costPrice: 5800,
        stock: 600,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleMinQty: 100,
        wholesalePrice: 8500,
      },
    ],
  },
];

async function signInOrRegister(auth, db, params) {
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, params.email, params.password);
  } catch (signInErr) {
    try {
      cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    } catch (createErr) {
      if (createErr?.code === 'auth/email-already-in-use') {
        throw new Error(
          `${params.email} allaqachon ro'yxatdan o'tgan, lekin --demo-password mos kelmadi.`,
          { cause: signInErr }
        );
      }
      throw createErr;
    }
  }

  const uid = cred.user.uid;
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    const batch = writeBatch(db);
    batch.set(userRef, {
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
  }
  return uid;
}

async function ensureBusinessAndProducts(db, ownerUid, store, demoPassword, auth) {
  await signInWithEmailAndPassword(auth, store.ownerEmail, demoPassword);
  const existingBizSnap = await getDocs(
    query(collection(db, 'businesses'), where('ownerId', '==', ownerUid))
  );

  let businessId;
  let businessStatus;
  if (!existingBizSnap.empty) {
    const bizDoc = existingBizSnap.docs[0];
    businessId = bizDoc.id;
    businessStatus = bizDoc.data().status;
    if (bizDoc.data().address !== store.business.address) {
      await updateDoc(bizDoc.ref, {
        address: store.business.address,
        updatedAt: serverTimestamp(),
      });
    }
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
  const existingByName = new Map(existingProds.docs.map((d) => [d.data().name, d]));
  const createdProductIds = [];

  for (const prod of store.products) {
    const wholesaleEnabled = Boolean(prod.wholesaleEnabled);
    const wholesalePayload = wholesaleEnabled
      ? {
          wholesaleEnabled: true,
          wholesaleMinQty: prod.wholesaleMinQty,
          wholesalePrice: prod.wholesalePrice,
        }
      : {
          wholesaleEnabled: false,
          wholesaleMinQty: null,
          wholesalePrice: null,
        };

    const match = existingByName.get(prod.name);
    if (match) {
      const existingData = match.data();
      const nextStock =
        prod.status === 'sold_out'
          ? 0
          : wholesaleEnabled
            ? Math.max(existingData.stock ?? 0, prod.stock)
            : existingData.stock;
      const nextStatus =
        prod.status === 'sold_out'
          ? 'sold_out'
          : existingData.status === 'sold_out' && nextStock > 0
            ? prod.status
            : existingData.status;
      await updateDoc(match.ref, {
        businessAddress: store.business.address,
        description: prod.description,
        price: prod.price,
        stock: nextStock,
        status: nextStatus,
        ...wholesalePayload,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'products', match.id, 'private', 'cost'), {
        costPrice: prod.costPrice,
        updatedAt: serverTimestamp(),
      });
      createdProductIds.push({ id: match.id, ...prod });
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
      ...wholesalePayload,
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
  return {
    businessId,
    businessStatus,
    business: store.business,
    products: createdProductIds,
    store,
  };
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
  const created = [];
  const targetProduct = firstApprovedBiz.products[0];

  if (existingOrders.empty) {
    for (const qty of [4, 2]) {
      const orderRef = doc(collection(db, 'orders'));
      const itemRef = doc(collection(orderRef, 'items'));
      await runTransaction(db, async (tx) => {
        const pSnap = await tx.get(doc(db, 'products', targetProduct.id));
        const curStock = pSnap.data().stock;
        const nextStock = curStock - qty;
        const total = targetProduct.price * qty;
        tx.set(orderRef, {
          customerId: custUid,
          customerName: 'Azizbek Toshmatov',
          customerPhone: '+998 90 700 11 22',
          businessId: firstApprovedBiz.businessId,
          businessName: firstApprovedBiz.business.name,
          productId: targetProduct.id,
          productName: targetProduct.name,
          orderType: 'retail',
          quantity: qty,
          unitPrice: targetProduct.price,
          totalPrice: total,
          prepaymentPercent: 50,
          prepaymentAmount: Math.ceil(total / 2),
          prepaymentStatus: 'awaiting_advance',
          advanceReceiptUrl: '',
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
      created.push({
        id: orderRef.id,
        productId: targetProduct.id,
        costPrice: targetProduct.costPrice,
      });
    }
  }

  const hasWholesaleSample = existingOrders.docs.some((d) => d.data().orderType === 'wholesale');
  const wholesaleProduct = firstApprovedBiz.products.find(
    (p) => p.wholesaleEnabled && p.wholesaleMinQty && p.wholesalePrice
  );
  if (!hasWholesaleSample && wholesaleProduct) {
    const wOrderRef = doc(collection(db, 'orders'));
    const wItemRef = doc(collection(wOrderRef, 'items'));
    await runTransaction(db, async (tx) => {
      const pRef = doc(db, 'products', wholesaleProduct.id);
      const pSnap = await tx.get(pRef);
      const pData = pSnap.data();
      const qty = wholesaleProduct.wholesaleMinQty;
      const unitPrice = wholesaleProduct.wholesalePrice;
      if (
        !pData ||
        pData.wholesaleEnabled !== true ||
        typeof pData.stock !== 'number' ||
        pData.stock < qty
      ) {
        return;
      }
      const nextStock = pData.stock - qty;
      const totalPrice = unitPrice * qty;
      tx.set(wOrderRef, {
        customerId: custUid,
        customerName: 'Azizbek Toshmatov',
        customerPhone: '+998 90 700 11 22',
        businessId: firstApprovedBiz.businessId,
        businessName: firstApprovedBiz.business.name,
        productId: wholesaleProduct.id,
        productName: wholesaleProduct.name,
        orderType: 'wholesale',
        quantity: qty,
        unitPrice,
        totalPrice,
        prepaymentPercent: 50,
        prepaymentAmount: Math.ceil(totalPrice / 2),
        prepaymentStatus: 'awaiting_advance',
        advanceReceiptUrl: '',
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentType: 'pickup',
        deliveryAddress: '',
        pickupTime: Timestamp.fromMillis(Date.now() + 7200_000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.set(wItemRef, {
        productId: wholesaleProduct.id,
        name: wholesaleProduct.name,
        qty,
        unitPrice,
      });
      tx.update(pRef, {
        stock: nextStock,
        status: nextStock === 0 ? 'sold_out' : pData.status,
        lastCheckoutOrderId: wOrderRef.id,
        updatedAt: serverTimestamp(),
      });
    });
  }

  await signOut(auth);
  return created.length > 0
    ? created
    : existingOrders.docs.map((d) => ({ id: d.id, productId: d.data().productId }));
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const adminEmail = args['admin-email'] || process.env.ADMIN_EMAIL;
  const adminPassword = args['admin-password'] || process.env.ADMIN_PASSWORD;
  const demoPassword = args['demo-password'] || 'Dasturxon2026!';
  const customerEmail = 'mijoz_demo@dasturxon.test';
  const hasAdmin = Boolean(adminEmail && adminPassword);

  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    console.error(
      'Pass both --admin-email and --admin-password together, or omit both to seed as business owners only.'
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

  if (hasAdmin) {
    // Verify admin login AND admin role in Firestore BEFORE creating catalog
    const adminCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    const adminSnap = await getDoc(doc(db, 'users', adminCred.user.uid));
    if (!adminSnap.exists() || adminSnap.data().role !== 'admin') {
      throw new Error(
        `${adminEmail} hisobining Firestore users/${adminCred.user.uid}.role maydoni "admin" emas! Avval Firebase Console da role = "admin" qiling.`
      );
    }
    await signOut(auth);
  }

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
    console.log(
      `Prepared business: ${store.business.name} [${created.businessStatus}] (${store.products.length} products)`
    );
  }

  if (hasAdmin) {
    // Approve all created pending businesses as Admin
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    for (const s of createdStores) {
      if (s.businessStatus !== 'approved') {
        await updateDoc(doc(db, 'businesses', s.businessId), {
          status: 'approved',
          rejectionReason: '',
          updatedAt: serverTimestamp(),
        });
        s.businessStatus = 'approved';
        console.log(`Admin approved: ${s.business.name}`);
      }
    }
    await signOut(auth);
  }

  // Place sample orders + complete the first one only when the first business is approved
  const firstApproved = createdStores[0]?.businessStatus === 'approved' ? createdStores[0] : null;
  const orders = firstApproved
    ? await seedCustomerOrders(auth, db, firstApproved, customerEmail, demoPassword)
    : null;
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

  const pendingCount = createdStores.filter((s) => s.businessStatus !== 'approved').length;
  const totalProducts = createdStores.reduce((n, s) => n + s.products.length, 0);
  const wholesaleCount = createdStores.reduce(
    (n, s) => n + s.products.filter((p) => p.wholesaleEnabled).length,
    0
  );
  console.log('\n=== DEMO SEED COMPLETE ===');
  console.log(
    `Businesses: ${createdStores.length} (${createdStores.length - pendingCount} approved, ${pendingCount} pending), Total products: ${totalProducts} (${wholesaleCount} wholesale)`
  );
  for (const s of createdStores) {
    console.log(
      `  - ${s.business.name} [${s.businessStatus}] -> ${s.store.ownerEmail} / ${demoPassword}`
    );
  }
  if (orders) {
    console.log(
      `Demo Customer: ${customerEmail} / ${demoPassword} (${orders.length} sample orders)`
    );
  } else if (pendingCount > 0) {
    console.log(
      'Note: Businesses are in "pending" status. Approve them in /#/admin (or re-run with --admin-email and --admin-password) to make them visible in Customer /#/feed and seed analytics orders.'
    );
  }
  if (hasAdmin) {
    console.log(`Admin: ${adminEmail}`);
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
