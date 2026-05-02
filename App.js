import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, SafeAreaView, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Camera, FileText, Trash2, Plus, Sparkles, UserPlus, X, Share2 } from 'lucide-react-native';

const API_KEY = 'K81963065788957';

export default function App() {
  const [ex, setEx] = useState([]);
  const [mV, setMV] = useState(false);
  const [pMV, setPMV] = useState(false);
  const [isP, setIsP] = useState(false);
  const [ready, setReady] = useState(false);
  const [mon, setMon] = useState(new Date().toLocaleString('default',{month:'long',year:'numeric'}));
  
  const [oB, setOB] = useState('16725');
  const [wR, setWR] = useState('6597');
  const [mR, setMR] = useState('22800');
  const [wP, setWP] = useState([]);
  const [mP, setMP] = useState([]);
  
  const [pT, setPT] = useState('Water'); 
  const [vend, setVend] = useState(''); const [amt, setAmt] = useState(''); const [rem, setRem] = useState('');
  const [img, setImg] = useState(null);

  useEffect(() => { setTimeout(() => setReady(true), 2000); }, []);

  const tE = ex.reduce((s, e) => s + e.amount, 0);
  const tI = (parseFloat(oB)||0) + (parseFloat(wR)||0) + (parseFloat(mR)||0);
  const closingBal = tI - tE;

  const exportAndShare = async () => {
    Alert.alert("Generating PDF", "Attaching bill copies... please wait.");
    
    // 📸 Convert all bill images to Base64 for PDF
    const billImagesHtml = await Promise.all(ex.map(async (item, index) => {
      if (!item.imageUri) return '';
      const base64 = await FileSystem.readAsStringAsync(item.imageUri, { encoding: 'base64' });
      return `
        <div style="page-break-before: always; text-align: center; padding: 20px; border: 1px solid #ddd;">
          <h3>Voucher Reference #${index + 1}</h3>
          <p><b>Particulars:</b> ${item.vendor} | <b>Amount:</b> ₹${item.amount}</p>
          <img src="data:image/jpeg;base64,${base64}" style="width: 100%; max-height: 700px; object-fit: contain;" />
        </div>`;
    }));

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 5px solid #FFD700; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #112240; color: white; padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 10px; }
            td { padding: 10px; border: 1px solid #ddd; font-size: 10px; }
            .opening-row { background-color: #e6f2ff; font-weight: bold; }
            .income-row { background-color: #f4f8ff; font-weight: bold; }
            .closing-row { background-color: #FFD700; color: #000; font-weight: bold; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SAI BRUNDAVAN APARTMENT ASSOCIATION</h1>
            <p><b>ACCOUNTS STATEMENT - ${mon.toUpperCase()}</b></p>
          </div>
          <table>
            <thead><tr><th>S.No</th><th>Date</th><th>Particulars</th><th>Expenses</th><th>Income</th><th>Remarks</th></tr></thead>
            <tbody>
              <tr class="opening-row"><td>A</td><td>-</td><td>Opening Balance (Prev Month)</td><td></td><td>₹${oB}</td><td>B/F</td></tr>
              <tr class="income-row"><td>B</td><td>-</td><td>Excess water usage Amt</td><td></td><td>₹${wR}</td><td>Creditors</td></tr>
              <tr class="income-row"><td>C</td><td>-</td><td>Maintenance Amt received</td><td></td><td>₹${mR}</td><td>Collection</td></tr>
              ${ex.map((e, i) => `<tr><td>${i+1}</td><td>${e.date}</td><td>${e.vendor}</td><td>₹${e.amount}</td><td></td><td>${e.remarks}</td></tr>`).join('')}
              <tr style="font-weight:bold; background:#eee;"><td>D</td><td>-</td><td>TOTAL RECEIPTS (A+B+C)</td><td></td><td>₹${tI}</td><td></td></tr>
              <tr style="font-weight:bold; background:#eee;"><td>E</td><td>-</td><td>TOTAL EXPENDITURE</td><td>₹${tE}</td><td></td><td></td></tr>
              <tr class="closing-row"><td>F</td><td>-</td><td>CLOSING BALANCE</td><td></td><td>₹${closingBal}</td><td>Cash in hand</td></tr>
            </tbody>
          </table>
          <div style="margin-top:20px; border: 1px solid #f87171; padding:10px; font-size:10px; background:#fff9f9;">
            <p style="color:#d9534f; font-weight:bold;">PENDING RECEIVABLES:</p>
            <p>Water: ₹${wP.reduce((s,p)=>s+(parseFloat(p.amt)||0),0)} | Maint: ₹${mP.reduce((s,p)=>s+(parseFloat(p.amt)||0),0)}</p>
          </div>
          <p style="text-align:center; font-style:italic; font-size:9px; margin-top:20px;">Updated statement as on ${new Date().toLocaleString('en-IN')}</p>
          ${billImagesHtml.join('')}
        </body>
      </html>`;
      
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const scan = async () => {
    let res = await ImagePicker.launchCameraAsync({ quality:0.5, base64:true, allowsEditing: true });
    if (res.canceled) return;
    setImg(res.assets[0].uri); setProc(true); setVend(''); setAmt('');
    try {
      const fd = new FormData();
      fd.append('base64Image', `data:image/jpeg;base64,${res.assets[0].base64}`);
      const api = await fetch('https://api.ocr.space/parse/image',{method:'POST',headers:{'apikey':API_KEY},body:fd});
      const d = await api.json();
      const txt = d.ParsedResults?.[0]?.ParsedText || "";
      const ns = txt.match(/\d+\.\d{2}/g);
      const val = ns ? String(Math.max(...ns.map(n=>parseFloat(n)))) : "";
      setVend(txt.split('\n')[0]?.substring(0,25) || 'Bill'); setAmt(val);
    } catch(e) { console.log(e); }
    setProc(false); setMV(true);
  };

  if(!ready) return <View style={s.lC}><ActivityIndicator size="large" color="#FFD700"/><Text style={s.lT}>SBA Accounts Starting...</Text></View>;

  return (
    <SafeAreaView style={s.co}>
      <View style={s.he}>
        <Image source={require('./icon.png')} style={s.lo} />
        <View style={{flex:1}}><Text style={s.ti}>SAI BRUNDAVAN</Text><Text style={s.su}>APARTMENT ASSOCIATION</Text></View>
        <TouchableOpacity onPress={exportAndShare} style={s.bt}><Share2 color="#FFD700" size={20}/></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.ro}><Text style={s.lb}>Month:</Text><TextInput style={s.mI} value={mon} onChangeText={setMon}/></View>
        <View style={s.ca}>
          <Text style={s.ct}>Setup</Text>
          <Text style={s.sl}>Opening Bal (A)</Text><TextInput style={s.in} keyboardType="numeric" value={oB} onChangeText={setOB}/>
          <Text style={s.sl}>Water tankers Amt (B)</Text><TextInput style={s.in} keyboardType="numeric" value={wR} onChangeText={setWR}/>
          <Text style={s.sl}>Maintenance Amt (C)</Text><TextInput style={s.in} keyboardType="numeric" value={mR} onChangeText={setMR}/>
        </View>
        <View style={s.sm}><Text style={s.am}>₹{closingBal.toLocaleString()}</Text></View>
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
        <TouchableOpacity style={s.fb} onPress={()=>{setImg(null);setMV(true)}}><Plus color="#0A192F"/></TouchableOpacity>
        <TouchableOpacity style={s.fb} onPress={scan}><Camera color="#0A192F"/></TouchableOpacity>
      </View>
      <Modal visible={mV} transparent={true} animationType="slide"><View style={s.ov}><View style={s.mc}>
        <View style={s.ai}><Sparkles color="#FFD700" size={14}/><Text style={{color:'#FFD700',fontSize:10,marginLeft:5,flex:1}}>Verify bill details.</Text></View>
        {img && <ScrollView style={{maxHeight:250}}><Image source={{uri:img}} style={{width:'100%',height:350,borderRadius:10}} resizeMode="contain"/></ScrollView>}
        <TextInput placeholder="Particulars" placeholderTextColor="#8892b0" style={s.mi} value={vend} onChangeText={setVend}/>
        <TextInput placeholder="Amount" placeholderTextColor="#8892b0" keyboardType="numeric" style={s.mi} value={amt} onChangeText={setAmt}/>
        <TouchableOpacity style={s.sb} onPress={()=>{setEx([{id:Date.now(),vendor:vend,amount:parseInt(amt)||0,remarks:rem,date:new Date().toLocaleDateString('en-IN'), imageUri: img},...ex]);setMV(false)}}><Text style={{color:'#0A192F',fontWeight:'bold'}}>Verify & Save</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setMV(false)} style={s.gb}><Text style={{color:'#8892b0'}}>Go Back</Text></TouchableOpacity>
      </View></View></Modal>
      {isP && <View style={s.ol}><ActivityIndicator size="large" color="#FFD700"/><Text style={{color:'#fff',marginTop:10}}>AI Scanning...</Text></View>}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  co: { flex: 1, backgroundColor: '#0A192F' },
  lC: { flex: 1, backgroundColor: '#0A192F', justifyContent: 'center', alignItems: 'center' },
  lT: { color: '#fff', marginTop: 10 },
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
  sm: { marginHorizontal: 20, padding: 20, borderRadius: 20, backgroundColor: '#1d2d50', borderLeftWidth: 5, borderLeftColor: '#FFD700', alignItems:'center' },
  am: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  st: { color: '#fff', fontSize: 15, fontWeight: 'bold', margin: 20 },
  it: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#112240', marginHorizontal: 20, marginBottom: 10, borderRadius: 12 },
  fo: { position: 'absolute', bottom: 20, width: '100%', flexDirection: 'row', justifyContent:'center' },
  fb: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginHorizontal: 20 },
  ov: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 15 },
  mc: { backgroundColor: '#112240', borderRadius: 20, padding: 20 },
  mi: { backgroundColor: '#1d2d50', color: '#fff', padding: 12, borderRadius: 10, marginTop: 10 },
  sb: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  gb: { marginTop: 15, alignItems: 'center' },
  ai: { backgroundColor: '#1d2d50', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  ol: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(10,25,47,0.95)', justifyContent:'center', alignItems:'center', zIndex:99 }
});
