import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://192.168.254.8:3000/services"; // <-- your backend IP

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.log("Service fetch error:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading services...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {services.map((svc: any) => (
        <TouchableOpacity
          key={svc.id}
          style={styles.card}
          onPress={() => console.log("Navigate to booking", svc.id)}
        >
          <Text style={styles.name}>{svc.name}</Text>
          <Text style={styles.desc}>{svc.description}</Text>

          <View style={styles.row}>
            <Text style={styles.info}>⏱ {svc.durationMinutes} min</Text>
            <Text style={styles.info}>💰 ₺{svc.priceCents / 100}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {services.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No services found.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  desc: {
    color: "#666",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  info: {
    fontSize: 14,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
