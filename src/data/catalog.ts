// Seed catalog. Specs are manufacturer-published figures where available; prices are
// indicative USD starting points. Edit freely — `npm run db:seed` reloads them.

export interface ColorSeed {
  name: string;
  hex: string;
  finish?: "GLOSS" | "METALLIC" | "MATTE" | "PEARL";
  priceDelta?: number;
}

export interface VariantSeed {
  name: string;
  priceDelta: number;
  powerHp?: number;
  torqueNm?: number;
  zeroToHundred?: number;
  topSpeedKmh?: number;
  note?: string;
}

export interface CarSeed {
  slug: string;
  brand: string; // brand slug
  model: string;
  year: number;
  tagline: string;
  description: string;
  bodyType: "HYPER" | "GT" | "SEDAN" | "SUV";
  priceFrom: number;
  engine: string;
  powerHp: number;
  torqueNm: number;
  zeroToHundred: number;
  topSpeedKmh: number;
  drivetrain: string;
  transmission: string;
  seats: number;
  weightKg?: number;
  status?: "AVAILABLE" | "RESERVED" | "AUCTION" | "COMING_SOON";
  featured?: boolean;
  exterior: ColorSeed[];
  variants: VariantSeed[];
}

export const brands = [
  { slug: "ferrari", name: "Ferrari", country: "Italy", founded: 1947, accentHex: "#c8102e", tagline: "Born in Maranello" },
  { slug: "lamborghini", name: "Lamborghini", country: "Italy", founded: 1963, accentHex: "#d4a017", tagline: "Expect the unexpected" },
  { slug: "bugatti", name: "Bugatti", country: "France", founded: 1909, accentHex: "#1f4e9c", tagline: "Molsheim, without compromise" },
  { slug: "rolls-royce", name: "Rolls-Royce", country: "United Kingdom", founded: 1904, accentHex: "#b8b8c0", tagline: "The pinnacle of luxury" },
  { slug: "bentley", name: "Bentley", country: "United Kingdom", founded: 1919, accentHex: "#2e5c4a", tagline: "Extraordinary journeys" },
  { slug: "aston-martin", name: "Aston Martin", country: "United Kingdom", founded: 1913, accentHex: "#00594f", tagline: "Intensity. Driven by soul" },
  { slug: "mclaren", name: "McLaren", country: "United Kingdom", founded: 1963, accentHex: "#ff8000", tagline: "Fearlessly forward" },
  { slug: "porsche", name: "Porsche", country: "Germany", founded: 1931, accentHex: "#a8916b", tagline: "There is no substitute" },
  { slug: "maybach", name: "Mercedes-Maybach", country: "Germany", founded: 1909, accentHex: "#8a7a5c", tagline: "Exclusive by nature" },
  { slug: "byd", name: "BYD", country: "China", founded: 1995, accentHex: "#2f6bff", tagline: "Build your dreams" },
];

export const interiorPalette: ColorSeed[] = [
  { name: "Nero Leather", hex: "#1b1a19" },
  { name: "Cognac", hex: "#8a5530" },
  { name: "Ivory", hex: "#e6dccb", priceDelta: 4500 },
  { name: "Oxblood", hex: "#5b1d22", priceDelta: 6200 },
];

export const caliperPalette: ColorSeed[] = [
  { name: "Champagne", hex: "#c9a96e" },
  { name: "Gloss Black", hex: "#141414" },
  { name: "Racing Red", hex: "#b3121b", priceDelta: 1800 },
];

