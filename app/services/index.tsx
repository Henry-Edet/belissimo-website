import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

const SERVICES = [
  {
    id: 'installation',
    title: 'Wig Installation & Styling',
    subtitle: 'Frontals, closures, ponytails, revamps',
    image: require('../../assets/images/installation.jpg'),
  },
  {
    id: 'braids',
    title: 'Braids',
    subtitle: 'Knotless, boho, cornrows, ponytails',
    image: require('../../assets/images/braids.jpg'),
  },
  {
    id: 'wash',
    title: 'Wash & Care',
    subtitle: 'Wash, condition, treatment & drying',
    image: require('../../assets/images/washingHair.jpg'),
  },
];

export default function ServicesIndexScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Choose a category</Text>

      {SERVICES.map((service, idx) => (
        <TouchableOpacity
          key={service.id}
          onPress={() => router.push(`/services/${service.id}`)}
        >
          <MotiView
            style={styles.card}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150 + idx * 100 }}
          >
            <Image source={service.image} style={styles.image} />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{service.title}</Text>
              <Text style={styles.subtitle}>{service.subtitle}</Text>
            </View>
          </MotiView>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8F9',
    paddingHorizontal: 16,
    paddingTop: 16,
    flex: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#3B1C1A',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  textBlock: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B1A19',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7C6A69',
  },
});
