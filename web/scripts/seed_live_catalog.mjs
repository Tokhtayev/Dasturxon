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
  deleteDoc,
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

const RETIRED_PRODUCT_NAMES = new Set([
  "Yunusobod Obi Non (to'y partiyasi)",
  'Universam Mini-Market Obi Noni',
  "Tadbir Medovik To'plami (12 bo'lak)",
  "Kofe-Breyk Pishiriq To'plami (ofislar uchun)",
  'Bayramona Lazer Palov (1 kg lagan)',
  "To'yxona Tandir Somsasi (partiya)",
]);

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
        stock: 48,
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
      {
        name: 'Sedana va Kunjutli Issiq Kulcha',
        category: 'bakery',
        description: "Chetlari qarsildoq, o'rtasi yumshoq va sedana sepilgan mahalla kulcha noni.",
        imageFile: 'retail_kulcha_non.jpg',
        price: 7500,
        costPrice: 3600,
        stock: 36,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Tvorogli Qaymoqli Pishiriq',
        category: 'pastry',
        description: 'Yangi tvorog va vanildan pishirilgan yumshoq tonggi nonushta pishirig‘i.',
        imageFile: 'retail_lavash_pastry.jpg',
        price: 16000,
        costPrice: 8000,
        stock: 20,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: "Optom Tandir Non — To'yxona Partiyasi (200+)",
        category: 'bakery',
        description:
          "Shahriston va Yunusobod to'yxonalari, oshxonalar uchun issiq tandir non partiyasi (200 tadan 2 700 so'm).",
        imageFile: 'wholesale_non_market.jpg',
        price: 5000,
        costPrice: 1800,
        stock: 2000,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 200,
        wholesalePrice: 2700,
      },
      {
        name: "Optom Obi Non — Do'kon va Kafelar (300+)",
        category: 'bakery',
        description:
          "Yunusobod 7-mavze va Universam do'konlariga kunlik tonggi yetkazib berish partiyasi (300 tadan 2 500 so'm).",
        imageFile: 'wholesale_obi_non.jpg',
        price: 4200,
        costPrice: 1700,
        stock: 2400,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 300,
        wholesalePrice: 2500,
      },
      {
        name: 'Optom Samarqand Patir — Marosim Savati (50+)',
        category: 'bakery',
        description:
          "To'y va ehson dasturxonlari uchun qadoqlangan sariyog'li patir partiyasi (50 tadan 9 200 so'm).",
        imageFile: 'wholesale_patir_stack.jpg',
        price: 14000,
        costPrice: 6500,
        stock: 400,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 50,
        wholesalePrice: 9200,
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
      {
        name: "Bayramona Sedana Patir (o'rtacha)",
        category: 'bakery',
        description: '8-mavze tandirida kunjut va sedana bilan yopilgan sersut mahalla patiri.',
        imageFile: 'retail_kulcha_non.jpg',
        price: 12500,
        costPrice: 6000,
        stock: 25,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Mini-Market Tandir Non Partiyasi (150+)',
        category: 'bakery',
        description:
          "8-mavze va 19-mavze mahalla do'konlari uchun kunjutli tandir non bloklari (150 tadan 2 900 so'm).",
        imageFile: 'wholesale_obi_non.jpg',
        price: 4500,
        costPrice: 2000,
        stock: 1200,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 150,
        wholesalePrice: 2900,
      },
      {
        name: "Banket Go'shtli Somsa Qutisi (100+)",
        category: 'bakery',
        description:
          "Ofis tushliklari va banketlar uchun issiq go'shtli somsa partiyasi (100 tadan 6 400 so'm).",
        imageFile: 'wholesale_somsa_qatqat.jpg',
        price: 9500,
        costPrice: 4300,
        stock: 600,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 100,
        wholesalePrice: 6400,
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
      {
        name: "Klassik Napoleon Torti (bo'lak)",
        category: 'confectionery',
        description: 'Qarsildoq qatlama xamir va zavarnoy kremli klassik Napoleon tort bo‘lagi.',
        imageFile: 'retail_napoleon.jpg',
        price: 29000,
        costPrice: 14500,
        stock: 18,
        discountPercent: 10,
        status: 'hot_ready',
      },
      {
        name: 'Qaymoqli Vanil Ekler',
        category: 'pastry',
        description: 'Ichiga tabiiy qaymoqli krem to‘ldirilgan yumshoq fransuzcha ekler.',
        imageFile: 'retail_eclair.jpg',
        price: 12000,
        costPrice: 5500,
        stock: 32,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: 'Tvorogli Qaymoqli Chizkeyk',
        category: 'pastry',
        description: 'Uy tvorogidan tayyorlangan yengil va foydali shirinlik bo‘lagi.',
        imageFile: 'retail_lavash_pastry.jpg',
        price: 26000,
        costPrice: 13000,
        stock: 14,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: "Kafe va Ofis Medovik Bloki (12 bo'lak/quti)",
        category: 'confectionery',
        description:
          "Qahvaxona va kateringlar uchun 12 bo'lakli muhrlangan desert bloki (5 blokdan 180 000 so'm).",
        imageFile: 'wholesale_medovik_whole.jpg',
        price: 240000,
        costPrice: 120000,
        stock: 50,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 5,
        wholesalePrice: 180000,
      },
      {
        name: "Banket Chizkeyk Partiyasi (20+ bo'lak)",
        category: 'pastry',
        description:
          "Shirinlik stoli va tadbirlar uchun alohida qadoqlangan chizkeyk partiyasi (20 tadan 25 000 so'm).",
        imageFile: 'wholesale_cheesecake_box.jpg',
        price: 36000,
        costPrice: 17500,
        stock: 160,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 20,
        wholesalePrice: 25000,
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
        name: 'Qaymoqli Karamel Medovik',
        category: 'pastry',
        description: "Yumshoq biskvit va yengil karamel kremi uyg'unligi.",
        imageFile: 'food_medovik.jpg',
        price: 27000,
        costPrice: 13500,
        stock: 10,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: 'Issiq Kapuchino (katta stakan)',
        category: 'cafe',
        description: "Yangi qovurilgan arabika donlari va mayin sut ko'pikli issiq kapuchino.",
        imageFile: 'retail_cappuccino.jpg',
        price: 24000,
        costPrice: 8500,
        stock: 40,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Qaymoqli Fransuz Ekleri',
        category: 'pastry',
        description: 'Qahva bilan birga tortiladigan nozik krem to‘ldirilgan ekler.',
        imageFile: 'retail_eclair.jpg',
        price: 14000,
        costPrice: 6000,
        stock: 24,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: "Qatlamali Napoleon (bo'lak)",
        category: 'pastry',
        description: 'Krem-patisserli mayin qatlama Napoleon deserti.',
        imageFile: 'retail_napoleon.jpg',
        price: 31000,
        costPrice: 15000,
        stock: 15,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: 'Ofis Kofe-Breyk Desert Seti (15+ quti)',
        category: 'cafe',
        description:
          'Bodomzor va Yunusobod biznes markazlaridagi seminarlar uchun kruassan va pishiriq qutisi (15 tadan).',
        imageFile: 'wholesale_croissant_tray.jpg',
        price: 45000,
        costPrice: 21000,
        stock: 150,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 15,
        wholesalePrice: 31000,
      },
      {
        name: "Konferens-Zal Termos Choy To'plami (15+ choynak)",
        category: 'cafe',
        description:
          "Trening va uchrashuvlar uchun limondor ko'k choy termos to'plami (15 tadan 10 000 so'm).",
        imageFile: 'wholesale_tea_set.jpg',
        price: 15000,
        costPrice: 4200,
        stock: 120,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 15,
        wholesalePrice: 10000,
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
        name: 'Novvotli Qora Choy (1 L choynak)',
        category: 'teahouse',
        description: 'Taom bilan birga tortiladigan xushbo‘y navvotli choy.',
        imageFile: 'food_tea.jpg',
        price: 12000,
        costPrice: 3500,
        stock: 50,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: "Bug'da Pishgan Manti (5 dona)",
        category: 'teahouse',
        description: "Qo'lda tugilgan, maydalangan mol go'shti va piyozli issiq uy mantisi.",
        imageFile: 'retail_manti.jpg',
        price: 34000,
        costPrice: 17500,
        stock: 22,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Qovurma Lag'mon (1 kosa)",
        category: 'teahouse',
        description:
          "Cho'zma lag'mon xamiri, qovurilgan sabzavot va sersuv go'shtli uyg'urcha taom.",
        imageFile: 'retail_lagman.jpg',
        price: 36000,
        costPrice: 18500,
        stock: 20,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Qo'y Go'shtli Qaynatma Sho'rva",
        category: 'teahouse',
        description: "Sopol kosada ko'kat va ziravorlar bilan tortiladigan issiq sho'rva.",
        imageFile: 'retail_shorva.jpg',
        price: 33000,
        costPrice: 17000,
        stock: 18,
        discountPercent: 0,
        status: 'available',
      },
      {
        name: "To'y va Ehson Oshi — Katta Qozon (40+ porsiya)",
        category: 'teahouse',
        description:
          "Yunusobod va Iftixor atrofidagi marosimlarga termokonteynerda qazili to'y oshi (40 porsiyadan 28 500 so'm).",
        imageFile: 'wholesale_plov_kazan.jpg',
        price: 38000,
        costPrice: 20500,
        stock: 400,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 40,
        wholesalePrice: 28500,
      },
      {
        name: 'Korporativ Lagan Lazer Palov (10+ kg)',
        category: 'teahouse',
        description:
          'Jamoaviy tushlik va tadbirlar uchun laganda tortiladigan maxsus palov (10 kgdan 102 000 so‘m).',
        imageFile: 'wholesale_plov_bazar.jpg',
        price: 135000,
        costPrice: 72000,
        stock: 90,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 10,
        wholesalePrice: 102000,
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
      {
        name: 'Samarqandcha Ziyofat Oshi (1 porsiya)',
        category: 'kitchen',
        description: 'Sariq sabzi, mayiz va bedana tuxum bilan bezatilgan Samarqand palovi.',
        imageFile: 'retail_samarkand_osh.jpg',
        price: 41000,
        costPrice: 22000,
        stock: 25,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Uyda Tayyorlangan Chuchvara',
        category: 'kitchen',
        description: "Smetana va ko'kat bilan issiq holda beriladigan mayda uy chuchvarasi.",
        imageFile: 'retail_chuchvara.jpg',
        price: 28000,
        costPrice: 13500,
        stock: 24,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Tandir Lavashli Shashlik Seti',
        category: 'kitchen',
        description: "2 six mol go'shtli shashlik, yupqa tandir lavash va ko'katli piyoz to'plami.",
        imageFile: 'retail_kebab_plate.jpg',
        price: 39000,
        costPrice: 21000,
        stock: 16,
        discountPercent: 10,
        status: 'available',
      },
      {
        name: 'Mangal Kabob Tadbir Partiyasi (60+ six)',
        category: 'kitchen',
        description:
          "Banket va gap-gashtaklar uchun cho'g'da pishirilgan jaz va qiyma kabob partiyasi (60 sixdan 20 500 so'm).",
        imageFile: 'wholesale_shashlik_grill.jpg',
        price: 29000,
        costPrice: 14800,
        stock: 480,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 60,
        wholesalePrice: 20500,
      },
      {
        name: "To'yxona Tandir Somsasi — Katta Partiya (120+ dona)",
        category: 'kitchen',
        description:
          "Bog'ishamol va Yunusobod marosimlari uchun issiq termoyashikda qalin go'shtli somsa (120 tadan 8 200 so'm).",
        imageFile: 'wholesale_somsa_olot.jpg',
        price: 12000,
        costPrice: 5600,
        stock: 720,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 120,
        wholesalePrice: 8200,
      },
    ],
  },
  {
    ownerEmail: 'nonzavod_optom@dasturxon.test',
    ownerName: 'Umidjon Bahodirov',
    ownerNick: 'nonzavod_optom11',
    ownerPhone: '+998 90 950 11 00',
    business: {
      name: 'Yunusobod Non Zavodi — Optom Sex',
      type: 'bakery',
      address: 'Yunusobod tumani, 11-mavze, Sanoat hududi, 4-uy, Toshkent',
      phone: '+998 90 950 11 00',
    },
    expenses: [{ title: '1-nav un (10 qop)', amount: 2250000, category: 'Xomashyo' }],
    products: [
      {
        name: 'Sex Tandir Noni — Katta Qop (200+ dona)',
        category: 'bakery',
        description:
          "Do'kon tarmoqlari va oshxonalar uchun maxsus optom tandir noni (200 tadan 2 650 so'm).",
        imageFile: 'wholesale_non_market.jpg',
        price: 5000,
        costPrice: 1750,
        stock: 3000,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 200,
        wholesalePrice: 2650,
      },
      {
        name: "Yunusobod To'y Patiri — Sex Partiyasi (100+)",
        category: 'bakery',
        description:
          "Sariyog' va kunjutli naqshinkor bayram patiri, to'yxonalar uchun (100 tadan 8 900 so'm).",
        imageFile: 'wholesale_patir_stack.jpg',
        price: 13500,
        costPrice: 6200,
        stock: 800,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 100,
        wholesalePrice: 8900,
      },
    ],
  },
  {
    ownerEmail: 'universam_qandolat@dasturxon.test',
    ownerName: 'Malika Raximova',
    ownerNick: 'universam_qandolat',
    ownerPhone: '+998 90 951 22 00',
    business: {
      name: 'Universam Qandolat va Paxlava Sexi',
      type: 'confectionery',
      address: 'Yunusobod tumani, 8-mavze, Universam bozori yonida, Toshkent',
      phone: '+998 90 951 22 00',
    },
    expenses: [],
    products: [
      {
        name: "Yongoqli Paxlava Lagan — To'y Partiyasi (5+ podnos)",
        category: 'confectionery',
        description:
          "Butun listda kesilgan asal va yong'oqli turk-o'zbek paxlavasi (5 lagandan 290 000 so'm).",
        imageFile: 'wholesale_baklava_walnut.jpg',
        price: 380000,
        costPrice: 195000,
        stock: 40,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 5,
        wholesalePrice: 290000,
      },
      {
        name: 'Asalli Ziyofat Medovik Bloki (10+ dona)',
        category: 'confectionery',
        description:
          'Qaymoqli asal qatlamli katering torti, banket va ofislarga (10 donadan 105 000 so‘m).',
        imageFile: 'wholesale_honey_tray.jpg',
        price: 140000,
        costPrice: 72000,
        stock: 60,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 10,
        wholesalePrice: 105000,
      },
    ],
  },
  {
    ownerEmail: 'iftixor_oshmarkaz@dasturxon.test',
    ownerName: 'Shuxratjon Oshpaz',
    ownerNick: 'iftixor_oshmarkaz',
    ownerPhone: '+998 90 952 33 00',
    business: {
      name: 'Iftixor Katta Qozon Osh Markazi',
      type: 'teahouse',
      address: "Yunusobod tumani, Iftixor ko'chasi, 1-uy (Teleradiokompaniya orqasi), Toshkent",
      phone: '+998 90 952 33 00',
    },
    expenses: [],
    products: [
      {
        name: "Iftixor Katta Qozon To'y Oshi (50+ porsiya)",
        category: 'teahouse',
        description:
          "Qazi, no'xat va bedana tuxumli Toshkent to'y oshi termokonteynerlarda (50 porsiyadan 27 900 so'm).",
        imageFile: 'wholesale_plov_bazar.jpg',
        price: 38000,
        costPrice: 19800,
        stock: 500,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 50,
        wholesalePrice: 27900,
      },
      {
        name: 'Olot Uslubidagi Go‘shtli Somsa (120+ dona)',
        category: 'teahouse',
        description:
          "Yupqa xamirli qarsildoq Olot somsasi katta jamoaviy zakazlar uchun (120 tadan 7 200 so'm).",
        imageFile: 'wholesale_somsa_olot.jpg',
        price: 10500,
        costPrice: 4800,
        stock: 720,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 120,
        wholesalePrice: 7200,
      },
    ],
  },
  {
    ownerEmail: 'bodomzor_mangal@dasturxon.test',
    ownerName: 'Jamshidbek Kabobchi',
    ownerNick: 'bodomzor_mangal',
    ownerPhone: '+998 90 953 44 00',
    business: {
      name: 'Bodomzor Mangal va Katering Sexi',
      type: 'kitchen',
      address: 'Yunusobod tumani, Bodomzor metrosi, Amir Temur 2A-uy, Toshkent',
      phone: '+998 90 953 44 00',
    },
    expenses: [],
    products: [
      {
        name: 'Bodomzor Mangal Shashlik Marafoni (60+ six)',
        category: 'kitchen',
        description:
          "Issiq folgali qutida piyoz va ziravorlar bilan yetkaziladigan six kabob (60 sixdan 19 800 so'm).",
        imageFile: 'wholesale_shashlik_grill.jpg',
        price: 28000,
        costPrice: 14200,
        stock: 600,
        discountPercent: 0,
        status: 'hot_ready',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 60,
        wholesalePrice: 19800,
      },
      {
        name: 'Biznes-Markaz Kofe-Breyk To‘plami (20+ quti)',
        category: 'cafe',
        description:
          'Bodomzor ofislari uchun issiq kruassan va ko‘k choy to‘plami (20 qutidan 29 500 so‘m).',
        imageFile: 'wholesale_croissant_tray.jpg',
        price: 42000,
        costPrice: 19500,
        stock: 200,
        discountPercent: 0,
        status: 'available',
        wholesaleEnabled: true,
        wholesaleOnly: true,
        wholesaleMinQty: 20,
        wholesalePrice: 29500,
      },
    ],
  },
  {
    ownerEmail: 'minor_oshxona@dasturxon.test',
    ownerName: 'Alisherbek Oshpaz',
    ownerNick: 'minor_taomlar',
    ownerPhone: '+998 90 954 55 00',
    business: {
      name: 'Minor Milliy Taomlar Oshxonasi',
      type: 'kitchen',
      address: 'Yunusobod tumani, Minor metrosi yonida, 12-uy, Toshkent',
      phone: '+998 90 954 55 00',
    },
    expenses: [],
    products: [
      {
        name: "Qo'lda Tortilgan Suyiq Lag'mon",
        category: 'kitchen',
        description: "Minor mahallasi uchun yangi cho'zilgan xamir va go'shtli suyiq lag'mon.",
        imageFile: 'retail_lagman.jpg',
        price: 34000,
        costPrice: 17000,
        stock: 22,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Toshkentcha Bug' Manti (5 dona)",
        category: 'kitchen',
        description: "Yupqa xamirli qovoq va mol go'shtli issiq uy mantisi.",
        imageFile: 'retail_manti.jpg',
        price: 35000,
        costPrice: 18000,
        stock: 18,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: "Qazi va Go'shtli Sho'rva",
        category: 'kitchen',
        description: "Yumshoq qo'y go'shti va sabzavotlar bilan qaynatilgan shifobaxsh sho'rva.",
        imageFile: 'retail_shorva.jpg',
        price: 34000,
        costPrice: 17500,
        stock: 15,
        discountPercent: 0,
        status: 'available',
      },
    ],
  },
  {
    ownerEmail: 'shahriston_kafe@dasturxon.test',
    ownerName: 'Madina Qahvachi',
    ownerNick: 'shahriston_kafe',
    ownerPhone: '+998 90 955 66 00',
    business: {
      name: 'Shahriston Kofe va Shirinliklar',
      type: 'cafe',
      address: 'Yunusobod tumani, 5-mavze, Shahriston 18A-uy, Toshkent',
      phone: '+998 90 955 66 00',
    },
    expenses: [],
    products: [
      {
        name: 'Ikkitalik Espresso Kapuchino',
        category: 'cafe',
        description: 'Tonggi tetiklik uchun dolchin sepilgan kremli kapuchino.',
        imageFile: 'retail_cappuccino.jpg',
        price: 25000,
        costPrice: 9000,
        stock: 35,
        discountPercent: 0,
        status: 'hot_ready',
      },
      {
        name: 'Asl Qaymoqli Napoleon',
        category: 'pastry',
        description: 'Har kuni ertalab pishiriladigan yumshoq qatlamali Napoleon.',
        imageFile: 'retail_napoleon.jpg',
        price: 28000,
        costPrice: 14000,
        stock: 16,
        discountPercent: 10,
        status: 'available',
      },
      {
        name: 'Shirin Vanil Ekler (2 dona)',
        category: 'pastry',
        description: 'Ikki donalik qutida vanil kremli fransuz ekleri.',
        imageFile: 'retail_eclair.jpg',
        price: 22000,
        costPrice: 10500,
        stock: 20,
        discountPercent: 0,
        status: 'available',
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
  const existingByName = new Map();
  for (const prodDoc of existingProds.docs) {
    const prodName = prodDoc.data().name;
    if (RETIRED_PRODUCT_NAMES.has(prodName)) {
      await deleteDoc(prodDoc.ref);
      continue;
    }
    existingByName.set(prodName, prodDoc);
  }
  const createdProductIds = [];

  for (const prod of store.products) {
    const wholesaleEnabled = Boolean(prod.wholesaleEnabled);
    const wholesaleOnly = wholesaleEnabled && Boolean(prod.wholesaleOnly);
    const wholesalePayload = wholesaleEnabled
      ? {
          wholesaleEnabled: true,
          wholesaleOnly,
          wholesaleMinQty: prod.wholesaleMinQty,
          wholesalePrice: prod.wholesalePrice,
        }
      : {
          wholesaleEnabled: false,
          wholesaleOnly: false,
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
            : prod.stock;
      const nextStatus =
        prod.status === 'sold_out'
          ? 'sold_out'
          : existingData.status === 'sold_out' && nextStock > 0
            ? prod.status
            : prod.status;
      await updateDoc(match.ref, {
        businessAddress: store.business.address,
        category: prod.category,
        description: prod.description,
        imageUrl: readFoodBase64(prod.imageFile),
        price: prod.price,
        stock: nextStock,
        status: nextStatus,
        discountPercent: prod.discountPercent,
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
        isNew: true,
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
  if (orders && orders.length >= 2 && orders[0]?.isNew) {
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
