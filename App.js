import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2, Image as ImgIco } from 'lucide-react-native';

const API_KEY = 'K81963065788957';

export default function App() {
  const [ex, setEx] = useState([]);
  const [mV, setMV] = useState(false);
  const [pMV, setPMV] = useState(false);
  const [isP, setIsP] = useState(false);
  const[ready, setReady] = useState(false);
  const [mon, setMon] = useState(new Date().toLocaleString('default',{month:'long',year:'numeric'}));
  
  const [oB, setOB] = useState('16725');
  const [wR, setWR] = useState('6597');
  const [mR, setMR] = useState('22800');
  const[wP, setWP] = useState([]);
  const [mP, setMP] = useState([]);
  const [pT, setPT] = useState('Water'); 

  const [f, setF] = useState(''); const [a, setA] = useState(''); const [m, setM] = useState('');
  const [v, setV] = useState(''); const [amt, setAmt] = useState(''); const [rem, setRem] = useState('');
  const [img, setImg] = useState(null);

  useEffect(() => { setTimeout(() => setReady(true), 1000); },[]);

  const tE = ex.reduce((s, e) => s + e.amount, 0);
  const tI = (parseFloat(oB)||0) + (parseFloat(wR)||0) + (parseFloat(mR)||0);
  const closingBalance = tI - tE;
  const totWP = wP.reduce((s, p) => s + (parseFloat(p.amt)||0), 0);
  const totMP = mP.reduce((s, p) => s + (parseFloat(p.amt)||0), 0);

  const getH = () => `<html><body style="font-family:Helvetica;padding:20px;color:#333;"><div style="text-align:center;border-bottom:4px solid #FFD700;padding-bottom:10px;"><h1>SAI BRUNDAVAN APARTMENT ASSOCIATION</h1><p><b>ACCOUNTS STATEMENT - ${mon.toUpperCase()}</b></p></div><table style="width:100%;border-collapse:collapse;margin-top:20px;"><thead><tr style="background:#112240;color:white;font-size:10px;"><th>S.No</th><th>Date</th><th>Particulars</th><th>Expenses</th><th>Income</th><th>Remarks</th></tr></thead><tbody style="font-size:10px;"><tr style="background:#e6f2ff;font-weight:bold;"><td>A</td><td>-</td><td>Opening Balance (Prev Month)</td><td></td><td>₹${oB}</td><td>B/F</td></tr><tr style="background:#f4f8ff;"><td>A1</td><td>-</td><td>Amt received through water tankers</td><td></td><td>₹${wR}</td><td>Creditors</td></tr><tr style="background:#f4f8ff;"><td>B</td><td>-</td><td>Maintenance total (Current Month)</td><td></td><td>₹${mR}</td><td>Collection</td></tr>${ex.map((e,i)=>`<tr><td>${i+1}</td><td>${e.date}</td><td>${e.vendor}</td><td>₹${e.amount}</td><td></td><td>${e.remarks}</td></tr>`).join('')}<tr style="font-weight:bold;background:#eee;"><td>C</td><td>-</td><td>Total Expenses</td><td>₹${tE}</td><td></td><td></td></tr><tr style="font-weight:bold;background:#eee;"><td>D</td><td>-</td><td>Total Income (A+A1+B)</td><td></td><td>₹${tI}</td><td></td></tr><tr style="background:#FFD700;font-weight:bold;font-size:12px;"><td>E</td><td>-</td><td>CLOSING BALANCE</td><td></td><td>₹${closingBalance}</td><td>Cash in hand</td></tr></tbody></table><div style="margin-top:20px;border:1px solid #f87171;padding:10px;font-size:10px;background:#fff9f9;"><p style="color:#d9534f;font-weight:bold;">PENDING RECEIVABLES:</p><p>Water: ₹${totWP} (F: ${wP.map(p=>p.flat).join(',')}) | Maint: ₹${totMP} (F: ${mP.map(p=>p.flat).join(',')})</p></div><p style="text-align:center;font-style:italic;font-size:9px;margin-top:30px;">Updated statement as on ${new Date().toLocaleString('en-IN')}</p></body></html>`;

  const doOut = async () => { const { uri } = await Print.printToFileAsync({ html: getH() }); await Sharing.shareAsync(uri); };

  const scan = async (type) => {
    // 📸 Native Cropping is ON. Quality reduced to ensure file fits API limits.
    let res = await (type === 'cam' ? ImagePicker.launchCameraAsync({ quality:0.4, allowsEditing:true }) : ImagePicker.launchImageLibraryAsync({ quality:0.4, allowsEditing:true }));
    if (res.canceled) return;
    
    setImg(res.assets[0].uri); setIsP(true); setV(''); setAmt(''); setRem('');
    
    try {
      const fd = new FormData(); 
      // 🚀 UPLOADING AS A NATIVE FILE OBJECT (Fixes the OCR limit rejection bug)
      fd.append('file', { uri: res.assets[0].uri, name: 'bill.jpg', type: 'image/jpeg' });
      fd.append('OCREngine', '2');
      fd.append('scale', 'true');
      
      const api = await fetch('https://api.ocr.space/parse/image',{method:'POST',headers:{'apikey':API_KEY},body:fd});
      const d = await api.json(); 
      
      if (d.IsErroredOnProcessing) {
        setRem('OCR Limit Reached - Manual Edit');
      } else {
        const txt = d.ParsedResults?.[0]?.ParsedText || "";
        
        // Find largest decimal number (Targets totals like 3699.00)
        const ns = txt.match(/\d+\.\d{2}/g);
        const bA = ns ? String(Math.max(...ns.map(n=>parseFloat(n.replace(/,/g,''))).filter(n=>n>5))) : "";
        
        // Find Vendor Name (Skip common header words)
        const lines = txt.split('\n').map(l=>l.trim()).filter(l=>l.length>3);
        const vLine = lines.find(l => /[a-zA-Z]{4,}/.test(l) && !/invoice|bill|receipt|date|time|tax|gst/i.test(l));
        
        setV(vLine ? vLine.substring(0,25) : 'New Bill'); 
        setAmt(bA.split('.')[0] || ''); 
        setRem('Auto-captured');
      }
    } catch(e) { 
      setRem('Network Error'); 
    }
    
    setIsP(false); setMV(true);
  };

  if(!ready) return <View style={s.lC}><ActivityIndicator size="large" color="#FFD700"/><Text style={s.lT}>SBA Accounts Loading...</Text></View>;

  return (
    <SafeAreaView style={s.co}>
      <View style={s.he}>
        <Image source={require('./icon.png')} style={s.lo} />
        <View style={{flex:1}}><Text style={s.ti}>SAI BRUNDAVAN</Text><Text style={s.su}>APARTMENT ASSOCIATION</Text></View>
        <View style={{flexDirection:'row'}}>
          <TouchableOpacity onPress={doOut} style={s.bt}><FileText color="#FFD700" size={20}/></TouchableOpacity>
          <TouchableOpacity onPress={doOut} style={[s.bt,{marginLeft:8}]}><Share2 color="#FFD700" size={20}/></TouchableOpacity>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.ro}><Text style={s.lb}>Month:</Text><TextInput style={s.mI} value={mon} onChangeText={setMon}/></View>
        <View style={s.ca}>
          <Text style={s.ct}>Accounting Setup</Text>
          <Text style={s.sl}>Opening Bal (A)</Text><TextInput style={s.in} keyboardType="numeric" value={oB} onChangeText={setOB}/>
          <Text style={s.sl}>Water tankers (A1)</Text><TextInput style={s.in} keyboardType="numeric" value={wR} onChangeText={setWR}/>
          <TouchableOpacity style={s.ad} onPress={()=>{setPT('Water');setPMV(true)}}><UserPlus size={12} color="#FFD700"/><Text style={s.at}>Add Pending Water</Text></TouchableOpacity>
          <Text style={s.sl}>Maintenance (B)</Text><TextInput style={s.in} keyboardType="numeric" value={mR} onChangeText={setMR}/>
          <TouchableOpacity style={s.ad} onPress={()=>{setPT('Maintenance');setPMV(true)}}><UserPlus size={12} color="#FFD700"/><Text style={s.at}>Add Pending Maint</Text></TouchableOpacity>
        </View>
        <View style={s.sm}><Text style={{color:'#8892b0'}}>Closing Balance (E)</Text><Text style={s.am}>₹{closingBalance.toLocaleString()}</Text></View>
        <Text style={s.st}>Expenditure Ledger</Text>
        {ex.map((e,i)=>(
          <View key={e.id} style={s.it}>
            <View style={{flex:1}}><Text style={{color:'#fff'}}>{i+1}. {e.vendor}</Text><Text style={{color:'#8892b0',fontSize:10}}>{e.date}</Text></View>
            <Text style={{color:'#FFD700',fontWeight:'bold'}}>₹{e.amount}</Text>
            <TouchableOpacity onPress={()=>setEx(ex.filter(x=>x.id!==e.id))}><Trash2 size={16} color="#f87171" style={{marginLeft:10}}/></TouchableOpacity>
          </View>
        ))}
        <View style={{height:150}}/>
      </ScrollView>
      <View style={s.fo}>
        <View style={s.ac}><TouchableOpacity style={[s.fb,{backgroundColor:'#1d2d50'}]} onPress={()=>{setImg(null);setV('');setAmt('');setRem('');setMV(true)}}><Plus color="#FFD700"/></TouchableOpacity><Text style={s.fl}>Add manual</Text></View>
        <View style={s.ac}><TouchableOpacity style={s.fb} onPress={()=>scan('lib')}><ImgIco color="#0A192F" size={24}/></TouchableOpacity><Text style={s.fl}>Gallery</Text></View>
        <View style={s.ac}><TouchableOpacity style={s.fb} onPress={()=>scan('cam')}><Camera color="#0A192F" size={28}/></TouchableOpacity><Text style={s.fl}>Scan bill</Text></View>
      </View>

      <Modal visible={pMV} transparent={true} animationType="fade">
        <View style={s.ov}><View style={s.mc}>
          <View style={s.mh}><Text style={{color:'#FFD700',fontWeight:'bold'}}>{pT} Pending</Text><TouchableOpacity onPress={()=>setPMV(false)}><X color="#fff"/></TouchableOpacity></View>
          <TextInput placeholder="Flat No" placeholderTextColor="#8892b0" style={s.mi} value={f} onChangeText={setF}/>
          <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={s.mi} value={a} onChangeText={setA}/>
          <TextInput placeholder="Month" placeholderTextColor="#8892b0" style={s.mi} value={m} onChangeText={setM}/>
          <TouchableOpacity style={s.sb} onPress={()=>{const n={id:Date.now(),flat:f,amt:a,mon:m};pT==='Water'?setWP([...wP,n]):setMP([...mP,n]);setF('');setA('');setPMV(false)}}><Text style={{color:'#0A192F',fontWeight:'bold'}}>Save</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setPMV(false)} style={s.gb}><Text style={{color:'#8892b0'}}>Go Back</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={mV} transparent={true} animationType="slide">
        <View style={s.ov}>
          <ScrollView contentContainerStyle={s.mc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.ai}><Sparkles color="#FFD700" size={14}/><Text style={{color:'#FFD700',fontSize:10,marginLeft:5,flex:1}}>Verify auto-captured details correctly.</Text></View>
            <View style={s.mh}><Text style={{color:'#fff',fontWeight:'bold'}}>Voucher Entry</Text><TouchableOpacity onPress={()=>setMV(false)}><X color="#fff"/></TouchableOpacity></View>
            
            {img && <Image source={{uri:img}} style={{width:'100%',height:350,borderRadius:10,marginBottom:15,backgroundColor:'#0a192f'}} resizeMode="contain"/>}
            
            <TextInput placeholder="Particulars" placeholderTextColor="#8892b0" style={s.mi} value={v} onChangeText={setV}/>
            <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={s.mi} value={amt} onChangeText={setAmt}/>
            <TextInput placeholder="Remarks" placeholderTextColor="#8892b0" style={s.mi} value={rem} onChangeText={setRem}/>
            <TouchableOpacity style={s.sb} onPress={()=>{setEx([{id:Date.now(),vendor:v,amount:parseInt(amt)||0,remarks:rem,date:new Date().toLocaleDateString('en-IN')},...ex]);setMV(false)}}><Text style={{color:'#0A192F',fontWeight:'bold'}}>Verify & Save</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setMV(false)} style={s.gb}><Text style={{color:'#8892b0'}}>Go Back</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {isP && <View style={s.ol}><ActivityIndicator size="large" color="#FFD700"/><Text style={{color:'#fff',marginTop:10}}>AI Scanning...</Text></View>}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  co: { flex: 1, backgroundColor: '#0A192F' },
  lC: { flex: 1, backgroundColor: '#0A192F', justifyContent: 'center', alignItems: 'center' },
  lT: { color: '#fff', marginTop: 10 },
  he: { padding: 20, paddingTop: Platform.OS === 'ios' ? 10 : 50, backgroundColor: '#112240', flexDirection: 'row', alignItems: 'center' },
  lo: { width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1, borderColor: '#FFD700' },
  ti: { color: '#FFD700', fontSize: 15, fontWeight: 'bold' },
  su: { color: '#fff', fontSize: 9 },
  bt: { padding: 8, backgroundColor: '#1d2d50', borderRadius: 10 },
  ro: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 5 },
  lb: { color: '#8892b0', fontSize: 13 },
  mI: { color: '#FFD700', fontWeight: 'bold', marginLeft: 8, fontSize: 14, flex: 1 },
  ca: { margin: 20, marginTop: 10, padding: 20, backgroundColor: '#112240', borderRadius: 15 },
  ct: { color: '#FFD700', fontWeight: 'bold', fontSize: 14, marginBottom: 15 },
  sl: { color: '#8892b0', fontSize: 11, marginTop: 10, marginBottom: 5 },
  in: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  ad: { flexDirection: 'row', marginTop: 10, backgroundColor: '#0A192F', padding: 6, borderRadius: 6, alignSelf: 'flex-start', alignItems: 'center' },
  at: { color: '#FFD700', fontSize: 10, marginLeft: 6, fontWeight:'bold' },
  sum: { marginHorizontal: 20, padding: 25, borderRadius: 20, backgroundColor: '#1d2d50', borderLeftWidth: 5, borderLeftColor: '#FFD700', alignItems:'center' },
  am: { color: '#fff', fontSize: 38, fontWeight: 'bold', marginTop: 5 },
  st: { color: '#fff', fontSize: 16, fontWeight: 'bold', margin: 20 },
  it: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#112240', marginHorizontal: 20, marginBottom: 12, borderRadius: 12 },
  fo: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent: 'center' },
  ac: { alignItems:'center', marginHorizontal: 15 },
  fb: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fl: { color: '#FFD700', fontSize: 9, marginTop: 8, fontWeight: 'bold' },
  ov: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  mc: { backgroundColor: '#112240', borderRadius: 20, padding: 25 },
  mh: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15 },
  mi: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 10, marginBottom: 12 },
  sb: { backgroundColor: '#FFD700', padding: 16, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  gb: { marginTop: 15, alignItems: 'center', paddingBottom: 10 },
  ai: { backgroundColor: '#1d2d50', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  ol: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(10,25,47,0.95)', justifyContent:'center', alignItems:'center', zIndex:99 }
});
