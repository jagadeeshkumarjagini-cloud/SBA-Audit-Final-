import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2 } from 'lucide-react-native';

const API_KEY = 'K81963065788957';

export default function App() {
  const [ready, setReady] = useState(false);
  const [expenses, setEx] = useState([]);
  const [mV, setMV] = useState(false);
  const [pMV, setPMV] = useState(false);
  const [isP, setP] = useState(false);
  const [month, setMonth] = useState(new Date().toLocaleString('default',{month:'long',year:'numeric'}));
  const [oB, setOB] = useState('16725');
  const [wR, setWR] = useState('6597');
  const [mR, setMR] = useState('22800');
  const [wP, setWP] = useState([]);
  const [mP, setMP] = useState([]);
  const [pT, setPT] = useState('Water'); 
  const [f, setF] = useState(''); const [a, setA] = useState(''); const [m, setM] = useState('');
  const [v, setV] = useState(''); const [amt, setAmt] = useState(''); const [rem, setRem] = useState('');
  const [img, setImg] = useState(null);

  useEffect(() => {
    setTimeout(() => setReady(true), 2000); // 2 second delay to prevent startup crash
  }, []);

  const tE = expenses.reduce((s, e) => s + e.amount, 0);
  const tI = (parseFloat(oB)||0) + (parseFloat(wR)||0) + (parseFloat(mR)||0);
  const twp = wP.reduce((s, p) => s + (parseFloat(p.amt)||0), 0);
  const tmp = mP.reduce((s, p) => s + (parseFloat(p.amt)||0), 0);

  const getH = () => `<html><body style="font-family:Helvetica;padding:20px;color:#333;"><div style="text-align:center;border-bottom:4px solid #FFD700;padding-bottom:10px;"><h1>SAI BRUNDAVAN APARTMENT ASSOCIATION</h1><p><b>ACCOUNTS STATEMENT - ${month.toUpperCase()}</b></p></div><table style="width:100%;border-collapse:collapse;margin-top:20px;"><thead><tr style="background:#112240;color:white;font-size:10px;"><th>S.No</th><th>Date</th><th>Particulars</th><th>Expenses</th><th>Income</th><th>Remarks</th></tr></thead><tbody style="font-size:10px;"><tr style="background:#e6f2ff;font-weight:bold;"><td>A</td><td>-</td><td>Opening Balance (Prev Month)</td><td></td><td>₹${oB}</td><td>B/F</td></tr><tr style="background:#f4f8ff;"><td>A1</td><td>-</td><td>Amt received through water tankers</td><td></td><td>₹${wR}</td><td>Creditors</td></tr><tr style="background:#f4f8ff;"><td>B</td><td>-</td><td>Maintenance total (Current Month)</td><td></td><td>₹${mR}</td><td>Collection</td></tr>${expenses.map((e,i)=>`<tr><td>${i+1}</td><td>${e.date}</td><td>${e.vendor}</td><td>₹${e.amount}</td><td></td><td>${e.remarks}</td></tr>`).join('')}<tr style="font-weight:bold;background:#eee;"><td>C</td><td>-</td><td>Total Expenses</td><td>₹${tE}</td><td></td><td></td></tr><tr style="font-weight:bold;background:#eee;"><td>D</td><td>-</td><td>Total Income (A+A1+B)</td><td></td><td>₹${tI}</td><td></td></tr><tr style="background:#FFD700;font-weight:bold;font-size:12px;"><td>E</td><td>-</td><td>CLOSING BALANCE</td><td></td><td>₹${tI-tE}</td><td>Cash in hand</td></tr></tbody></table><div style="margin-top:20px;border:1px solid #f87171;padding:10px;font-size:10px;background:#fff9f9;"><p style="color:#d9534f;font-weight:bold;">PENDING RECEIVABLES:</p><p>Water: ₹${twp} | Maint: ₹${tmp}</p></div><p style="text-align:center;font-style:italic;font-size:9px;margin-top:30px;">Updated statement as on ${new Date().toLocaleString('en-IN')}</p></body></html>`;

  const doOut = async () => { const { uri } = await Print.printToFileAsync({ html: getH() }); await Sharing.shareAsync(uri); };

  const scan = async () => {
    let res = await ImagePicker.launchCameraAsync({ quality:0.7, base64:true });
    if (res.canceled) return;
    setImg(res.assets[0].uri); setP(true);
    try {
      const fd = new FormData(); fd.append('base64Image', `data:image/jpeg;base64,${res.assets[0].base64}`); fd.append('OCREngine', '2');
      const api = await fetch('https://api.ocr.space/parse/image',{method:'POST',headers:{'apikey':API_KEY},body:fd});
      const d = await api.json(); const txt = d.ParsedResults?.[0]?.ParsedText || "";
      const ns = txt.match(/[\d,]+\.?\d*/g);
      const bA = ns ? String(Math.max(...ns.map(n=>parseFloat(n.replace(/,/g,''))).filter(n=>n>5))) : "";
      setV(txt.split('\n')[0]?.substring(0,25) || ''); setAmt(bA); setRem('Auto-captured');
    } catch(e) { console.log(e); }
    setP(false); setMV(true);
  };

  if(!ready) return <View style={{flex:1,backgroundColor:'#0A192F',justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#FFD700"/><Text style={{color:'#fff',marginTop:10}}>Starting SBA Accounts...</Text></View>;

  return (
    <SafeAreaView style={styles.co}>
      <View style={styles.he}><Image source={require('./icon.png')} style={styles.lo} /><View style={{flex:1}}><Text style={styles.ti}>SAI BRUNDAVAN</Text><Text style={styles.su}>APARTMENT ASSOCIATION</Text></View><View style={{flexDirection:'row'}}><TouchableOpacity onPress={doOut} style={styles.bt}><FileText color="#FFD700" size={20}/></TouchableOpacity><TouchableOpacity onPress={doOut} style={[styles.bt,{marginLeft:8}]}><Share2 color="#FFD700" size={20}/></TouchableOpacity></View></View>
      <ScrollView showsVerticalScrollIndicator={false}><View style={styles.ro}><Text style={styles.lb}>Month:</Text><TextInput style={styles.mI} value={mon} onChangeText={setMon}/></View><View style={styles.ca}><Text style={styles.ct}>Accounting Setup</Text><Text style={styles.sl}>Opening Bal (A)</Text><TextInput style={styles.in} keyboardType="numeric" value={oB} onChangeText={setOpening}/><Text style={styles.sl}>Water Tankers (A1)</Text><TextInput style={styles.in} keyboardType="numeric" value={wR} onChangeText={setWR}/><TouchableOpacity style={styles.ad} onPress={()=>{setPT('Water');setPMV(true)}}><UserPlus size={12} color="#FFD700"/><Text style={styles.at}>Add Pending Water</Text></TouchableOpacity><Text style={styles.sl}>Maintenance (B)</Text><TextInput style={styles.in} keyboardType="numeric" value={mR} onChangeText={setMR}/><TouchableOpacity style={styles.ad} onPress={()=>{setPT('Maintenance');setPMV(true)}}><UserPlus size={12} color="#FFD700"/><Text style={styles.at}>Add Pending Maintenance</Text></TouchableOpacity></View><View style={styles.sm}><Text style={{color:'#8892b0'}}>Closing Balance (E)</Text><Text style={styles.am}>₹{(tI - tE).toLocaleString()}</Text></View><Text style={styles.st}>Expenditure Ledger</Text>
        {expenses.map((e,i)=>(<View key={e.id} style={styles.it}><View style={{flex:1}}><Text style={{color:'#fff'}}>{i+1}. {e.vendor}</Text><Text style={{color:'#8892b0',fontSize:10}}>{e.date}</Text></View><Text style={{color:'#FFD700',fontWeight:'bold'}}>₹{e.amount}</Text><TouchableOpacity onPress={()=>setEx(expenses.filter(x=>x.id!==e.id))}><Trash2 size={16} color="#f87171" style={{marginLeft:10}}/></TouchableOpacity></View>))}
        <View style={{height:150}}/></ScrollView>
      <View style={styles.fo}><View style={styles.ac}><TouchableOpacity style={[styles.fb,{backgroundColor:'#1d2d50'}]} onPress={()=>{setImg(null);setMV(true)}}><Plus color="#FFD700"/></TouchableOpacity><Text style={styles.fl}>Add manually</Text></View><View style={styles.ac}><TouchableOpacity style={styles.fb} onPress={scan}><Camera color="#0A192F"/></TouchableOpacity><Text style={styles.fl}>Capture bills</Text></View></View>
      <Modal visible={pMV} transparent={true} animationType="fade"><View style={styles.ov}><View style={styles.mc}><Text style={{color:'#FFD700',fontWeight:'bold',marginBottom:10}}>{pT} Pending</Text><TextInput placeholder="Flat No" placeholderTextColor="#8892b0" style={styles.mi} value={f} onChangeText={setF}/><TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.mi} value={a} onChangeText={setA}/><TextInput placeholder="Month" placeholderTextColor="#8892b0" style={styles.mi} value={m} onChangeText={setM}/><TouchableOpacity style={styles.sb} onPress={()=>{const n={id:Date.now(),flat:f,amt:a,mon:m};pT==='Water'?setWP([...wP,n]):setMP([...mP,n]);setF('');setA('');setPMV(false)}}><Text style={{color:'#0A192F',fontWeight:'bold'}}>Save</Text></TouchableOpacity><TouchableOpacity onPress={()=>setPMV(false)} style={styles.gb}><Text style={{color:'#8892b0'}}>Go Back</Text></TouchableOpacity></View></View></Modal>
      <Modal visible={mV} transparent={true} animationType="slide"><View style={styles.ov}><View style={styles.mc}><View style={styles.ai}><Sparkles color="#FFD700" size={14}/><Text style={{color:'#FFD700',fontSize:10,marginLeft:5,flex:1}}>Verify bill details.</Text></View><View style={styles.mh}><Text style={{color:'#fff',fontWeight:'bold'}}>Entry</Text><TouchableOpacity onPress={()=>setMV(false)}><X color="#fff"/></TouchableOpacity></View>{img && <Image source={{uri:img}} style={{width:'100%',height:120,borderRadius:10,marginBottom:10}}/>< }<TextInput placeholder="Particulars" placeholderTextColor="#8892b0" style={styles.mi} value={v} onChangeText={setV}/><TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={styles.mi} value={amt} onChangeText={setAmt}/><TextInput placeholder="Remarks" placeholderTextColor="#8892b0" style={styles.mi} value={rem} onChangeText={setRem}/><TouchableOpacity style={styles.sb} onPress={()=>{setEx([{id:Date.now(),vendor:v,amount:parseInt(amt)||0,remarks:rem,date:new Date().toLocaleDateString('en-IN')},...ex]);setMV(false)}}><Text style={{color:'#0A192F',fontWeight:'bold'}}>Verify & Save</Text></TouchableOpacity><TouchableOpacity onPress={()=>setMV(false)} style={styles.gb}><Text style={{color:'#8892b0'}}>Go Back</Text></TouchableOpacity></View></View></Modal>
      {isP && <View style={styles.ol}><ActivityIndicator size="large" color="#FFD700"/><Text style={{color:'#fff',marginTop:10}}>AI Scanning...</Text></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  co: { flex: 1, backgroundColor: '#0A192F' },
  he: { padding: 20, paddingTop: 50, backgroundColor: '#112240', flexDirection: 'row', alignItems: 'center' },
  lo: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#FFD700' },
  ti: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  su: { color: '#fff', fontSize: 8 },
  bt: { padding: 8, backgroundColor: '#1d2d50', borderRadius: 8 },
  ro: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 10 },
  lb: { color: '#8892b0', fontSize: 12 },
  mI: { color: '#FFD700', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  ca: { margin: 20, marginTop: 10, padding: 15, backgroundColor: '#112240', borderRadius: 15 },
  ct: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 },
  sl: { color: '#8892b0', fontSize: 10, marginTop: 10 },
  in: { borderBottomWidth: 1, borderColor: '#333', color: '#fff', padding: 5, fontSize: 15 },
  ad: { flexDirection: 'row', marginTop: 8 },
  at: { color: '#FFD700', fontSize: 9, marginLeft: 5, fontWeight:'bold' },
  sm: { marginHorizontal: 20, padding: 20, borderRadius: 20, backgroundColor: '#1d2d50', borderLeftWidth: 5, borderLeftColor: '#FFD700' },
  am: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  st: { color: '#fff', fontSize: 15, fontWeight: 'bold', margin: 20 },
  it: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#112240', marginHorizontal: 20, marginBottom: 10, borderRadius: 12 },
  fo: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row' },
  ac: { flex: 1, alignItems: 'center' },
  fb: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  fl: { color: '#FFD700', fontSize: 8, marginTop: 5 },
  ov: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  mc: { backgroundColor: '#112240', borderRadius: 20, padding: 20 },
  mh: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:10 },
  mi: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 10, marginTop: 10 },
  sb: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  gb: { marginTop: 15, alignItems: 'center' },
  ai: { backgroundColor: '#1d2d50', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  ol: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(10,25,47,0.95)', justifyContent:'center', alignItems:'center', zIndex:99 }
});
