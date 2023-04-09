import { useState, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
  setTimeout(SplashScreen.hideAsync, 2000);

  function openDatabase() {
    if (Platform.OS === "web") {
      return {
        transaction: () => {
          return {
            executeSql: () => {},
          };
        },
      };
    }
  
    const db = SQLite.openDatabase("bmiDB.db");
    return db;
  }
  
  const db = openDatabase();

  function Items() {
    const [items, setItems] = useState(null);
 
    useEffect(() => {
      db.transaction((tx) => {
        tx.executeSql(
          `select id, weight, height, bmi, date(itemDate) as itemDate from history order by itemDate desc;`,
          [],
          (_, { rows: { _array } }) => setItems(_array)
        );
        
      });
    }, []);
    console.log(items);
    if (items === null || items.length === 0) {
      return null;
    }
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeading}>BMI History</Text>
        {items.map(({ id,weight,height,bmi,itemDate }) => (
            <Text style={styles.history}key={id}>{itemDate}: {bmi} (W:{weight}, H:{height})</Text>
        ))}
      </View>
    );
  }

  export default function App() {
    const [weight, setWeight] = useState(null);
    const [height, setHeight] = useState(null);
    const [forceUpdate, forceUpdateId] = useForceUpdate();
    const [text, setText] = useState(null);
  
    useEffect(() => {
      db.transaction((tx) => {
        //tx.executeSql(
          //"drop table history;"
        //);
        tx.executeSql(
          "create table if not exists history (id integer primary key not null,weight int,height int,bmi int, itemDate real);"
        );
      });
    }, []);
  
    const add = (weight, height) => {
      // is weight/height empty?
      if (weight === null || weight === "" || height === null || height === "") {
        return false;
      }
      const bmi = ((weight/(height * height)) * 703).toFixed(1); 

      if(bmi < 18.5)
      {
        const text = "Body Mass Index is " + bmi + "\n" + '(Underweight)'
        setText(text);
      }
      else if (bmi > 18.5 && bmi < 24.9 )
      {
        const text = "Body Mass Index is " + bmi + "\n" + '(Healthy)'
        setText(text);
      }
      else if (bmi > 25.0 && bmi < 29.9)
      {
        const text = "Body Mass Index is " + bmi + "\n" + '(Overweight)'
        setText(text);
      }
      else 
      {
        const text = "Body Mass Index is " + bmi + "\n" + '(Obese)'
        setText(text);
      }


      db.transaction(
        (tx) => {
          tx.executeSql("insert into history (weight,height,bmi,itemDate) values (?,?,?,julianday('now'))",[weight, height,bmi]);
          tx.executeSql("select * from history", [], (_, { rows }) =>
            console.log(JSON.stringify(rows))
          );
        },
        null,
        forceUpdate
      );
    };

    return (
      <View style={styles.container}>
        <Text style={styles.toolbar}>BMI Calculator</Text>
        <ScrollView style={styles.content}>
              <TextInput
                onChangeText={(weight) => setWeight(weight)}
                placeholder="Weight in Pounds"
                style={styles.input}
                value={weight}
              />
              <TextInput
                onChangeText={(height) => setHeight(height)}
                placeholder="Height in Inches"
                style={styles.input}
                value={height}
              />
            <TouchableOpacity 
              onPress={() => {add(weight, height),setWeight(null),setHeight(null)}} style={styles.button}>
              <Text style={styles.textButton}>Compute BMI</Text>
            </TouchableOpacity>
            <TextInput
            style={styles.preview}
            value={text}
            editable={false}
            multiline
          />
          <Items   
          />
           </ScrollView>
        
      </View>
    );
  }
  
  function useForceUpdate() {
    const [value, setValue] = useState(0);
    return [() => setValue(value + 1), value];
  }
  

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    toolbar: {
      backgroundColor: '#f4511e',
      color: '#fff',
      textAlign: 'center',
      padding: 25,
      fontSize: 28,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      padding: 10,
    },
    preview: {
      backgroundColor: '#fff',
      flex: 1,
      height: 100,
      fontSize: 28,
      textAlign: 'center',
    },
    input: {
      backgroundColor: '#ecf0f1',
      borderRadius: 3,
      height: 40,
      padding: 5,
      marginBottom: 10,
      flex: 3,
      fontSize: 24,
    },
    button: {
      backgroundColor: '#34495e',
      padding: 10,
      borderRadius: 3,
      marginBottom: 30,
      alignItems: 'center',
    },
    textButton: {
      fontSize: 24,
      color: '#fff',
    },
    text: {
      fontSize: 20,
    },
    sectionContainer: {
      marginBottom: 16,
      marginHorizontal: 16,
    },
    sectionHeading: {
      fontSize: 24,
      marginBottom: 8,
    },
    history: {
      fontSize: 20,
      color: 'black',
    },
  });