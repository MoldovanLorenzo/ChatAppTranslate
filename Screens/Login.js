import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const serverUrl = "http://simondarius.pythonanywhere.com/login";

    const data = {
      username: username,
      password: password,
    };

    fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then(async (responseData) => {
        console.log("Răspuns de la server:", responseData);

        if (responseData.response === "OK" && responseData.auth_token) {
          await AsyncStorage.setItem("auth_token", responseData.auth_token);
        } else {
        setError("Eroare la autentificare. Verificați datele introduse.");
        }
      })
      .catch((error) => {
        console.error("Eroare de rețea:", error);
      });
  };


  return (
    <View style={{ flex: 1, backgroundColor: "#ff9a00" }}>
      <View
        style={{
          backgroundColor: "white",
          height: 500,
          width: 320,
          alignSelf: "center",
          marginTop: 130,
          borderRadius: 30,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Text
          style={{
            alignSelf: "center",
            fontSize: 40,
            fontWeight: "bold",
            marginTop: 30,
          }}
        >
          Log in
        </Text>
        <TextInput
          placeholder="Username"
          style={{
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: "gray",
            margin: 20,
          }}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          placeholder="Password"
          style={{
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: "gray",
            margin: 20,
          }}
          onChangeText={(text) => setPassword(text)}
        />
        <TouchableOpacity onPress={handleLogin} style={{alignSelf:'center',backgroundColor:'#ff9a00',paddingVertical:15,paddingHorizontal:60,borderRadius:10,marginTop:40}}>
          <Text>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
