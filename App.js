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
  const[pendingModalVisible, setPendingModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');

  const[month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [openingBalance, setOpeningBalance] = useState('16725');
  const[waterReceived, setWaterReceived] = useState('6597');
  const[maintReceived, setMaintReceived] = useState('22800');

  const[waterPendings, setWaterPendings] = useState([]);
  const [maintPendings, setMaintPendings] = useState([]);
  const [pendingType, setPendingType] = useState('Water');

  const[pFlat, setPFlat] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pMonth, setPMonth] = useState('');
  
  const [vendor, setVendor] = useState('');
  const[amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const[billDate, setBillDate] = useState(todayStr());
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    setTimeout(() => setReady(true), 1500);
  },[]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
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
        <p style="text-align:center; font-style:italic; font-size:9px; margin-top:30px;">
          Updated statement as on ${new Date().toLocaleString('en-IN')}
        </p>
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
    const amtPatterns =[
      /grand\s*total[\s:\-]*([\d,]+\.?\d*)/i,
      /net\s*(?:payable|amount|total)[\s:\-]*([\d,]+\.?\d*)/i,
      /total\s*(?:amount|payable|due)[\s:\-]*([\d,]+\.?\d*)/i,
      /amount\s*(?:payable|due|total)[\s:\-]*([\d,]+\.?\d*)/i,
      /(?:^|\s)total[\s:\-]+([\d,]+\.?\d*)/i,
    ];
    
    outer:
    for (const line of lines) {
      for (const pat of amtPatterns) {
        const m = line.match(pat);
        if (m) {
          const n = parseFloat(m[1].replace(/,/g, ''));
          if (n > 1) { parsedAmount = String(Math.round(n)); break outer; }
        }
      }
    }
    
    if (!parsedAmount) {
      const decimals = (txt.match(/[\d,]+\.\d{2}/g) ||[]).map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n > 5 && n < 9999999);
      if (decimals.length) parsedAmount = String(Math.round(Math.max(...decimals)));
    }

    let parsedDate = todayStr();
    const monthNames = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06', jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
    
    for (const line of lines) {
      let m = line.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
      if (m) {
        const dd = m[1].padStart(2,'0');
        const mm = m[2].padStart(2,'0');
        const yr = m[3].length === 2 ? `20${m[3]}` : m[3];
        parsedDate = `${dd}/${mm}/${yr}`;
        break;
      }
      m = line.match(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i);
      if (m) {
        const dd = m[1].padStart(2,'0');
        const mm = monthNames[m[2].toLowerCase().substring(0,3)];
        parsedDate = `${dd}/${mm}/${m[3]}`;
        break;
      }
    }

    setVendor(parsedVendor);
    setAmount(parsedAmount);
    setBillDate(parsedDate);
    setRemarks('Verified via OCR');
  };

  const handleScan = async (type) => {
    try {
      const opt = { quality: 1, allowsEditing: false };
      const res = type === 'cam' ? await ImagePicker.launchCameraAsync(opt) : await ImagePicker.launchImageLibraryAsync(opt);
      
      if (res.canceled) return;
      
      setVendor(''); setAmount(''); setRemarks(''); setBillDate(todayStr());
      setCurrentImage(res.assets[0].uri);
      setIsProcessing(true);
      setOcrMsg('Compressing image...');

      const compressed = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      setOcrMsg('Reading text from bill...');
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
      setOcrMsg('Please verify the details below.');
    } catch (e) {
      console.log(e);
      setOcrMsg('Could not read bill. Please enter manually.');
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
        <Image source={require('./icon.png')} style={styles.logoImg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fullTitle}>SAI BRUNDAVAN</Text>
          <Text style={styles.subTitle}>APARTMENT ASSOCIATION</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={handleShare} style={styles.reportBtn}>
            <FileText color="#FFD700" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.reportBtn, { marginLeft: 8 }]}>
            <Share2 color="#FFD700" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.monthCard}>
          <Text style={styles.label}>Month:</Text>
          <TextInput style={styles.monthInput} value={statementMonth} onChangeText={setStatementMonth} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accounting Setup</Text>
          
          <Text style={styles.smallLabel}>Opening Bal (A)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={openingBalance} onChangeText={setOpeningBalance} />
          
          <Text style={styles.smallLabel}>Water tankers received (A1)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={waterReceived} onChangeText={setWaterReceived} />
          <TouchableOpacity style={styles.addBtn} onPress={() => { setPendingType('Water'); setPendingModalVisible(true); }}>
            <UserPlus size={12} color="#FFD700" />
            <Text style={styles.addBtnText}>Add Pending Water Dues</Text>
          </TouchableOpacity>

          <Text style={styles.smallLabel}>Maintenance Total (B)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={maintReceived} onChangeText={setMaintReceived} />
          <TouchableOpacity style={styles.addBtn} onPress={() => { setPendingType('Maintenance'); setPendingModalVisible(true); }}>
            <UserPlus size={12} color="#FFD700" />
            <Text style={styles.addBtnText}>Add Pending Maintenance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={{ color: '#8892b0' }}>Closing Balance (E)</Text>
          <Text style={styles.totalAmount}>₹{closingBalance.toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Expenditure Ledger</Text>
        {expenses.map((e, idx) => (
          <View key={e.id} style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{idx + 1}. {e.vendor}</Text>
              <Text style={{ color: '#8892b0', fontSize: 11 }}>{e.date}</Text>
            </View>
            <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>₹{e.amount}</Text>
            <TouchableOpacity onPress={() => setExpenses(expenses.filter(x => x.id !== e.id))}>
              <Trash2 size={18} color="#f87171" style={{ marginLeft: 15 }} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.actionCol}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: '#1d2d50' }]} onPress={() => { setCurrentImage(null); setVendor(''); setAmount(''); setRemarks(''); setBillDate(todayStr()); setModalVisible(true); }}>
            <Plus color="#FFD700" size={28} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Manual</Text>
        </View>
        <View style={styles.actionCol}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: '#1d2d50' }]} onPress={() => handleScan('library')}>
            <ImageIcon color="#0A192F" size={24} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Gallery</Text>
        </View>
        <View style={styles.actionCol}>
          <TouchableOpacity style={styles.fab} onPress={() => handleScan('camera')}>
            <Camera color="#0A192F" size={28} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Scan Bill</Text>
        </View>
      </View>

      {/* PENDING DUES MODAL */}
      <Modal visible={pendingModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 18 }}>{pendingType} Pending</Text>
              <TouchableOpacity onPress={() => setPendingModalVisible(false)}><X color="#fff" /></TouchableOpacity>
            </View>
            <TextInput placeholder="Flat No (e.g. 504)" placeholderTextColor="#8892b0" style={styles.modalInput} value={pFlat} onChangeText={setPFlat} />
            <TextInput placeholder="Amount Pending (₹)" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.modalInput} value={pAmount} onChangeText={setPAmount} />
            <TextInput placeholder="Month(s) (e.g. June-July)" placeholderTextColor="#8892b0" style={styles.modalInput} value={pMonth} onChangeText={setPMonth} />
            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              const n = { id: Date.now(), flat: pFlat, amt: pAmount, mon: pMonth };
              pendingType === 'Water' ? setWaterPendings([...waterPendings, n]) : setMaintPendings([...maintPendings, n]);
              setPFlat(''); setPAmount(''); setPMonth('');
              setPendingModalVisible(false);
            }}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VOUCHER MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.aiAlert}>
              <Sparkles color="#FFD700" size={16} />
              <Text style={{ color: ocrMsg.startsWith('⚠️') ? '#f87171' : '#FFD700', fontSize: 11, marginLeft: 8, flex: 1 }}>{ocrMsg || 'Enter bill details.'}</Text>
            </View>
            <View style={styles.modalHeader}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Voucher Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color="#fff" /></TouchableOpacity>
            </View>
            
            {currentImage && (
              <Image source={{ uri: currentImage }} style={styles.billImage} resizeMode="contain" />
            )}

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput placeholder="DD/MM/YYYY" placeholderTextColor="#8892b0" style={styles.modalInput} value={billDate} onChangeText={setBillDate} />
            <Text style={styles.fieldLabel}>Particulars</Text>
            <TextInput placeholder="Vendor Name" placeholderTextColor="#8892b0" style={styles.modalInput} value={vendor} onChangeText={setVendor} />
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput placeholder="Total amount paid" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.modalInput} value={amount} onChangeText={setAmount} />
            <Text style={styles.fieldLabel}>Remarks</Text>
            <TextInput placeholder="Remarks" placeholderTextColor="#8892b0" style={styles.modalInput} value={remarks} onChangeText={setRemarks} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              if (!vendor || !amount) { Alert.alert("Required", "Please enter Particulars and Amount."); return; }
              setExpenses([{ id: Date.now(), vendor: vendor, amount: parseInt(amount) || 0, remarks: remarks, date: billDate }, ...expenses]);
              setModalVisible(false);
            }}>
              <Text style={styles.saveBtnText}>Verify & Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={{ color: '#fff', marginTop: 10, fontWeight: 'bold' }}>AI Scanning...</Text>
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
  logoImg: { width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: '#FFD700' },
  fullTitle: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  subTitle: { color: '#fff', fontSize: 9, letterSpacing: 0.5 },
  reportBtn: { padding: 8, backgroundColor: '#1d2d50', borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 5 },
  label: { color: '#8892b0', fontSize: 13 },
  monthInput: { color: '#FFD700', fontWeight: 'bold', marginLeft: 8, fontSize: 14, flex: 1 },
  card: { margin: 20, marginTop: 10, padding: 20, backgroundColor: '#112240', borderRadius: 15 },
  cardTitle: { color: '#FFD700', fontWeight: 'bold', fontSize: 14, marginBottom: 15 },
  smallLabel: { color: '#8892b0', fontSize: 11, marginTop: 10, marginBottom: 5 },
  input: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  addBtn: { flexDirection: 'row', marginTop: 10, alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#0A192F', padding: 6, borderRadius: 6 },
  addBtnText: { color: '#FFD700', fontSize: 10, marginLeft: 6, fontWeight: 'bold' },
  summaryCard: { marginHorizontal: 20, padding: 25, borderRadius: 20, backgroundColor: '#1d2d50', borderLeftWidth: 5, borderLeftColor: '#FFD700', alignItems: 'center' },
  totalAmount: { color: '#fff', fontSize: 38, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', margin: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#112240', marginHorizontal: 20, marginBottom: 12, borderRadius: 12 },
  itemTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  itemDate: { color: '#8892b0', fontSize: 11, marginTop: 2 },
  itemPrice: { color: '#FFD700', fontWeight: 'bold', fontSize: 18 },
  footer: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center' },
  actionCol: { alignItems: 'center', marginHorizontal: 15 },
  fab: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabLabel: { color: '#FFD700', fontSize: 9, marginTop: 8, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#112240', borderRadius: 20, padding: 25 },
  modalScroll: { backgroundColor: '#112240', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  aiAlert: { backgroundColor: '#1d2d50', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  modalInput: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 12 },
  fieldLabel: { color: '#8892b0', fontSize: 10, marginBottom: 4 },
  billImage: { width: '100%', aspectRatio: 0.7, borderRadius: 10, marginBottom: 15, backgroundColor: '#0a192f' },
  saveBtn: { backgroundColor: '#FFD700', padding: 16, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  saveBtnText: { color: '#0A192F', fontWeight: 'bold', fontSize: 16 },
  goBackBtn: { marginTop: 15, padding: 10, alignItems: 'center' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 99 },
  processingText: { color: '#FFD700', marginTop: 12, fontWeight: 'bold', fontSize: 14 }
});
