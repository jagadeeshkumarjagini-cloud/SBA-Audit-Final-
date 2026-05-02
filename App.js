import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2, Image as ImageIcon } from 'lucide-react-native';

const API_KEY = 'K81963065788957';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const[modalVisible, setModalVisible] = useState(false);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const[ready, setReady] = useState(false);
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  
  const [oB, setOB] = useState('16725');
  const [wR, setWR] = useState('6597');
  const [mR, setMR] = useState('22800');
  const[wP, setWP] = useState([]);
  const [mP, setMP] = useState([]);
  const [pType, setPType] = useState('Water');
  
  const[pFlat, setPFlat] = useState('');
  const [pAmt, setPAmt] = useState('');
  const[pMon, setPMon] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [img, setImg] = useState(null);

  useEffect(() => { setTimeout(() => setReady(true), 1500); },[]);

  const tE = expenses.reduce((s, e) => s + e.amount, 0);
  const tI = (parseFloat(oB) || 0) + (parseFloat(wR) || 0) + (parseFloat(mR) || 0);
  const closingBalance = tI - tE;
  const totWP = wP.reduce((s, p) => s + (parseFloat(p.amt) || 0), 0);
  const totMP = mP.reduce((s, p) => s + (parseFloat(p.amt) || 0), 0);

  const getHTML = () => `
    <html>
      <body style="font-family:Helvetica;padding:20px;color:#333;">
        <div style="text-align:center;border-bottom:4px solid #FFD700;padding-bottom:10px;">
          <h1 style="margin:0;color:#112240;font-size:18px;">SAI BRUNDAVAN APARTMENT ASSOCIATION</h1>
          <p><b>ACCOUNTS STATEMENT - ${month.toUpperCase()}</b></p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <thead>
            <tr style="background:#112240;color:white;font-size:10px;">
              <th style="padding:10px;border:1px solid #ddd;">S.No</th>
              <th style="padding:10px;border:1px solid #ddd;">Date</th>
              <th style="padding:10px;border:1px solid #ddd;">Particulars</th>
              <th style="padding:10px;border:1px solid #ddd;">Expenses</th>
              <th style="padding:10px;border:1px solid #ddd;">Income</th>
              <th style="padding:10px;border:1px solid #ddd;">Remarks</th>
            </tr>
          </thead>
          <tbody style="font-size:10px;">
            <tr style="background:#e6f2ff;font-weight:bold;">
              <td style="padding:10px;border:1px solid #ddd;">A</td>
              <td style="padding:10px;border:1px solid #ddd;">-</td>
              <td style="padding:10px;border:1px solid #ddd;">Opening Balance (Prev Month)</td>
              <td style="padding:10px;border:1px solid #ddd;"></td>
              <td style="padding:10px;border:1px solid #ddd;">₹${oB}</td>
              <td style="padding:10px;border:1px solid #ddd;">B/F</td>
            </tr>
            <tr style="background:#f4f8ff;">
              <td style="padding:10px;border:1px solid #ddd;">A1</td>
              <td style="padding:10px;border:1px solid #ddd;">-</td>
              <td style="padding:10px;border:1px solid #ddd;">Amt received through water tankers</td>
              <td style="padding:10px;border:1px solid #ddd;"></td>
              <td style="padding:10px;border:1px solid #ddd;">₹${wR}</td>
              <td style="padding:10px;border:1px solid #ddd;">Creditors</td>
            </tr>
            <tr style="background:#f4f8ff;">
              <td style="padding:10px;border:1px solid #ddd;">B</td>
              <td style="padding:10px;border:1px solid #ddd;">-</td>
              <td style="padding:10px;border:1px solid #ddd;">Maintenance total (Current Month)</td>
              <td style="padding:10px;border:1px solid #ddd;"></td>
              <td style="padding:10px;border:1px solid #ddd;">₹${mR}</td>
              <td style="padding:10px;border:1px solid #ddd;">Collection</td>
            </tr>
            ${expenses.map((e, i) => `<tr><td style="padding:10px;border:1px solid #ddd;">${i + 1}</td><td style="padding:10px;border:1px solid #ddd;">${e.date}</td><td style="padding:10px;border:1px solid #ddd;">${e.vendor}</td><td style="padding:10px;border:1px solid #ddd;">₹${e.amount}</td><td style="padding:10px;border:1px solid #ddd;"></td><td style="padding:10px;border:1px solid #ddd;">${e.remarks}</td></tr>`).join('')}
            <tr style="font-weight:bold;background:#eee;">
              <td style="padding:10px;border:1px solid #ddd;">C</td><td style="padding:10px;border:1px solid #ddd;">-</td><td style="padding:10px;border:1px solid #ddd;">Total Expenses</td><td style="padding:10px;border:1px solid #ddd;">₹${tE}</td><td style="padding:10px;border:1px solid #ddd;"></td><td style="padding:10px;border:1px solid #ddd;"></td>
            </tr>
            <tr style="font-weight:bold;background:#eee;">
              <td style="padding:10px;border:1px solid #ddd;">D</td><td style="padding:10px;border:1px solid #ddd;">-</td><td style="padding:10px;border:1px solid #ddd;">Total Income (A+A1+B)</td><td style="padding:10px;border:1px solid #ddd;"></td><td style="padding:10px;border:1px solid #ddd;">₹${tI}</td><td style="padding:10px;border:1px solid #ddd;"></td>
            </tr>
            <tr style="background:#FFD700;font-weight:bold;font-size:12px;">
              <td style="padding:10px;border:1px solid #ddd;">E</td><td style="padding:10px;border:1px solid #ddd;">-</td><td style="padding:10px;border:1px solid #ddd;">CLOSING BALANCE</td><td style="padding:10px;border:1px solid #ddd;"></td><td style="padding:10px;border:1px solid #ddd;">₹${closingBalance}</td><td style="padding:10px;border:1px solid #ddd;">Cash in hand</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:20px;border:1px solid #f87171;padding:10px;font-size:10px;background:#fff9f9;">
          <p style="color:#d9534f;font-weight:bold;margin-top:0;">PENDING RECEIVABLES:</p>
          <p>Water: ₹${totWP} (F: ${wP.map(p => p.flat).join(',') || 'Nil'}) | Maint: ₹${totMP} (F: ${mP.map(p => p.flat).join(',') || 'Nil'})</p>
        </div>
        <p style="text-align:center;font-style:italic;font-size:9px;margin-top:30px;">Updated statement as on ${new Date().toLocaleString('en-IN')}</p>
      </body>
    </html>
  `;

  const doOut = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: getHTML() });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log(error);
    }
  };

  const handleScan = async (type) => {
    let res = await (type === 'cam' 
      ? ImagePicker.launchCameraAsync({ quality: 0.5, base64: true, allowsEditing: true }) 
      : ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true, allowsEditing: true }));
      
    if (res.canceled) return;
    setImg(res.assets[0].uri);
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
      
      const d = await apiRes.json();
      const txt = d.ParsedResults?.[0]?.ParsedText || "";
      const ns = txt.match(/\d+\.\d{2}/g);
      const bA = ns ? String(Math.max(...ns.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => n > 5))) : "";
      
      setVendor(txt.split('\n')[0]?.substring(0, 25) || '');
      setAmount(bA.split('.')[0] || ''); 
      setRemarks('Auto-captured');
    } catch (e) {
      console.log(e);
      setRemarks('Manual entry');
    }
    setIsProcessing(false);
    setModalVisible(true);
  };

  if (!ready) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loaderText}>SBA Accounts Loading...</Text>
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
          <TouchableOpacity onPress={doOut} style={styles.iconBtn}>
            <FileText color="#FFD700" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={doOut} style={[styles.iconBtn, { marginLeft: 10 }]}>
            <Share2 color="#FFD700" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.monthCard}>
          <Text style={styles.label}>Month:</Text>
          <TextInput style={styles.monthInput} value={month} onChangeText={setMonth} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accounting Setup</Text>
          
          <Text style={styles.smallLabel}>Opening Bal (A)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={oB} onChangeText={setOB} />
          
          <Text style={styles.smallLabel}>Water tankers received (A1)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={wR} onChangeText={setWR} />
          <TouchableOpacity style={styles.addBtn} onPress={() => { setPType('Water'); setPendingModalVisible(true); }}>
            <UserPlus size={12} color="#FFD700" />
            <Text style={styles.addBtnText}>Add Pending Water Dues</Text>
          </TouchableOpacity>

          <Text style={styles.smallLabel}>Maintenance Total (B)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={mR} onChangeText={setMR} />
          <TouchableOpacity style={styles.addBtn} onPress={() => { setPType('Maintenance'); setPendingModalVisible(true); }}>
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
          <TouchableOpacity style={[styles.fab, { backgroundColor: '#1d2d50' }]} onPress={() => { setImg(null); setVendor(''); setAmount(''); setRemarks(''); setModalVisible(true); }}>
            <Plus color="#FFD700" size={28} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Add manual</Text>
        </View>
        <View style={styles.actionCol}>
          <TouchableOpacity style={[styles.fab, { backgroundColor: '#1d2d50' }]} onPress={() => handleScan('lib')}>
            <ImageIcon color="#0A192F" size={24} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Gallery</Text>
        </View>
        <View style={styles.actionCol}>
          <TouchableOpacity style={styles.fab} onPress={() => handleScan('cam')}>
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
              <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 18 }}>{pType} Pending</Text>
              <TouchableOpacity onPress={() => setPendingModalVisible(false)}><X color="#fff" /></TouchableOpacity>
            </View>
            <TextInput placeholder="Flat No (e.g. 504)" placeholderTextColor="#8892b0" style={styles.modalInput} value={pFlat} onChangeText={setPFlat} />
            <TextInput placeholder="Amount Pending (₹)" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.modalInput} value={pAmt} onChangeText={setPAmt} />
            <TextInput placeholder="Month(s) (e.g. June-July)" placeholderTextColor="#8892b0" style={styles.modalInput} value={pMon} onChangeText={setPMon} />
            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              const n = { id: Date.now(), flat: pFlat, amt: pAmt, mon: pMon };
              pType === 'Water' ? setWP([...wP, n]) : setMP([...mP, n]);
              setPFlat(''); setPAmt(''); setPMon('');
              setPendingModalVisible(false);
            }}>
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
            
            {img && (
              <ScrollView style={{ maxHeight: 200, marginBottom: 15 }}>
                <Image source={{ uri: img }} style={{ width: '100%', height: 350, borderRadius: 8 }} resizeMode="contain" />
              </ScrollView>
            )}

            <TextInput placeholder="Particulars" placeholderTextColor="#8892b0" style={styles.modalInput} value={vendor} onChangeText={setVendor} />
            <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.modalInput} value={amount} onChangeText={setAmount} />
            <TextInput placeholder="Remarks" placeholderTextColor="#8892b0" style={styles.modalInput} value={remarks} onChangeText={setRemarks} />
            
            <TouchableOpacity style={styles.saveBtn} onPress={() => {
              if (!vendor || !amount) { Alert.alert("Error", "Enter Particulars and Amount"); return; }
              setExpenses([{ id: Date.now(), vendor: vendor, amount: parseInt(amount) || 0, remarks: remarks, date: new Date().toLocaleDateString('en-IN') }, ...expenses]);
              setModalVisible(false);
            }}>
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
  loaderContainer: { flex: 1, backgroundColor: '#0A192F', justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
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