export const cars: CarSeed[] = [
  {
    slug: "ferrari-sf90-stradale",
    brand: "ferrari",
    model: "SF90 Stradale",
    year: 2024,
    tagline: "A plug-in hybrid that rewrote Maranello's rulebook",
    description:
      "Three electric motors and a twin-turbo V8 combine for 1,000 cv, making the SF90 the most powerful road Ferrari of its generation. Silent in eDrive, savage on the circuit.",
    bodyType: "HYPER",
    priceFrom: 524000,
    engine: "4.0L twin-turbo V8 + 3 e-motors",
    powerHp: 986,
    torqueNm: 800,
    zeroToHundred: 2.5,
    topSpeedKmh: 340,
    drivetrain: "AWD",
    transmission: "8-speed DCT",
    seats: 2,
    weightKg: 1570,
    featured: true,
    exterior: [
      { name: "Rosso Corsa", hex: "#c0111f" },
      { name: "Giallo Modena", hex: "#f3c300", priceDelta: 12000 },
      { name: "Nero Daytona", hex: "#0e0e10", finish: "METALLIC", priceDelta: 9000 },
      { name: "Bianco Avus", hex: "#efece6" },
      { name: "Blu Pozzi", hex: "#173a73", finish: "METALLIC", priceDelta: 14000 },
    ],
    variants: [
      { name: "Stradale", priceDelta: 0 },
      { name: "Assetto Fiorano", priceDelta: 56000, note: "Lightweight pack, Multimatic dampers" },
      { name: "Spider", priceDelta: 52000, note: "Retractable hard top" },
    ],
  },
  {
    slug: "lamborghini-revuelto",
    brand: "lamborghini",
    model: "Revuelto",
    year: 2024,
    tagline: "The first V12 hybrid HPEV from Sant'Agata",
    description:
      "A naturally aspirated 6.5L V12 joined by three electric motors. Carbon monofuselage, scissor doors and over 1,000 cv — the Aventador's successor in every sense.",
    bodyType: "HYPER",
    priceFrom: 608000,
    engine: "6.5L V12 + 3 e-motors",
    powerHp: 1001,
    torqueNm: 725,
    zeroToHundred: 2.5,
    topSpeedKmh: 350,
    drivetrain: "AWD",
    transmission: "8-speed DCT",
    seats: 2,
    weightKg: 1772,
    featured: true,
    exterior: [
      { name: "Arancio Borealis", hex: "#ff6410", finish: "PEARL" },
      { name: "Verde Mantis", hex: "#7cc520", finish: "PEARL", priceDelta: 15000 },
      { name: "Grigio Telesto", hex: "#5d6166", finish: "MATTE", priceDelta: 18000 },
      { name: "Blu Nethuns", hex: "#1d2b52", finish: "METALLIC" },
      { name: "Nero Noctis", hex: "#0b0b0b" },
    ],
    variants: [{ name: "Coupé", priceDelta: 0 }],
  },
  {
    slug: "bugatti-chiron-super-sport",
    brand: "bugatti",
    model: "Chiron Super Sport",
    year: 2022,
    tagline: "1,600 PS, built for the long road to 440 km/h",
    description:
      "The longtail Chiron. Extended rear bodywork, a reprofiled W16 and a top speed of 440 km/h make the Super Sport the ultimate expression of the Chiron lineage.",
    bodyType: "HYPER",
    priceFrom: 3900000,
    engine: "8.0L quad-turbo W16",
    powerHp: 1578,
    torqueNm: 1600,
    zeroToHundred: 2.4,
    topSpeedKmh: 440,
    drivetrain: "AWD",
    transmission: "7-speed DCT",
    seats: 2,
    weightKg: 1995,
    status: "AUCTION",
    featured: true,
    exterior: [
      { name: "Atlantic Blue", hex: "#10305e", finish: "METALLIC" },
      { name: "Nocturne Carbon", hex: "#151619", finish: "GLOSS" },
      { name: "French Racing Blue", hex: "#1f56b5" },
      { name: "Silver", hex: "#b9bcc1", finish: "METALLIC" },
    ],
    variants: [{ name: "Super Sport", priceDelta: 0 }],
  },
  {
    slug: "rolls-royce-phantom",
    brand: "rolls-royce",
    model: "Phantom Series II",
    year: 2024,
    tagline: "The benchmark, quietly perfected",
    description:
      "The Phantom glides on a 6.75L twin-turbo V12 and an architecture of all-aluminium silence. The Gallery fascia turns the dashboard into a curated art space.",
    bodyType: "SEDAN",
    priceFrom: 475000,
    engine: "6.75L twin-turbo V12",
    powerHp: 563,
    torqueNm: 900,
    zeroToHundred: 5.3,
    topSpeedKmh: 250,
    drivetrain: "RWD",
    transmission: "8-speed automatic",
    seats: 5,
    weightKg: 2610,
    featured: true,
    exterior: [
      { name: "Diamond Black", hex: "#101012", finish: "METALLIC" },
      { name: "Arctic White", hex: "#f2f1ec" },
      { name: "Salamanca Blue", hex: "#1a2a4a", finish: "METALLIC" },
      { name: "Twilight Purple", hex: "#3a2140", finish: "PEARL", priceDelta: 22000 },
      { name: "Silver Sand", hex: "#bcb39f", finish: "METALLIC" },
    ],
    variants: [
      { name: "Phantom", priceDelta: 0 },
      { name: "Phantom Extended", priceDelta: 75000, note: "+220 mm rear legroom" },
    ],
  },
  {
    slug: "rolls-royce-cullinan",
    brand: "rolls-royce",
    model: "Cullinan Series II",
    year: 2025,
    tagline: "Effortless, everywhere",
    description:
      "An SUV conceived as a Rolls-Royce first. Magic Carpet Ride suspension, a three-box silhouette and a 6.75L V12 for any terrain, in absolute composure.",
    bodyType: "SUV",
    priceFrom: 420000,
    engine: "6.75L twin-turbo V12",
    powerHp: 563,
    torqueNm: 850,
    zeroToHundred: 5.2,
    topSpeedKmh: 250,
    drivetrain: "AWD",
    transmission: "8-speed automatic",
    seats: 5,
    weightKg: 2750,
    exterior: [
      { name: "Black Diamond", hex: "#0f0f11", finish: "METALLIC" },
      { name: "English White", hex: "#eeebe2" },
      { name: "Emperador Green", hex: "#20372d", finish: "METALLIC", priceDelta: 18000 },
      { name: "Tempest Grey", hex: "#55585c", finish: "METALLIC" },
    ],
    variants: [
      { name: "Cullinan", priceDelta: 0 },
      { name: "Black Badge", priceDelta: 80000, powerHp: 592, torqueNm: 900, note: "Darkened chrome, recalibrated drive" },
    ],
  },
  {
    slug: "bentley-continental-gt-speed",
    brand: "bentley",
    model: "Continental GT Speed",
    year: 2025,
    tagline: "The most powerful Bentley road car yet",
    description:
      "A new hybrid V8 powertrain delivers 782 PS and 1,000 Nm. Hand-finished cabin, rotating display and a grand tourer's appetite for continents.",
    bodyType: "GT",
    priceFrom: 300000,
    engine: "4.0L twin-turbo V8 hybrid",
    powerHp: 771,
    torqueNm: 1000,
    zeroToHundred: 3.2,
    topSpeedKmh: 335,
    drivetrain: "AWD",
    transmission: "8-speed DCT",
    seats: 4,
    weightKg: 2459,
    featured: true,
    exterior: [
      { name: "British Racing Green", hex: "#1c3b2c", finish: "METALLIC" },
      { name: "Beluga", hex: "#0d0d0e" },
      { name: "Glacier White", hex: "#f1f0ea" },
      { name: "Moonbeam", hex: "#9ea3a8", finish: "METALLIC" },
      { name: "Dragon Red", hex: "#7c1018", finish: "PEARL", priceDelta: 9500 },
    ],
    variants: [
      { name: "Coupé", priceDelta: 0 },
      { name: "Convertible", priceDelta: 18000 },
    ],
  },
  {
    slug: "aston-martin-db12",
    brand: "aston-martin",
    model: "DB12",
    year: 2024,
    tagline: "The world's first Super Tourer",
    description:
      "680 PS from a twin-turbo V8, an electronic rear differential and a chassis tuned for agility. Unmistakably DB, decisively sharper.",
    bodyType: "GT",
    priceFrom: 248000,
    engine: "4.0L twin-turbo V8",
    powerHp: 671,
    torqueNm: 800,
    zeroToHundred: 3.6,
    topSpeedKmh: 325,
    drivetrain: "RWD",
    transmission: "8-speed automatic",
    seats: 4,
    weightKg: 1685,
    exterior: [
      { name: "Aston Martin Racing Green", hex: "#0f3d30", finish: "METALLIC" },
      { name: "Magneto Bronze", hex: "#7a5a3a", finish: "METALLIC", priceDelta: 7500 },
      { name: "Onyx Black", hex: "#0e0e0f" },
      { name: "Iridescent Emerald", hex: "#1f5c45", finish: "PEARL", priceDelta: 11000 },
    ],
    variants: [
      { name: "Coupé", priceDelta: 0 },
      { name: "Volante", priceDelta: 17000, note: "8-layer fabric roof" },
    ],
  },
  {
    slug: "mclaren-750s",
    brand: "mclaren",
    model: "750S",
    year: 2024,
    tagline: "Lighter, stronger, faster",
    description:
      "Evolved from the 720S with 30% new parts, the 750S weighs just 1,389 kg dry and pairs 750 PS with McLaren's hydraulic steering for pure feedback.",
    bodyType: "HYPER",
    priceFrom: 332000,
    engine: "4.0L twin-turbo V8",
    powerHp: 740,
    torqueNm: 800,
    zeroToHundred: 2.8,
    topSpeedKmh: 332,
    drivetrain: "RWD",
    transmission: "7-speed SSG",
    seats: 2,
    weightKg: 1389,
    status: "RESERVED",
    exterior: [
      { name: "Papaya Spark", hex: "#ff7a00", finish: "PEARL" },
      { name: "Silica White", hex: "#eeeeea" },
      { name: "Lantana Purple", hex: "#47206b", finish: "METALLIC", priceDelta: 8000 },
      { name: "Onyx Black", hex: "#0d0d0d" },
    ],
    variants: [
      { name: "Coupé", priceDelta: 0 },
      { name: "Spider", priceDelta: 22000, note: "Retractable hard top in 11 s" },
    ],
  },
  {
    slug: "porsche-911-turbo-s",
    brand: "porsche",
    model: "911 Turbo S",
    year: 2025,
    tagline: "The everyday hypercar, now T-Hybrid",
    description:
      "The 992.2 Turbo S introduces T-Hybrid electric turbocharging to the flat-six for 711 PS and the quickest 911 Turbo launch yet.",
    bodyType: "GT",
    priceFrom: 272000,
    engine: "3.6L T-Hybrid flat-six",
    powerHp: 701,
    torqueNm: 800,
    zeroToHundred: 2.5,
    topSpeedKmh: 322,
    drivetrain: "AWD",
    transmission: "8-speed PDK",
    seats: 4,
    weightKg: 1720,
    status: "COMING_SOON",
    exterior: [
      { name: "GT Silver", hex: "#a9acb0", finish: "METALLIC" },
      { name: "Guards Red", hex: "#c01622" },
      { name: "Shade Green", hex: "#3b4d3c", finish: "METALLIC" },
      { name: "Gentian Blue", hex: "#1e3263", finish: "METALLIC" },
    ],
    variants: [
      { name: "Coupé", priceDelta: 0 },
      { name: "Cabriolet", priceDelta: 14000 },
    ],
  },
  {
    slug: "maybach-s680",
    brand: "maybach",
    model: "S 680",
    year: 2024,
    tagline: "Twelve cylinders of absolute calm",
    description:
      "The flagship Maybach: a 6.0L V12, executive rear seats that recline to 43.5° and a cabin that turns any journey into a private lounge.",
    bodyType: "SEDAN",
    priceFrom: 240000,
    engine: "6.0L twin-turbo V12",
    powerHp: 621,
    torqueNm: 900,
    zeroToHundred: 4.5,
    topSpeedKmh: 250,
    drivetrain: "AWD",
    transmission: "9-speed automatic",
    seats: 4,
    weightKg: 2350,
    exterior: [
      { name: "Obsidian Black", hex: "#0e0f11", finish: "METALLIC" },
      { name: "Kalahari Gold / Onyx", hex: "#9a7f55", finish: "METALLIC", priceDelta: 16000 },
      { name: "Diamond White", hex: "#efeee9", finish: "PEARL" },
      { name: "Rubellite Red", hex: "#5c0f1c", finish: "METALLIC" },
    ],
    variants: [{ name: "S 680 4MATIC", priceDelta: 0 }],
  },
  {
    slug: "lamborghini-urus-se",
    brand: "lamborghini",
    model: "Urus SE",
    year: 2025,
    tagline: "The super SUV, electrified",
    description:
      "Lamborghini's first plug-in hybrid Urus pairs a twin-turbo V8 with an e-motor for 800 CV, electric-only driving and the familiar Urus attitude.",
    bodyType: "SUV",
    priceFrom: 258000,
    engine: "4.0L twin-turbo V8 PHEV",
    powerHp: 789,
    torqueNm: 950,
    zeroToHundred: 3.4,
    topSpeedKmh: 312,
    drivetrain: "AWD",
    transmission: "8-speed automatic",
    seats: 5,
    weightKg: 2505,
    exterior: [
      { name: "Giallo Auge", hex: "#f2c300" },
      { name: "Verde Gea", hex: "#3d5a3a", finish: "METALLIC" },
      { name: "Nero Helene", hex: "#101012", finish: "METALLIC" },
      { name: "Bianco Monocerus", hex: "#f0efe9" },
    ],
    variants: [{ name: "Urus SE", priceDelta: 0 }],
  },
  {
    slug: "byd-yangwang-u9",
    brand: "byd",
    model: "Yangwang U9",
    year: 2024,
    tagline: "BYD's electric hypercar that can dance",
    description:
      "Four in-wheel-adjacent motors deliver 1,300 PS, and the DiSus-X active body control lets the U9 hop, lean and even jump on command. Shenzhen's statement to Maranello.",
    bodyType: "HYPER",
    priceFrom: 233000,
    engine: "Quad-motor electric (e4 platform)",
    powerHp: 1287,
    torqueNm: 1680,
    zeroToHundred: 2.36,
    topSpeedKmh: 309,
    drivetrain: "AWD (4 motors)",
    transmission: "Single-speed",
    seats: 2,
    weightKg: 2475,
    featured: true,
    exterior: [
      { name: "Storm Grey", hex: "#5c6066", finish: "METALLIC" },
      { name: "Lightning Blue", hex: "#1d4fd8", finish: "PEARL", priceDelta: 6000 },
      { name: "Obsidian", hex: "#0d0e10" },
      { name: "Glacier White", hex: "#eef0f2" },
    ],
    variants: [
      { name: "U9", priceDelta: 0 },
      { name: "U9 Track Edition", priceDelta: 90000, note: "Record-run spec aero and tyres" },
    ],
  },
  {
    slug: "byd-yangwang-u8",
    brand: "byd",
    model: "Yangwang U8",
    year: 2024,
    tagline: "The off-roader that floats",
    description:
      "A four-motor range-extended SUV with tank turns, emergency flotation and 1,197 PS. Luxury lounge inside, expedition capability underneath.",
    bodyType: "SUV",
    priceFrom: 152000,
    engine: "Quad-motor EV + 2.0T range extender",
    powerHp: 1180,
    torqueNm: 1280,
    zeroToHundred: 3.6,
    topSpeedKmh: 200,
    drivetrain: "AWD (4 motors)",
    transmission: "Single-speed",
    seats: 5,
    weightKg: 3460,
    exterior: [
      { name: "Earth Green", hex: "#3c4a3a", finish: "METALLIC" },
      { name: "Phantom Black", hex: "#0f1012" },
      { name: "Lunar Silver", hex: "#b4b8bc", finish: "METALLIC" },
    ],
    variants: [{ name: "U8 Luxury Edition", priceDelta: 0 }],
  },
  {
    slug: "byd-seal",
    brand: "byd",
    model: "Seal Excellence AWD",
    year: 2025,
    tagline: "The ocean-inspired performance saloon",
    description:
      "Cell-to-body battery, 530 PS dual-motor AWD and a sub-4-second sprint. BYD's answer to the premium electric saloon, beautifully finished.",
    bodyType: "SEDAN",
    priceFrom: 48000,
    engine: "Dual-motor electric (82.5 kWh Blade)",
    powerHp: 523,
    torqueNm: 670,
    zeroToHundred: 3.8,
    topSpeedKmh: 180,
    drivetrain: "AWD",
    transmission: "Single-speed",
    seats: 5,
    weightKg: 2185,
    exterior: [
      { name: "Aurora White", hex: "#f2f2f0" },
      { name: "Atlantis Grey", hex: "#4d555c", finish: "METALLIC" },
      { name: "Horizon Blue", hex: "#1f4f7a", finish: "PEARL" },
      { name: "Cosmos Black", hex: "#0e0f11" },
    ],
    variants: [
      { name: "Design RWD", priceDelta: -6000, powerHp: 308, zeroToHundred: 5.9 },
      { name: "Excellence AWD", priceDelta: 0 },
    ],
  },
];
