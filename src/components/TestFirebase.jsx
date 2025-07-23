import React, { useEffect } from 'react';
import { db } from './firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const TestFirebase = () => {
  useEffect(() => {
    const sendTestData = async () => {
      try {
        const docRef = await addDoc(collection(db, "test"), {
          timestamp: new Date(),
          message: "Firebase is working!"
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    };

    sendTestData();
  }, []);

  return <div className="text-green-600 text-xl font-bold">Testing Firebase Connection...</div>;
};

export default TestFirebase;
