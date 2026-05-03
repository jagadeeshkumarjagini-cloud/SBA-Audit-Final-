import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2, Image as ImageIcon } from 'lucide-react-native';

const API_KEY = 'K81963065788957';
const todayStr = () => new Date().toLocaleDateString('en-IN');

export default function App() {
  const [ready, setReady] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');

  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [openingBalance, setOpeningBalance] = useState('16725');
  const [waterReceived, setWaterReceived] = useState('6597');
  const [maintReceived, setMaintReceived] = useState('22800');

  const [waterPendings, setWaterPendings] = useState([]);
  const [maintPendings, setMaintPendings] = useState([]);
  const [pendingType, setPendingType] = useState('Water');

  const [pFlat, setPFlat] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pMonth, setPMonth] = useState('');
  
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [billDate, setBillDate] = useState(todayStr());
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    setTimeout(() => setReady(true), 1500);
  }, []);

  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalIncome = (parseFloat(openingBalance) || 0) + (parseFloat(waterReceived) || 0) + (parseFloat(maintReceived) || 0);
  const closingBalance = totalIncome - totalExpenses;
  const totalWaterPending = waterPendings.reduce((s, p) => s + (parseFloat(p.amt) || 0), 0);
  const totalMaintPending = maintPendings.reduce((s, p) => s + (parseFloat(p.amt) || 0), 0);

  const generateHTML = () => `
    <html>
      <head>
        <style>
          body { font-family: Helvetica; padding: 20px; color: #333; }
          .header { text-align: center; border-bottom: 4px solid #FFD700; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #112240; color: white; padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 10px; }
          td { padding: 10px; border: 1px solid #ddd; font-size: 10px; }
          .opening-row { background-color: #e6f2ff; font-weight: bold; }
          .income-row { background-color: #f4f8ff; font-weight: bold; }
          .closing-row { background-color: #FFD700; color: #000; font-weight: bold; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color:#112240;font-size:18px;">SAI BRUNDAVAN APARTMENT ASSOCIATION</h1>
          <p><b>ACCOUNTS STATEMENT - ${month.toUpperCase()}</b></p>
        </div>
        <table>
          <thead>
            <tr>
              <th>S.No</th><th>Date</th><th>Particulars</th><th>Expenses</th><th>Income</th><th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr class="opening-row">
              <td>A</td><td>-</td><td>Opening Balance (Prev Month)</td><td></td><td>&#8377;${openingBalance}</td><td>B/F</td>
            </tr>
            <tr class="income-row">
              <td>A1</td><td>-</td><td>Amount received through water tankers</td><td></td><td>&#8377;${waterReceived}</td><td>Creditors</td>
            </tr>
            <tr class="income-row">
              <td>B</td><td>-</td><td>Maintenance total (Current Month)</td><td></td><td>&#8377;${maintReceived}</td><td>Collection</td>
            </tr>
            ${expenses.map((e, i) => `<tr><td>${i + 1}</td><td>${e.date}</td><td>${e.vendor}</td><td>&#8377;${e.amount}</td><td></td><td>${e.remarks}</td></tr>`).join('')}
            <tr style="font-weight:bold; background:#eee;">
              <td>C</td><td>-</td><td>Total Expenses</td><td>&#8377;${totalExpenses}</td><td></td><td></td>
            </tr>
            <tr style="font-weight:bold; background:#eee;">
              <td>D</td><td>-</td><td>Total Income (A+A1+B)</td><td></td><td>&#8377;${totalIncome}</td><td></td>
            </tr>
            <tr class="closing-row">
              <td>E</td><td>-</td><td>CLOSING BALANCE</td><td></td><td>&#8377;${closingBalance}</td><td>Cash in hand</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:20px; border:1px solid #f87171; padding:15px; border-radius:8px; background:#fff9f9;">
          <p style="color:#d9534f; font-weight:bold; font-size:12px; margin:0 0 8px 0;">RECEIVABLES SUMMARY (PENDING DUES):</p>
          <p style="font-size:11px;"><b>Water Pending: &#8377;${totalWaterPending}</b> (Flats: ${waterPendings.map(p => p.flat).join(', ') || 'Nil'})</p>
          <p style="font-size:11px; margin-top:5px;"><b>Maintenance Pending: &#8377;${totalMaintPending}</b> (Flats: ${maintPendings.map(p => p.flat).join(', ') || 'Nil'})</p>
        </div>
      </body>
    </html>
  `;

  const handleShare = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHTML() });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Could not generate PDF");
    }
  };

  const parseBillText = (txt) => {
    const lines = txt.split('\n').map(l => l.trim()).filter(l => l.length > 1);
    const skipVendor = /^(invoice|bill|receipt|date|time|gst|gstin|tax|phone|mobile|mob|email|address|counter|serve)/i;
    const vendorLine = lines.find(l => /[a-zA-Z]{3,}/.test(l) && !skipVendor.test(l.trim()));
    const parsedVendor = vendorLine ? vendorLine.replace(/[^a-zA-Z0-9 &'.\-]/g, '').trim().substring(0, 35) : 'New Bill';
    
    let parsedAmount = '';
    const amtPatterns = [/grand\s*total[\s:\-]*([\d,]+\.?\d*)/i, /net\s*(?:payable|amount|total)[\s:\-]*([\d,]+\.?\d*)/i, /total\s*(?:amount|payable|due)[\s:\-]*([\d,]+\.?\d*)/i];
    
    outer: for (const line of lines) {
      for (const pat of amtPatterns) {
        const m = line.match(pat);
        if (m) {
          const n = parseFloat(m[1].replace(/,/g, ''));
          if (n > 1) { parsedAmount = String(Math.round(n)); break outer; }
        }
      }
    }
    
    setVendor(parsedVendor);
    setAmount(parsedAmount);
    setBillDate(todayStr());
    setRemarks('Verified via OCR');
  };

  const handleScan = async (type) => {
    try {
      const opt = { quality: 1, allowsEditing: false };
      const res = type === 'cam' ? await ImagePicker.launchCameraAsync(opt) : await ImagePicker.launchImageLibraryAsync(opt);
      if (res.canceled) return;
      
      setCurrentImage(res.assets[0].uri);
      setIsProcessing(true);
      setOcrMsg('Reading text from bill...');

      const compressed = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const fd = new FormData();
      fd.append('base64Image', `data:image/jpeg;base64,${compressed.base64}`);
      fd.append('OCREngine', '2');
      
      const apiRes = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'apikey': API_KEY },
        body: fd
      });
      
      const data = await apiRes.json();
      const rawText = data.ParsedResults?.[0]?.ParsedText || '';
      parseBillText(rawText);
    } catch (e) {
      setOcrMsg('Manual entry required.');
    } finally {
      setIsProcessing(false);
      setModalVisible(true);
    }
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>SBA Accounts Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fullTitle}>SAI BRUNDAVAN</Text>
          <Text style={styles.subTitle}>APARTMENT ASSOCIATION</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.reportBtn}>
          <FileText color="#FFD700" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.monthCard}>
          <Text style={styles.label}>Month:</Text>
          <TextInput style={styles.monthInput} value={month} onChangeText={setMonth} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accounting Setup</Text>
          <Text style={styles.smallLabel}>Opening Bal (A)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={openingBalance} onChangeText={setOpeningBalance} />
          
          <Text style={styles.smallLabel}>Water tankers received (A1)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={waterReceived} onChangeText={setWaterReceived} />
          
          <Text style={styles.smallLabel}>Maintenance Total (B)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={maintReceived} onChangeText={setMaintReceived} />
        </View>

        <View style={styles.summaryCard}>
          <Text style={{ color: '#8892b0' }}>Closing Balance (E)</Text>
          <Text style={styles.totalAmount}>₹{closingBalance.toLocaleString()}</Text>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={styles.sectionTitle}>Expenditure Ledger</Text>
          {expenses.map((e, idx) => (
            <View key={e.id} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{idx + 1}. {e.vendor}</Text>
                <Text style={{ color: '#8892b0', fontSize: 11 }}>{e.date}</Text>
              </View>
              <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>₹{e.amount}</Text>
              <TouchableOpacity onPress={() => setExpenses(expenses.filter(x => x.id !== e.id))}>
                <Trash2 size={18} color="#f87171" style={{ marginLeft: 15 }} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Plus color="#0A192F" size={28} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#112240', marginLeft: 10 }]} onPress={() => handleScan('camera')}>
          <Camera color="#FFD700" size={24} />
        </TouchableOpacity>
      </View>

      {/* Voucher Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>New Entry</Text>
            <TextInput placeholder="Vendor" placeholderTextColor="#8892b0" style={styles.modalInput} value={vendor} onChangeText={setVendor} />
            <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.modalInput} value={amount} onChangeText={setAmount} />
            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              if (!vendor || !amount) return;
              setExpenses([{ id: Date.now(), vendor, amount: parseInt(amount), date: billDate }, ...expenses]);
              setModalVisible(false);
            }}>
              <Text style={styles.saveBtnText}>Save Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#f87171' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Processing Bill...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  loadingContainer: { flex: 1, backgroundColor: '#0A192F', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
  header: { padding: 20, paddingTop: Platform.OS === 'ios' ? 10 : 50, backgroundColor: '#112240', flexDirection: 'row', alignItems: 'center' },
  fullTitle: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  subTitle: { color: '#fff', fontSize: 10 },
  reportBtn: { padding: 10, backgroundColor: '#1d2d50', borderRadius: 8 },
  monthCard: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  label: { color: '#8892b0', fontSize: 14 },
  monthInput: { color: '#FFD700', fontWeight: 'bold', marginLeft: 10, fontSize: 16, flex: 1 },
  card: { margin: 20, padding: 20, backgroundColor: '#112240', borderRadius: 15 },
  cardTitle: { color: '#FFD700', fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  smallLabel: { color: '#8892b0', fontSize: 12, marginTop: 10 },
  input: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 8, marginTop: 5 },
  summaryCard: { margin: 20, padding: 25, backgroundColor: '#1d2d50', borderRadius: 15, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: '#FFD700' },
  totalAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#112240', borderRadius: 10, marginBottom: 10 },
  footer: { position: 'absolute', bottom: 30, right: 20, flexDirection: 'row' },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#112240', padding: 20, borderRadius: 15 },
  modalInput: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  saveBtn: { backgroundColor: '#FFD700', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#0A192F', fontWeight: 'bold' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,25,47,0.8)', justifyContent: 'center', alignItems: 'center' }
});
