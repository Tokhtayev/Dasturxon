import type { LanguageCode } from '../types/dasturxon';

export interface Translations {
  brandSubtitle: string;
  navHome: string;
  navLiveApp: string;
  navCompare: string;
  navFeatures: string;
  navArchitecture: string;
  navTryLive: string;
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  statBusinesses: string;
  statProducts: string;
  statRoles: string;
  statTests: string;
  workspaceEyebrow: string;
  workspaceTitle: string;
  workspaceSubtitle: string;
  roleCustomer: string;
  roleOwner: string;
  roleAdmin: string;
  resetDemo: string;
  compareEyebrow: string;
  compareTitle: string;
  compareSubtitle: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresSubtitle: string;
  archEyebrow: string;
  archTitle: string;
  archSubtitle: string;
  footerTagline: string;
  footerRights: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  uz: {
    brandSubtitle: 'Mahalla Bozori',
    navHome: 'Bosh sahifa',
    navLiveApp: 'Jonli Web Ilova',
    navCompare: 'Narx taqqoslash',
    navFeatures: 'Imkoniyatlar',
    navArchitecture: 'Arxitektura',
    navTryLive: "Jonli sinab ko'rish",
    heroBadge: '📍 Yunusobod tumani · Dasturxon v2.0',
    heroTitleLine1: "Mahallangiz ta'mi,",
    heroTitleLine2: 'bitta raqamli dasturxonda.',
    heroSubtitle:
      "Yunusoboddagi eng sara novvoyxona, qandolatxona va oshxonalardan issiq tandir non, somsa, osh va shirinliklarni real vaqtdagi zaxira bilan ko'ring, narxlarni solishtiring va olib ketish yoki yetkazib berishga buyurtma bering.",
    heroPrimaryCta: 'Xaridor sifatida ochish',
    heroSecondaryCta: 'Biznes egasi paneli',
    statBusinesses: 'Tasdiqlangan mahalliy biznes',
    statProducts: 'Jonli mahsulot katalogi',
    statRoles: 'Xaridor · Biznes · Admin',
    statTests: 'Rules & Unit testlar',
    workspaceEyebrow: 'INTERAKTIV PLATFORMA',
    workspaceTitle: 'Dasturxon Web Ilovasini hoziroq sinab ko‘ring',
    workspaceSubtitle:
      "Bu shunchaki maket emas: Xaridor, Biznes egasi va Administrator rollari bitta umumiy holatda ishlaydi. Buyurtma bering — u darhol Biznes paneliga tushadi va zaxira kamayadi.",
    roleCustomer: 'Xaridor rejimi',
    roleOwner: 'Biznes egasi',
    roleAdmin: 'Admin nazorati',
    resetDemo: 'Demo holatni tiklash',
    compareEyebrow: 'NARX VA MASOFA SHAFOLFLIGI',
    compareTitle: 'Mahalla bo‘ylab narxlarni solishtiring',
    compareSubtitle:
      "Bir xil turdagi issiq tandir non, somsa va palov narxlarini Yunusobodning turli mavzelaridagi do'konlar kesimida bir qarashda taqqoslang.",
    featuresEyebrow: 'UCH ROLLI EKOTIZIM',
    featuresTitle: 'Har bir ishtirokchi uchun alohida aniqlik',
    featuresSubtitle:
      'Kotlin + Jetpack Compose ilovasi va Cloud Firestore xavfsizlik qoidalariga tayangan yagona biznes mantiqi.',
    archEyebrow: 'TEXNIK ARXITEKTURA VA XAVFSIZLIK',
    archTitle: 'Least-Privilege Firestore Rules & Verified Logic',
    archSubtitle:
      "Tannarx (costPrice) izolyatsiyasi, atomik tranzaksiyalar va Asia/Tashkent vaqt zonasi bo'yicha aniq moliyaviy tahlil.",
    footerTagline:
      "Mahalla bizneslari va xaridorlarni bog'lovchi zamonaviy mahalliy savdo platformasi.",
    footerRights: 'Dasturxon loyihasi · Yunusobod, Toshkent.',
  },
  ru: {
    brandSubtitle: 'Махаллинский базар',
    navHome: 'Главная',
    navLiveApp: 'Живое приложение',
    navCompare: 'Сравнение цен',
    navFeatures: 'Возможности',
    navArchitecture: 'Архитектура',
    navTryLive: 'Попробовать',
    heroBadge: '📍 Юнусабадский район · Dasturxon v2.0',
    heroTitleLine1: 'Вкус вашей махалли',
    heroTitleLine2: 'на одном цифровом дастархане.',
    heroSubtitle:
      'Находите свежий тандырный хлеб, самсу, плов и сладости из проверенных пекарен и кухонь Юнусабада, сравнивайте цены в реальном времени и оформляйте самовывоз или доставку.',
    heroPrimaryCta: 'Открыть как покупатель',
    heroSecondaryCta: 'Панель владельца',
    statBusinesses: 'Проверенных заведений',
    statProducts: 'Позиций в каталоге',
    statRoles: 'Покупатель · Бизнес · Админ',
    statTests: 'Rules & Unit тестов',
    workspaceEyebrow: 'ИНТЕРАКТИВНАЯ ПЛАТФОРМА',
    workspaceTitle: 'Протестируйте веб-приложение Dasturxon прямо сейчас',
    workspaceSubtitle:
      'Все три роли связаны общим состоянием: оформите заказ в роли покупателя — он мгновенно появится в панели владельца, а остаток товара обновится.',
    roleCustomer: 'Покупатель',
    roleOwner: 'Владелец бизнеса',
    roleAdmin: 'Администратор',
    resetDemo: 'Сбросить демо',
    compareEyebrow: 'ПРОЗРАЧНЫЕ ЦЕНЫ',
    compareTitle: 'Сравнение цен по махалле',
    compareSubtitle:
      'Сравнивайте стоимость тандырной лепешки, самсы и плова между пекарнями и кухнями Юнусабада.',
    featuresEyebrow: 'ТРЕХРОЛЕВАЯ ЭКОСИСТЕМА',
    featuresTitle: 'Точность для каждого участника',
    featuresSubtitle:
      'Единая бизнес-логика на базе Android Jetpack Compose, Material 3 и строгих правил Cloud Firestore.',
    archEyebrow: 'АРХИТЕКТУРА И БЕЗОПАСНОСТЬ',
    archTitle: 'Least-Privilege Firestore Rules & Verified Logic',
    archSubtitle:
      'Изоляция себестоимости (costPrice), клиентские транзакции остатков и финансовая аналитика в часовом поясе Asia/Tashkent.',
    footerTagline:
      'Локальная платформа, объединяющая махаллинские пекарни, кухни и покупателей.',
    footerRights: 'Проект Dasturxon · Юнусабад, Ташкент.',
  },
  en: {
    brandSubtitle: 'Neighborhood Market',
    navHome: 'Home',
    navLiveApp: 'Live Web App',
    navCompare: 'Price Compare',
    navFeatures: 'Capabilities',
    navArchitecture: 'Architecture',
    navTryLive: 'Try Live App',
    heroBadge: '📍 Yunusobod District · Dasturxon v2.0',
    heroTitleLine1: 'Your neighborhood flavor,',
    heroTitleLine2: 'on one digital dasturxon.',
    heroSubtitle:
      'Discover hot tandir bread, somsa, plov, and pastries from verified neighborhood bakeries and kitchens across Yunusobod with live stock tracking, price comparison, and instant pickup or delivery ordering.',
    heroPrimaryCta: 'Open Customer Flow',
    heroSecondaryCta: 'Owner Dashboard',
    statBusinesses: 'Verified local businesses',
    statProducts: 'Live catalog items',
    statRoles: 'Customer · Owner · Admin',
    statTests: 'Rules & Unit tests passing',
    workspaceEyebrow: 'INTERACTIVE SANDBOX',
    workspaceTitle: 'Experience the live 3-role Dasturxon platform',
    workspaceSubtitle:
      'This is not a static mockup: Customer, Business Owner, and Admin share one reactive store. Place an order as a customer and watch stock decrement and Owner Analytics recalculate live.',
    roleCustomer: 'Customer Mode',
    roleOwner: 'Business Owner',
    roleAdmin: 'Admin Console',
    resetDemo: 'Reset Demo State',
    compareEyebrow: 'NEIGHBORHOOD PRICE TRANSPARENCY',
    compareTitle: 'Compare fresh food prices across Yunusobod',
    compareSubtitle:
      'Compare identical local staples like Tandir non, Somsa, and Plov across neighborhood vendors in seconds.',
    featuresEyebrow: 'THREE-ROLE ECOSYSTEM',
    featuresTitle: 'Purpose-built precision for every user',
    featuresSubtitle:
      'Mirrors the production Kotlin + Jetpack Compose + Cloud Firestore architecture with zero guesswork.',
    archEyebrow: 'ENGINEERING & SECURITY',
    archTitle: 'Least-Privilege Firestore Rules & Verified Logic',
    archSubtitle:
      'Private costPrice isolation, stock-safe order transactions, and deterministic Asia/Tashkent profit calculations.',
    footerTagline:
      'Neighborhood commerce platform connecting local Uzbek bakeries, kitchens, and customers.',
    footerRights: 'Dasturxon Project · Yunusobod, Tashkent.',
  },
};
