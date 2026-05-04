import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Requirement: Detail Capture
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');

  const processBill = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Error", "Camera permission is required");

    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (result.canceled) return;

    setLoading(true);
    try {
      // REQUIREMENT: 1MB BYPASS (Compression)
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      setImage(compressed.uri);

      // REQUIREMENT: OCR (Reading columns/details)
      let formData = new FormData();
      formData.append('base64Image', `data:image/jpeg;base64,${compressed.base64}`);
      formData.append('apikey', 'K81234567888957'); // Standard Free Key
      formData.append('isTable', 'true'); // Helps with column-based bills

      const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData });
      const json = await res.json();
      const text = json.ParsedResults[0].ParsedText;

      // Extracting Data from OCR text
      const lines = text.split('\n').filter(l => l.trim() !== '');
      const dateRegex = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/;
      const amountRegex = /\d+\.\d{2}/;

      setVendor(lines[0] || "Unknown Vendor");
      const foundDate = text.match(dateRegex);
      setDate(foundDate ? foundDate[0] : "");
      const foundAmount = text.match(amountRegex);
      setAmount(foundAmount ? foundAmount[0] : "");

    } catch (e) {
      Alert.alert("OCR Error", "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    // REQUIREMENT: Bills placed AFTER statement page
    const html = `
      <html>
        <style>
          body { font-family: 'Helvetica'; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #007AFF; padding-bottom: 10px; }
          .statement-table { width: 100%; margin-top: 30px; border-collapse: collapse; }
          .statement-table td { padding: 12px; border: 1px solid #ddd; }
          .bill-container { page-break-before: always; text-align: center; }
          .bill-img { width: 90%; margin-top: 20px; border: 1px solid #000; }
        </style>
        <body>
          <div class="header">
            <h1>SAI BRUNDAVAN APARTMENTS</h1>
            <h2>Audit Verification Statement</h2>
          </div>
          
          <table class="statement-table">
            <tr><td><strong>Vendor Name</strong></td><td>${vendor}</td></tr>
            <tr><td><strong>Bill Date</strong></td><td>${date}</td></tr>
            <tr><td><strong>Audit Amount</strong></td><td>₹${amount}</td></tr>
            <tr><td><strong>Status</strong></td><td>Verified via OCR</td></tr>
          </table>

          <div class="bill-container">
            <h2>ORIGINAL BILL ATTACHMENT</h2>
            <img src="${image}" class="bill-img" />
          </div>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>SBA Audit System</Text>
      
      <TouchableOpacity style={styles.mainBtn} onPress={processBill} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CAPTURE BILL</Text>}
      </TouchableOpacity>

      {image && (
        <View style={styles.form}>
          <Text style={styles.label}>Vendor Name</Text>
          <TextInput style={styles.input} value={vendor} onChangeText={setVendor} />
          
          <Text style={styles.label}>Date</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} />
          
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

          <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF}>
            <Text style={styles.btnText}>CREATE PDF STATEMENT</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0A192F', padding: 25, alignItems: 'center' },
  title: { fontSize: 26, color: '#fff', fontWeight: 'bold', marginVertical: 20 },
  mainBtn: { backgroundColor: '#007AFF', padding: 20, borderRadius: 15, width: '100%', alignItems: 'center' },
  pdfBtn: { backgroundColor: '#28a745', padding: 20, borderRadius: 15, width: '100%', alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  form: { width: '100%', marginTop: 25, backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  label: { color: '#666', fontSize: 12, marginBottom: 5, fontWeight: 'bold' },
  input: { borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 15, padding: 8, fontSize: 16, color: '#000' }
});
