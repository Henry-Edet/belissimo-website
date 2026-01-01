export type SubService = {
  id: string;              // UUID from backend (service table)
  name: string;
  price: number;
  durationMinutes: number;
  originalId?: string;     // Optional legacy identifier from previous data shape
};

export type MainService = {
  id: string;             // "installation" | "braids" | "wash"
  title: string;
  description: string;
  image: any;
  subservices: SubService[];
};

export const SERVICES: Record<string, MainService> = {
  installation: {
    id: "installation",
    title: "Wig Installation & Styling",
    description: "Frontal, closure, 360 installs & wig artistry.",
    image: require("../../assets/images/installation.jpg"),
    subservices: [
      {
        id: "UUID-FRONTAL-123",
        name: "Frontal Install",
        price: 25000,
        durationMinutes: 120
      },
      {
        id: "UUID-CLOSURE-123",
        name: "Closure Install",
        price: 20000,
        durationMinutes: 90
      },
      {
        id: "UUID-REVAMP-123",
        name: "Wig Revamp",
        price: 15000,
        durationMinutes: 60
      },
      {
        id : "UUID-CUSTOMIZATION-123",
        name : "Wig customization",
        price : 20000,
        durationMinutes : 120
      },
      {
        id : "UUID-REFILL-123",
        name : "Lace Refill",
        price : 20000,
        durationMinutes : 120
      },
      {
        id : "UUID-PONYTAIL-123",
        name : "Frontal Ponytail",
        price : 20000,
        durationMinutes : 120
      },
      {
        id : "UUID-SEW-IN-123",
        name : "Traditional sew-in",
        price : 20000,
        durationMinutes : 120
      },
      {
        id : "UUID-FRONTAL-SEW-123",
        name : "Frontal Sew-in",
        price : 20000,
        durationMinutes : 120
      },
      {
        id : "UUID-CLOSURE-123",
        name : "Closure Sew-in",
        price : 20000,
        durationMinutes : 120
      },
      {
        id : "UUID-GLUELESS-123",
        name : "Wigging (glueless and traditional wigging)",
        price : 20000,
        durationMinutes : 120
      },
    ],
  },

  braids: {
    id: "braids",
    title: "Braids",
    description: "Knotless, boho braids, cornrows & more.",
    image: require("../../assets/images/braids.jpg"),
    subservices: [
      {
        id: "UUID-FCURLS-123",
        name: "French Curls",
        price: 30000,
        durationMinutes: 180,
      },
      {
        id: "UUID-KNOTLESS-123",
        name: "Knotless Braids",
        price: 25000,
        durationMinutes: 150,
      },
      {
        id: "UUID-BCURLS-123",
        name: "Boho french curls",
        price: 25000,
        durationMinutes: 150,
      },
      {
        id: "UUID-FULANI-123",
        name: "Fulani Braids",
        price: 25000,
        durationMinutes: 150,
      },
      {
        id: "UUID-BOHO-123",
        name: "Boho Braids",
        price: 25000,
        durationMinutes: 150,
      },
      {
        id: "UUID-CORNROWS-123",
        name: "Cornrows with extension",
        price: 25000,
        durationMinutes: 150,
      },
      {
        id: "UUID-WIG-123",
        name: "Wig lines/cornrows",
        price: 25000,
        durationMinutes: 150,
      },
      {
        id: "UUID-PONYTAIL-123",
        name: "Ponytail",
        price: 25000,
        durationMinutes: 150,
      },
      {
        id: "UUID-HALF-123",
        name: "Half cornrow/half sew-in",
        price: 25000,
        durationMinutes: 150,
      },
    ],
  },

  wash: {
    id: "wash",
    title: "Wash & Care",
    description: "Wash, conditioning, treatment & drying.",
    image: require("../../assets/images/washingHair.jpg"),
    subservices: [
      {
        id: "UUID-WASH-123",
        name: "Wash Only",
        price: 5000,
        durationMinutes: 30,
      },
      {
        id: "UUID-FULLCARE-123",
        name: "Full Care (Wash + Treatment)",
        price: 12000,
        durationMinutes: 60,
      },
    ],
  },
};
