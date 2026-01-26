// app/services/catalog.ts
import { View, Text } from 'react-native';
export type ServiceId = 'installation' | 'braids' | 'wash';

export type Service = {
  id: ServiceId;
  name: string;
  price: number;              // in your local currency (display only)
  durationMinutes: number;
  image: any;                 // require(...) for now
  description: string;
};

export const SERVICE_CATALOG: Record<ServiceId, Service> = {
  installation: {
    id: 'installation',
    name: 'Wig Installation & Styling',
    price: 35000,
    durationMinutes: 120,
    image: require('../../assets/images/installation.jpg'),
    description:
      'Frontal, closure, 360 installs, wig customization, glueless + traditional wigging, lace refills, revamps & frontal ponytails.',
  },
  braids: {
    id: 'braids',
    name: 'Braids & Cornrows',
    price: 40000,
    durationMinutes: 240,
    image: require('../../assets/images/braids.jpg'),
    description:
      'French curls, boho braids, fulani, knotless, cornrows with extensions, wig lines, ponytails, half cornrow / half sew-in.',
  },
  wash: {
    id: 'wash',
    name: 'Wash, Treat & Style',
    price: 15000,
    durationMinutes: 60,
    image: require('../../assets/images/washingHair.jpg'),
    description:
      'Hair washing, conditioning, setting and drying. Perfect reset before styling.',
  },
};

export default function CatalogPlaceholder() {
  return null;
}
