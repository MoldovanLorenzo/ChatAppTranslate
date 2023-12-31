import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import { useNavigation } from '@react-navigation/native';
export default function Singup() {
  const navigation = useNavigation();
  const [email, setEmail]=useState("")
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [error, setError] = useState('');
  const handleSingup = () => {
    const serverUrl = "https://copper-pattern-402806.ew.r.appspot.com/signup";

    const data = {
      email: email,
      username: username,
      password: password,
      language: selectedCountry,
    };
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email) || email.length > 28) {
      setError('Please enter a valid email address with less than 28 characters.');
      return;
    }
    if (username.length >= 25) {
      setError('Username should be less than 25 characters.');
      return;
    }
    if (!selectedCountry) {
      setError('Please select a language.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{7,19}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be 7-19 characters, and include both letters and numbers.');
      console.log('failed password check')
      return;
    }
    fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((responseData) => {
        if(responseData.response=='OK'){
          navigation.navigate('Login')
          console.log(responseData)
        }else{
          setError("Unknown error when signing up, please try again");
          console.log(responseData)
        }

      })
      .catch((error) => {
        setError("Network error");
      });
  };
  const countries = ["Select your language:","English", "Spanish", "French","German","Italian","Chinese","Japanese","Korean","Arabic","Portugese"];
  const handleCountryChange = (index, value) => {
    setSelectedCountry(value);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ff9a00' }}>
      <View style={{
        backgroundColor: "white",
        height: 530,
        width: 320,
        alignSelf: 'center',
        marginTop: 110,
        borderRadius: 30,
        
      }}>
        <Text style={{
          alignSelf: 'center',
          fontSize: 40,
          fontWeight: 'bold',
          marginTop: 30,
        }}>
          Sign up
        </Text>
        <TextInput 
  placeholder="Email" 
  style={{ padding:5, borderBottomWidth: 1, borderBottomColor: 'gray', margin: 20 }} 
  onChangeText={(text) => setEmail(text)} 
  value={email}
/>
<TextInput 
  placeholder="Username" 
  style={{ padding:5, borderBottomWidth: 1, borderBottomColor: 'gray', margin: 20 }} 
  onChangeText={(text) => setUsername(text)} 
  value={username} 
/>
<TextInput 
  placeholder="Password" 
  style={{ padding: 0, borderBottomWidth: 1, borderBottomColor: 'gray', margin: 20 }} 
  onChangeText={(text) => setPassword(text)} 
  value={password} 
/>
        <ModalDropdown
          options={countries}
          onSelect={handleCountryChange}
          defaultValue="Select a language"
          style={{ margin: 10,alignSelf:'center' }}
        />
        {error !== '' && ( 
        <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 10 }}>
          {error}
        </Text>
         )}
        <TouchableOpacity onPress={()=>handleSingup()} style={{alignSelf:'center',backgroundColor:'#ff9a00',paddingVertical:15,paddingHorizontal:60,borderRadius:10,marginTop:40}}>
          <Text>Sign up</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
  <Text style={{ marginRight: 5 }}>Already signed up?</Text>
  <TouchableOpacity onPress={()=>navigation.navigate('Login')}>
    <Text style={{ color: '#ff9a00' }}>Login</Text>
  </TouchableOpacity>
</View>
      </View>
    </View>
  );
}
