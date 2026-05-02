if (pickerResult.canceled) return;

const originalUri = pickerResult.assets[0].uri;

// Show image immediately in display quality
resetVoucher();
setImg(originalUri);
setP(true);

try {
  // ✅ STEP 1: Compress image to ~100KB using expo-image-manipulator
  // Resize to 900px wide + JPEG 0.4 quality = reliably under 150KB
  setOcrMsg('Compressing image...');
  const base64Compressed = await compressForOCR(originalUri);

  // ✅ STEP 2: Send compressed base64 to OCR.space
  setOcrMsg('Reading bill text...');
  const fd = new FormData();
  fd.append('base64Image', `data:image/jpeg;base64,${base64Compressed}`);
  fd.append('language', 'eng');
  fd.append('isOverlayRequired', 'false');
  fd.append('detectOrientation', 'true');
  fd.append('scale', 'true');
  fd.append('OCREngine', '2'); // Engine 2: better for printed receipts

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'apikey': OCR_KEY },
    body: fd,
  });

  if (!response.ok) throw new Error(`Server error: ${response.status}`);

  const data = await response.json();

  if (data.IsErroredOnProcessing) {
    const errMsg = Array.isArray(data.ErrorMessage)
      ? data.ErrorMessage.join(', ')
      : (data.ErrorMessage || 'OCR failed');
    throw new Error(errMsg);
  }

  const rawText = data.ParsedResults?.[0]?.ParsedText || '';
  if (!rawText.trim()) throw new Error('No text detected in image');

  // ✅ STEP 3: Parse extracted text into fields
  const parsed = parseBill(rawText);
  setV(parsed.vendor);
  setAmt(parsed.amount);
  setRem(parsed.particulars);
  setEDate(parsed.billDate);
  setOcrMsg('✅ Captured — please verify and correct if needed.');

} catch (err) {
  console.log('OCR Error:', err.message);
  setOcrMsg(`⚠️ ${err.message}. Please enter manually.`);
} finally {
  setP(false);
  setMV(true);
}
