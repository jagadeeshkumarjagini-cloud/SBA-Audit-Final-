import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2 } from 'lucide-react-native';

const OCR_API_KEY = 'K81963065788957';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [statementMonth, setMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  const [openingBal, setOpening] = useState('16725');
  const [waterRec, setWaterRec] = useState('6597');
  const [maintRec, setMaintRec] = useState('22800');
  const [waterP, setWaterP] = useState([]);
  const [maintP, setMaintP] = useState([]);
  const [pType, setPType] = useState('Water'); 

  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load the icon to prevent crash
        await Asset.fromModule(require('./icon.png')).downloadAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  const totE = expenses.reduce((s, e) => s + e.amount, 0);
  const totI = (parseFloat(openingBal)||0) + (parseFloat(waterRec)||0) + (parseFloat(maintRec)||0);
  const closingBalance = totI - totE;

  const exportReport = async () => {
    const html = `<html><body style="font-family:Helvetica;padding:20px;">
      <div style="text-align:center;border-bottom:4px solid #FFD700;padding-bottom:10px;">
        <h1 style="margin:0;color:#112240;font-size:18px;">SAI BRUNDAVAN APARTMENT ASSOCIATION</h1>
        <p><b>ACCOUNTS STATEMENT - ${statementMonth.toUpperCase()}</b></p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <thead><tr style="background:#112240;color:white;font-size:10px;">
          <th>S.No</th><th>Date</th><th>Particulars</th><th>Expenses</th><th>Income</th><th>Remarks</th>
        </tr></thead>
        <tbody style="font-size:10px;">
          <tr style="background:#e6f2ff;font-weight:bold;"><td>A</td><td>-</td><td>Opening Balance</td><td></td><td>₹${openingBal}</td><td>B/F</td></tr>
          <tr style="background:#f4f8ff;"><td>A1</td><td>-</td><td>Water tankers received</td><td></td><td>₹${waterRec}</td><td>Creditors</td></tr>
          <tr style="background:#f4f8ff;"><td>B</td><td>-</td><td>Maintenance total</td><td></td><td>₹${maintRec}</td><td>Collection</td></tr>
          ${expenses.map((e, i) => `<tr><td>${i+1}</td><td>${e.date}</td><td>${e.vendor}</td><td>₹${e.amount}</td><td></td><td>${e.remarks}</td></tr>`).join('')}
          <tr style="font-weight:bold;background:#eee;"><td>C</td><td>-</td><td>Total Expenses</td><td>₹${totE}</td><td></td><td></td></tr>
          <tr style="font-weight:bold;background:#eee;"><td>D</td><td>-</td><td>Total Income</td><td></td><td>₹${totI}</td><td></td></tr>
          <tr style="background:#FFD700;font-weight:bold;"><td>E</td><td>-</td><td>CLOSING BALANCE</td><td></td><td>₹${closingBalance}</td><td>Cash in hand</td></tr>
        </tbody>
      </table>
      <p style="text-align:center;font-style:italic;font-size:9px;margin-top:20px;">Updated statement as on ${new Date().toLocaleString('en-IN')}</p>
    </body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const handleScan = async () => {
    let res = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (res.canceled) return;
    setProc(true);
    try {
      const f = new FormData();
      f.append('base64Image', `data:image/jpeg;base64,${res.assets[0].base64}`);
      const api = await fetch('https://api.ocr.space/parse/image',{method:'POST',headers:{'apikey':OCR_API_KEY},body:f});
      const data = await api.json();
      const txt = data.ParsedResults?.[0]?.ParsedText || "";
      const nums = txt.match(/[\d,]+\.?\d*/g);
      const bestAmt = nums ? String(Math.max(...nums.map(n=>parseFloat(n.replace(/,/g,''))).filter(n=>n>5))) : "";
      setVendor(txt.split('\n')[0]?.substring(0,25) || 'Bill'); setAmount(bestAmt);
    } catch(e) { console.log(e); }
    setProc(false); setModalVisible(true);
  };

  if (!isReady) return <View style={styles.loading}><ActivityIndicator size="large" color="#FFD700" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('./icon.png')} style={styles.logo} />
        <View style={{flex:1}}><Text style={styles.title}>SAI BRUNDAVAN</Text><Text style={styles.sub}>APARTMENT ASSOCIATION</Text></View>
        <TouchableOpacity onPress={exportReport} style={styles.btn}><Share2 color="#FFD700" size={20}/></TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.setupCard}>
          <Text style={styles.sl}>Opening Bal (A)</Text><TextInput style={styles.in} keyboardType="numeric" value={openingBal} onChangeText={setOpening}/>
          <Text style={styles.sl}>Water Tankers (A1)</Text><TextInput style={styles.in} keyboardType="numeric" value={waterRec} onChangeText={setWaterRec}/>
          <Text style={styles.sl}>Maintenance (B)</Text><TextInput style={styles.in} keyboardType="numeric" value={maintRec} onChangeText={setMaintRec}/>
        </View>
        <View style={styles.sum}><Text style={styles.amt}>₹{closingBalance.toLocaleString()}</Text></View>
        {expenses.map((e,idx) => (
          <View key={e.id} style={styles.item}>
            <View style={{flex:1}}><Text style={{color:'#fff'}}>{idx+1}. {e.vendor}</Text></View>
            <Text style={{color:'#FFD700'}}>₹{e.amount}</Text>
            <TouchableOpacity onPress={()=>setExpenses(expenses.filter(x=>x.id!==e.id))}><Trash2 size={16} color="#f87171" style={{marginLeft:10}}/></TouchableOpacity>
          </View>
        ))}
        <View style={{height:150}}/>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.fb} onPress={()=>setModalVisible(true)}><Plus color="#0A192F"/></TouchableOpacity>
        <TouchableOpacity style={styles.fb} onPress={handleScan}><Camera color="#0A192F"/></TouchableOpacity>
      </View>
      <Modal visible={modalVisible} transparent={true}>
        <View style={styles.ov}><View style={styles.mc}>
          <TextInput placeholder="Particulars" placeholderTextColor="#8892b0" style={styles.mi} value={vendor} onChangeText={setVendor}/>
          <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.mi} value={amount} onChangeText={setAmount}/>
          <TouchableOpacity style={styles.sb} onPress={()=>{setExpenses([{id:Date.now(),vendor,amount:parseInt(amount)||0,date:new Date().toLocaleDateString()},...expenses]);setModalVisible(false)}}><Text style={{fontWeight:'bold'}}>Save</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setModalVisible(false)}><Text style={{color:'#8892b0',marginTop:15,textAlign:'center'}}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A192F' },
  loading: { flex: 1, backgroundColor: '#0A192F', justifyContent: 'center' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#112240', flexDirection: 'row', alignItems: 'center' },
  logo: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  title: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
  sub: { color: '#fff', fontSize: 9 },
  btn: { padding: 10, backgroundColor: '#1d2d50', borderRadius: 8 },
  setupCard: { margin: 20, padding: 15, backgroundColor: '#112240', borderRadius: 15 },
  sl: { color: '#8892b0', fontSize: 10, marginTop: 10 },
  in: { borderBottomWidth: 1, borderColor: '#333', color: '#fff', padding: 5, fontSize: 16 },
  sum: { margin: 20, padding: 20, borderRadius: 20, backgroundColor: '#1d2d50', borderLeftWidth: 5, borderLeftColor: '#FFD700', alignItems:'center' },
  amt: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#112240', marginHorizontal: 20, marginBottom: 10, borderRadius: 12 },
  footer: { position: 'absolute', bottom: 30, width: '100%', flexDirection: 'row', justifyContent:'center' },
  fb: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginHorizontal: 20 },
  ov: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  mc: { backgroundColor: '#112240', borderRadius: 20, padding: 25 },
  mi: { backgroundColor: '#1d2d50', color: '#fff', padding: 15, borderRadius: 10, marginTop: 10 },
  sb: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' }
});
