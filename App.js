import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2, Image as ImageIcon } from 'lucide-react-native';

const API_KEY = 'K81963065788957';

export default function App() {
  const [ready, setReady] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Financial Data
  const[statementMonth, setStatementMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [openingBalance, setOpeningBalance] = useState('16725');
  const [waterReceived, setWaterReceived] = useState('6597');
  const[maintReceived, setMaintReceived] = useState('22800');
  
  // Pending Dues Data
  const [waterPendings, setWaterPendings] = useState([]);
  const[maintPendings, setMaintPendings] = useState([]);
  const [pendingType, setPendingType] = useState('Water'); 

  // Form Data
  const [pFlat, setPFlat] = useState(''); 
  const[pAmount, setPAmount] = useState(''); 
  const [pMonth, setPMonth] = useState('');
  const [vendor, setVendor] = useState(''); 
  const [amount, setAmount] = useState(''); 
  const [remarks, setRemarks] = useState('');
  const [billDate, setBillDate] = useState(new Date().toLocaleDateString('en-IN'));
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    setTimeout(() => setReady(true), 1500);
  },[]);

  // Calculations
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = (parseFloat(openingBalance) || 0) + (parseFloat(waterReceived) || 0) + (parseFloat(maintReceived) || 0);
  const closingBalance = totalIncome - totalExpenses;
  const totalWaterPending = waterPendings.reduce((s, p) => s + (parseFloat(p.amt) || 0), 0);
  const totalMaintPending = maintPendings.reduce((s, p) => s + (parseFloat(p.amt) || 0), 0);

  const exportAndShare = async () => {
    let logoBase64 = "";
    try {
      const asset = Asset.fromModule(require('./icon.png'));
      await asset.downloadAsync();
      logoBase64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: 'base64' });
    } catch (e) { console.log("Logo skip"); }

    // Create HTML for attached bill images
    const billImagesHtml = await Promise.all(expenses.map(async (e) => {
      if (!e.imageUri) return '';
      try {
        const b64 = await FileSystem.readAsStringAsync(e.imageUri, { encoding: 'base64' });
        return `
          <div style="margin-top:20px; border-bottom:1px solid #ccc; padding-bottom:15px; page-break-inside: avoid;">
            <p><b>Bill for:</b> ${e.vendor} (₹${e.amount})</p>
            <img src="data:image/jpeg;base64,${b64}" style="width:100%; max-width:400px; border-radius:8px;" />
          </div>`;
      } catch (err) { return ''; }
    }));

    const html = `
      <html>
        <body style="font-family:Helvetica; padding:20px; color:#333;">
          <div style="text-align:center; border-bottom:4px solid #FFD700; padding-bottom:10px;">
            <h1 style="margin:0; color:#112240; font-size:20px;">SAI BRUNDAVAN APARTMENT ASSOCIATION</h1>
            <p><b>ACCOUNTS STATEMENT - ${statementMonth.toUpperCase()}</b></p>
          </div>
          <table style="width:100%; border-collapse:collapse; margin-top:20px;">
            <thead>
              <tr style="background:#112240; color:white; font-size:11px;">
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">S.No</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Date</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Particulars</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Expenses</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Income</th>
                <th style="padding:10px; border:1px solid #ddd; text-align:left;">Remarks</th>
              </tr>
            </thead>
            <tbody style="font-size:11px;">
              <tr style="background:#e6f2ff; font-weight:bold;">
                <td style="padding:10px; border:1px solid #ddd;">A</td><td style="padding:10px; border:1px solid #ddd;">-</td><td style="padding:10px; border:1px solid #ddd;">Opening Balance (Prev Month)</td><td style="padding:10px; border:1px solid #ddd;"></td><td style="padding:10px; border:1px solid #ddd;">₹${openingBalance}</td><td style="padding:10px; border:1px solid #ddd;">B/F</td>
              </tr>
              <tr style="background:#f4f8ff;">
                <td style="padding:10px; border:1px solid #ddd;">A1</td><td style="padding:10px; border:1px solid #ddd;">-</td><td style="padding:10px; border:1px solid #ddd;">Amt received through water tankers</td><td style="padding:10px; border:1px solid #ddd;"></td><td style="padding:10px; border:1px solid #ddd;">₹${waterReceived}</td><td style="padding:10px; border:1px solid #ddd;">Creditors</td>
              </tr>
              <tr style="background:#f4f8ff;">
                <td style="padding:10px; border:1px solid #ddd;">B</td><td style="padding:10px; border:1px solid #ddd;">-</td><td style="padding:10px; border:1px solid #ddd;">Maintenance total (Current Month)</td><td style="padding:10px; border:1px solid #ddd;"></td><td style="padding:10px; border:1px solid #ddd;">₹${maintReceived}</td><td style="padding:10px; border:1px solid #ddd;">Collection</td>
              </tr>
              ${expenses.map((e, i) => `
                <tr>
                  <td style="padding:10px; border:1px solid #ddd;">${i+1}</td><td style="padding:10px; border:1px solid #ddd;">${e.date}</td><td style="padding:10px; border:1px solid #ddd;">${e.vendor}</td><td style="padding:10px; border:1px solid #ddd;">₹${e.amount}</td><td style="padding:10px; border:1px solid #ddd;"></td><td style="padding:10px; border:1px solid #ddd;">${e.remarks}</td>
                </tr>
              `).join('')}
              <tr style="font-weight:bold; background:#eee;">
                <td style="padding:10px; border:1px solid #ddd;">C</td><td style="padding:10px; border:1px solid #ddd;">-</td><td style="padding:10px; border:1px solid #ddd;">Total Expenses</td><td style="padding:10px; border:1px solid #ddd;">₹${totalExpenses}</td><td style="padding:10px; border:1px solid #ddd;"></td><td style="padding:10px; border:1px solid #ddd;"></td>
              </tr>
              <tr style="font-weight:bold; background:#eee;">
                <td style="padding:10px; border:1px solid #ddd;">D</td><td style="padding:10px; border:1px solid #ddd;">-</td><td style="padding:10px; border:1px solid #ddd;">Total Income (A+A1+B)</td><td style="padding:10px; border:1px solid #ddd;"></td><td style="padding:10px; border:1px solid #ddd;">₹${totalIncome}</td><td style="padding:10px; border:1px solid #ddd;"></td>
              </tr>
              <tr style="background:#FFD700; font-weight:bold; font-size:13px;">
                <td style="padding:10px; border:1px solid #ddd;">E</td><td style="padding:10px; border:1px solid #ddd;">-</td><td style="padding:10px; border:1px solid #ddd;">CLOSING BALANCE</td><td style="padding:10px; border:1px solid #ddd;"></td><td style="padding:10px; border:1px solid #ddd;">₹${closingBalance}</td><td style="padding:10px; border:1px solid #ddd;">Cash in hand</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:20px; border:2px solid #f87171; padding:15px; border-radius:8px; background:#fff9f9;">
            <p style="color:#d9534f; font-weight:bold; font-size:12px; margin:0 0 8px 0;">RECEIVABLES SUMMARY (PENDING DUES):</p>
            <p style="font-size:11px;"><b>Water Pending: ₹${totalWaterPending}</b> (Flats: ${waterPendings.map(p=>p.flat).join(', ') || 'Nil'})</p>
            <p style="font-size:11px; margin-top:5px;"><b>Maintenance Pending: ₹${totalMaintPending}</b> (Flats: ${maintPendings.map(p=>p.flat).join(', ') || 'Nil'})</p>
          </div>

          <div style="page-break-before: always;">
            <h2 style="border-bottom: 2px solid #112240; padding-bottom: 5px;">Verified Bill Attachments</h2>
            ${billImagesHtml.join('')}
          </div>

          <p style="text-align:center; font-style:italic; font-size:10px; margin-top:40px; color:#666;">
            This is an updated statement as on ${new Date().toLocaleString('en-IN')}.
          </p>
          <div style="margin-top:40px; text-align:right;"><p>__________________________<br>Authorized Signature</p></div>
        </body>
      </html>`;
      
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const handleScan = async (type) => {
    let res = await (type === 'camera' 
      ? ImagePicker.launchCameraAsync({ quality: 0.5, base64: true }) 
      : ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true }));
      
    if (res.canceled) return;
    
    setCurrentImage(res.assets[0].uri);
    setIsProcessing(true);
    setVendor('');
    setAmount('');
    setRemarks('');

    try {
      const fd = new FormData();
      fd.append('base64Image', `data:image/jpeg;base64,${res.assets[0].base64}`);
      fd.append('OCREngine', '2');
      
      const apiRes = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { 'apikey': API_KEY },
        body: fd
      });
      
      const data = await apiRes.json();
      const txt = data.ParsedResults?.[0]?.ParsedText || "";
      
      // Smart Decimal Number Detection
      const nums = txt.match(/\d+\.\d{2}/g);
      const bestAmt = nums ? String(Math.max(...nums.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n < 1000000))) : "";
      
      setVendor(txt.split('\n')[0]?.substring(0, 25) || 'New Bill');
      setAmount(bestAmt.split('.')[0]); // Whole numbers for ease
      setRemarks('Auto-captured via OCR');
    } catch(e) {
      console.log(e);
      setRemarks('Manual entry needed');
    }
    
    setIsProcessing(false);
    setModalVisible(true);
  };

  const savePendingDues = () => {
    const entry = { id: Date.now(), flat: pFlat, amt: pAmount, mon: pMonth };
    if (pendingType === 'Water') {
      setWaterPendings([...waterPendings, entry]);
    } else {
      setMaintPendings([...maintPendings, entry]);
    }
    setPFlat(''); setPAmount(''); setPMonth('');
    setPendingModalVisible(false);
  };

  const saveVoucher = () => {
    if (!vendor || !amount) {
      return Alert.alert("Required", "Please enter Particulars and Amount.");
    }
    setExpenses([{
      id: Date.now(),
      vendor: vendor,
      amount: parseInt(amount) || 0,
      remarks: remarks,
      date: billDate,
      imageUri: currentImage
    }, ...expenses]);
    
    setVendor(''); setAmount(''); setRemarks(''); setCurrentImage(null);
    setModalVisible(false);
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
        <Image source={require('./icon.png')} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>SAI BRUNDAVAN</Text>
          <Text style={styles.subTitle}>APARTMENT ASSOCIATION</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={exportAndShare} style={styles.iconBtn}>
            <FileText color="#FFD700" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={exportAndShare} style={[styles.iconBtn, { marginLeft: 10 }]}>
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
          <TouchableOpacity style={[styles.fab, { backgroundColor: '#1d2d50' }]} onPress={() => { setCurrentImage(null); setModalVisible(true); }}>
            <Plus color="#FFD700" size={28} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Add manual</Text>
        </View>
        <View style={styles.actionCol}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: '#1d2d50' }]} onPress={() => handleScan('library')}>
            <Image source={{uri: 'https://img.icons8.com/ios-filled/50/FFD700/image.png'}} style={{width: 24, height: 24}} />
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

      {/* PENDING MODAL */}
      <Modal visible={pendingModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 18 }}>{pendingType} Pending</Text>
              <TouchableOpacity onPress={() => setPendingModalVisible(false)}><X color="#fff" /></TouchableOpacity>
            </View>
            <TextInput placeholder="Flat No" placeholderTextColor="#8892b0" style={styles.modalInput} value={pFlat} onChangeText={setPFlat} />
            <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.modalInput} value={pAmount} onChangeText={setPAmount} />
            <TextInput placeholder="Month" placeholderTextColor="#8892b0" style={styles.modalInput} value={pMonth} onChangeText={setPMonth} />
            <TouchableOpacity style={styles.saveBtn} onPress={savePendingDues}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPendingModalVisible(false)} style={styles.goBackBtn}>
              <Text style={{ color: '#8892b0' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VOUCHER MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.aiAlert}>
              <Sparkles color="#FFD700" size={16} />
              <Text style={{ color: '#FFD700', fontSize: 11, marginLeft: 8, flex: 1 }}>Please verify the auto-captured details.</Text>
            </View>
            <View style={styles.modalHeader}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Voucher Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color="#fff" /></TouchableOpacity>
            </View>
            
            {currentImage && (
              <ScrollView style={{ maxHeight: 200, marginBottom: 15 }}>
                <Image source={{ uri: currentImage }} style={{ width: '100%', height: 350, borderRadius: 8 }} resizeMode="contain" />
              </ScrollView>
            )}

            <TextInput placeholder="Date (DD/MM/YYYY)" placeholderTextColor="#8892b0" style={styles.modalInput} value={billDate} onChangeText={setBillDate} />
            <TextInput placeholder="Particulars" placeholderTextColor="#8892b0" style={styles.modalInput} value={vendor} onChangeText={setVendor} />
            <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.modalInput} value={amount} onChangeText={setAmount} />
            <TextInput placeholder="Remarks" placeholderTextColor="#8892b0" style={styles.modalInput} value={remarks} onChangeText={setRemarks} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={saveVoucher}>
              <Text style={styles.saveBtnText}>Verify & Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.goBackBtn}>
              <Text style={{ color: '#8892b0' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
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
  logo: { width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: '#FFD700' },
  title: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  subTitle: { color: '#fff', fontSize: 9, letterSpacing: 0.5 },
  iconBtn: { padding: 10, backgroundColor: '#1d2d50', borderRadius: 10 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  aiAlert: { backgroundColor: '#1d2d50', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  modalInput: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 12 },
  saveBtn: { backgroundColor: '#FFD700', padding: 16, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  saveBtnText: { color: '#0A192F', fontWeight: 'bold', fontSize: 16 },
  goBackBtn: { marginTop: 15, padding: 10, alignItems: 'center' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,25,47,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 99 }
});
