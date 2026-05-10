// lib/data/services.ts
// Prices are in USD cents — e.g. 25000 = $250.00

export type SubService = {
  id: string;
  name: string;
  price: number;           // in cents USD
  durationMinutes: number;
  originalId?: string;
};

export type MainService = {
  id: string;
  title: string;
  description: string;
  image: any;
  subservices: SubService[];
};

export const SERVICES: Record<string, MainService> = {
  installation: {
    id: 'installation',
    title: 'Wig Installation & Styling',
    description: 'Frontal, closure, 360 installs & wig artistry.',
    image: require('../../assets/images/installation.jpg'),
    subservices: [
      { id: 'UUID-FRONTAL-123',       name: 'Frontal Install',                        price: 25000, durationMinutes: 120 },
      { id: 'UUID-CLOSURE-INST-123',  name: 'Closure Install',                        price: 20000, durationMinutes: 90  },
      { id: 'UUID-REVAMP-123',        name: 'Wig Revamp',                             price: 15000, durationMinutes: 60  },
      { id: 'UUID-CUSTOM-123',        name: 'Wig Customization',                      price: 20000, durationMinutes: 120 },
      { id: 'UUID-REFILL-123',        name: 'Lace Refill',                            price: 20000, durationMinutes: 120 },
      { id: 'UUID-PONYTAIL-INST-123', name: 'Frontal Ponytail',                       price: 20000, durationMinutes: 120 },
      { id: 'UUID-SEWIN-123',         name: 'Traditional Sew-in',                     price: 20000, durationMinutes: 120 },
      { id: 'UUID-FRONTAL-SEW-123',   name: 'Frontal Sew-in',                         price: 20000, durationMinutes: 120 },
      { id: 'UUID-CLOSURE-SEW-123',   name: 'Closure Sew-in',                         price: 20000, durationMinutes: 120 },
      { id: 'UUID-GLUELESS-123',      name: 'Wigging (Glueless & Traditional)',       price: 20000, durationMinutes: 120 },
    ],
  },

  braids: {
    id: 'braids',
    title: 'Braids & Cornrows',
    description: 'Knotless, boho braids, cornrows & more.',
    image: require('../../assets/images/braids.jpg'),
    subservices: [
      { id: 'UUID-FCURLS-123',   name: 'French Curls',             price: 30000, durationMinutes: 180 },
      { id: 'UUID-KNOTLESS-123', name: 'Knotless Braids',          price: 25000, durationMinutes: 150 },
      { id: 'UUID-BCURLS-123',   name: 'Boho French Curls',        price: 25000, durationMinutes: 150 },
      { id: 'UUID-FULANI-123',   name: 'Fulani Braids',            price: 25000, durationMinutes: 150 },
      { id: 'UUID-BOHO-123',     name: 'Boho Braids',              price: 25000, durationMinutes: 150 },
      { id: 'UUID-CORNROWS-123', name: 'Cornrows with Extensions', price: 25000, durationMinutes: 150 },
      { id: 'UUID-WIGLINES-123', name: 'Wig Lines / Cornrows',     price: 25000, durationMinutes: 150 },
      { id: 'UUID-PONYTAIL-123', name: 'Ponytail',                 price: 25000, durationMinutes: 150 },
      { id: 'UUID-HALF-123',     name: 'Half Cornrow / Half Sew-in', price: 25000, durationMinutes: 150 },
    ],
  },

  wash: {
    id: 'wash',
    title: 'Wash & Care',
    description: 'Wash, conditioning, treatment & drying.',
    image: require('../../assets/images/washingHair.jpg'),
    subservices: [
      { id: 'UUID-WASH-123',     name: 'Wash Only',                    price: 5000,  durationMinutes: 30 },
      { id: 'UUID-FULLCARE-123', name: 'Full Care (Wash + Treatment)', price: 12000, durationMinutes: 60 },
    ],
  },
};