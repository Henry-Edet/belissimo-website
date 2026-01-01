import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text:
        "Hi! I'm Bella; I'm Bellissimo's AI assistant. How can I help you today? 💁🏽‍♀️✨",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const API_URL = "http://192.168.254.8:3000/ai/message"; // your LAN backend

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text, // <-- FIXED
          userId: "mobile-user-1",   // optional but recommended
        }),
      });

      const data = await res.json();

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text:
          data.reply ??
          "Hmm… I didn’t fully catch that, could you say it again?",
      };

      setMessages((prev) => [...prev, botMessage]);

      // ---- OPTIONAL: handle actions if you want to show payment links ----
      if (data.action === "CREATE_BOOKING_AND_PAYMENT") {
        const linkMsg = {
          id: Date.now() + 2,
          sender: "bot",
          text: `Here is your payment link:\n${data.paymentUrl}`,
        };
        setMessages((prev) => [...prev, linkMsg]);
      }
      // --------------------------------------------------------------------
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "Network error. Make sure you're connected to WiFi and backend is running.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} style={styles.chatArea}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.sender === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={styles.bubbleText}>{msg.text}</Text>
          </View>
        ))}

        {loading && (
          <ActivityIndicator size="small" style={{ marginVertical: 10 }} />
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="Type a message..."
          style={styles.input}
          value={input}
          onChangeText={setInput}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  chatArea: { flex: 1, padding: 12 },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    marginVertical: 5,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: "#4f46e5",
    alignSelf: "flex-end",
  },
  botBubble: {
    backgroundColor: "#e5e7eb",
    alignSelf: "flex-start",
  },
  bubbleText: {
    color: "#111",
  },
  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
