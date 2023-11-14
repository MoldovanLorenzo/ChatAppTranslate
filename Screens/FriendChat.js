import React, { useState, useEffect } from 'react';
import { View, Image, FlatList, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { SocketProvider, useSocket } from '../hooks/socketInstance';
import { useNavigation } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Flag from 'react-native-flags';
const getFlagCode = (language) => {
  const languageToCodeMapping = {
    Spanish: 'ES',
    English:'GB' 
  };
  return languageToCodeMapping[language] || 'EU'; 
};
const FriendChat = ({ route }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const image=route.params.friend.photo;
  const friend_language=route.params.friend.language;
  let my_language= null;
  const socket = useSocket();
  const db = SQLite.openDatabase("CoralCache.db");
  const chatroom_id = route.params.friend.id;
  function generateUUID() {
    let d = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }
  const prepareMessages = (messages) => {
    const sortedMessages = messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const preparedMessages = [];
    let lastDate = null;
  
    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toLocaleDateString();
      if (messageDate !== lastDate) {
        preparedMessages.push({ type: 'dateSeparator', date: messageDate });
        lastDate = messageDate;
      }
      preparedMessages.push(message);
    });
    return preparedMessages;
  };
  const saveMessage = (newMessage, local) => {
    return new Promise((resolve, reject) => {
      const mirroredMessage = {
        id: generateUUID(),
        content: newMessage,
        local_sender: local,
        chatroom_id: chatroom_id,
        timestamp: new Date().toISOString()
      };
      db.transaction(tx => {
        tx.executeSql(
          "INSERT INTO message (id, content, local_sender, chatroom_id, timestamp) VALUES (?, ?, ?, ?, ?);",
          [mirroredMessage.id, mirroredMessage.content, mirroredMessage.local_sender, mirroredMessage.chatroom_id, mirroredMessage.timestamp],
          () => {
            console.log("Message saved");
            resolve(mirroredMessage);
          },
          error => {
            console.error("Error saving message", error);
            reject(error);
          }
        );
      });
    });
  };
  
  
  const loadMessages = async () => {
    try {
      if(my_language==null){
        my_language=await AsyncStorage.getItem('user_language')
      }
      db.transaction(tx => {
        tx.executeSql(
          "SELECT * FROM message WHERE chatroom_id = ? ORDER BY timestamp ASC;",
          [chatroom_id],
          (_, { rows }) => {
            setMessages(rows._array);
          },
          error => { console.error("Error loading messages", error); }
        );
      });
    } catch (error) {
      console.error('Database Error: ' + error.message);
    }
  };
  const sendMessage = async () => {
    if (newMessage.trim() !== '') {
      console.log('Sending message: ' + newMessage + ' to chatroom of id: ' + chatroom_id);
      translateText(newMessage,'ES')
      user_id=await AsyncStorage.getItem('user_id')
      socket.emit('message', {
        message: newMessage,
        room: chatroom_id,
        sender_id:user_id,
      });
      mirroredMessage= await saveMessage(newMessage,1);
      await setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, mirroredMessage];
        return updatedMessages;
      });
      
      setNewMessage('');
    }
  };
  
  
  const translateText = async (toTranslate,targetLanguage) => {
    const url = 'https://api-free.deepl.com/v2/translate';
    const authKey = '5528c6fd-705c-5784-afd2-edba369cb1d9:fx'; // Replace with your actual DeepL Auth Key
    const requestBody = {
      text: [toTranslate],
      target_lang: targetLanguage,
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${authKey}`,
          'User-Agent': 'YourApp/1.2.3', // Replace with your app's user agent
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log(data);
      console.log(data)
    } catch (error) {
      console.error('Error during translation:', error);
    }
  };
  
    useEffect(() => {
     
      socket.on('user_message', (data) => {
        translateText(data.message, 'es').then( async (translatedText) => {
          console.log('The translation is:', translatedText);
          mirroredMessage= await saveMessage(translatedText,0)
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, mirroredMessage];
            return updatedMessages;
          });
        });
      });
      try{
        console.log('Loading messagess..')
        loadMessages();
      }catch{
        console.log('Failed loading messages from storage!')
      }
      return () => {
        socket.off('user_message');
      };
    }, [socket]);
    const renderChatItem = ({ item }) => {
      const styles = StyleSheet.create({
        messageContainer: {
          flexDirection: 'row',
          marginVertical: 5,
          alignItems: 'center',
        },
        messageBubble: {
          padding: 10,
          borderRadius: 20,
          maxWidth: '80%',
        },
        sentMessage: {
          backgroundColor: 'orange',
          marginLeft: 'auto',
          marginRight: 10,
        },
        receivedMessage: {
          backgroundColor: 'lightgray',
          marginLeft: 10,
        },
        userName: {
          fontSize: 14,
        },
        messageText: {
          fontSize: 14,
          color:'white',
          
        },
      });
      if (item.type === 'dateSeparator') {
        // Render date separator
        return (
          <View style={{ alignItems: 'center', padding: 10 }}>
            <Text style={{ fontSize: 12, color: 'lightgray' }}>{item.date}</Text>
          </View>
        );
      } else {
        // Render message
        const isSentMessage = item.local_sender === 1;
        return (
          <View style={[
            styles.messageContainer,
            isSentMessage ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
          ]}>
            <View style={[
              styles.messageBubble,
              isSentMessage ? styles.sentMessage : styles.receivedMessage
            ]}>
              <Text style={styles.messageText}>{item.content}</Text>
            </View>
          </View>
        );
      }
    }
    
  return (
    <View style={{ flex: 1}}>
        <View style={{flexDirection: 'row', alignItems: 'center',justifyContent:'space-between',padding:30}}>
        <TouchableOpacity>
        <FontAwesome name="angle-left" size={30} color="#ff9a00" />
        </TouchableOpacity>
        <View style={{flexDirection:'row',alignItems:'center'}}>
        <Text style={{ position:'relative',zIndex:2,fontWeight:500,marginRight:10}}>{route.params.friend.name}</Text>
        <Image
          source={image ? { uri: "data:image/jpeg;base64,"+image } : require('../assets/default_user.png')}style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderColor:'#ff9a00',
                  borderWidth:2,
                  zIndex:1
                  }}/>
        </View>
        <TouchableOpacity>
        <View style={{flexDirection:'column',alignItems:'center',justifyContent:'space-around'}}>
        <Flag code={getFlagCode(friend_language)} size={16} style={{marginBottom:-7,marginRight:15,height:20,width:20}}/>
        <MaterialCommunityIcons name="rotate-3d-variant" size={24} color="#ff9a00" />
        <Flag code={getFlagCode(my_language)} size={16} style={{marginTop:-7,marginLeft:15,height:20,width:20}}/>  
        </View>  
        </TouchableOpacity>
        </View>
        <FlatList
  data={prepareMessages(messages)}
  keyExtractor={(item, index) => item.id || index.toString()}
  renderItem={renderChatItem}/>
         
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, height: 50, borderColor: 'gray', borderWidth: 1, margin: 5, borderRadius:25,paddingLeft:15 }}
          onChangeText={(text) => setNewMessage(text)}
          value={newMessage}
          placeholder="Introduceți un mesaj..."
          />
          <TouchableOpacity
            style={{ backgroundColor: '#ff9a00', padding: 10, margin: 5, borderRadius: 25}}
            onPress={sendMessage}
          >
            <FontAwesome name="paper-plane" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
  );
};

export default FriendChat;