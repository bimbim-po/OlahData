import {
  parseSpreadsheetFile,
  extractGoogleSheetsCsvUrl,
  parseGenericTabularXml,
} from '../dataset-parser';

async function runTests() {
  console.log('====================================================================');
  console.log(' TEST SUITE: CSV, GOOGLE SHEETS, & XML DATASET PARSING');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Test CSV Parsing with Semicolon Delimiter & Likert text
  console.log('--- 1. Testing CSV Parsing ---');
  const csvData = [
    'No;Jenis_Kelamin;X1_1;X1_2;X1_3;Y1_1;Y1_2;Saran',
    '1;Laki-laki;4;5;4;5;5;Layanan kasir sangat cepat dan ramah',
    '2;Perempuan;3;4;3;4;4;Perlu ditingkatkan kebersihan ruangan',
    '3;Laki-laki;5;5;5;5;5;Semua fasilitas sudah sangat memuaskan',
    '4;Perempuan;4;4;4;4;4;Diskon member diperbanyak',
    '5;Laki-laki;2;3;2;3;3;Waktu tunggu masih agak lama',
  ].join('\r\n');

  const csvBuffer = new TextEncoder().encode(csvData).buffer;
  const csvFile = {
    name: 'kuesioner_responden.csv',
    size: csvBuffer.byteLength,
    arrayBuffer: async () => csvBuffer,
  };

  const parsedCsv = await parseSpreadsheetFile(csvFile as any);
  assert(parsedCsv.rows.length === 5, `CSV berhasil diurai: 5 baris data (ditemukan: ${parsedCsv.rows.length})`);
  assert(parsedCsv.delimiter === ';', `Delimiter titik koma (;) terdeteksi otomatis (ditemukan: ${parsedCsv.delimiter})`);
  assert(parsedCsv.columns.includes('X1_1') && parsedCsv.columns.includes('Y1_1'), 'Kolom butir instrumen X1_1 & Y1_1 ada di kolom');

  const saranCol = parsedCsv.columnMeta.find((c) => c.name === 'Saran');
  assert(saranCol?.role === 'open_question', `Kolom saran kalimat terdeteksi sebagai 'open_question' (ditemukan: ${saranCol?.role})`);

  // 2. Test Google Sheets URL Extraction
  console.log('\n--- 2. Testing Google Sheets URL Extraction ---');
  const gsheetShareUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
  const csvExport1 = extractGoogleSheetsCsvUrl(gsheetShareUrl);
  assert(
    csvExport1 === 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv',
    `Link berbagi Google Sheets diekstrak ke URL ekspor CSV resmi: ${csvExport1}`
  );

  const gsheetWithGid = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=987654321';
  const csvExport2 = extractGoogleSheetsCsvUrl(gsheetWithGid);
  assert(
    csvExport2 === 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=987654321',
    `Link dengan gid lembar kerja tertentu tetap terjaga: ${csvExport2}`
  );

  const gsheetPubUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxExamplE_Id-1234/pubhtml';
  const csvExport3 = extractGoogleSheetsCsvUrl(gsheetPubUrl);
  assert(
    csvExport3 === 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxExamplE_Id-1234/pub?output=csv',
    `Link Publish to Web Google Sheets diekstrak ke endpoint pub CSV: ${csvExport3}`
  );

  // 3. Test XML Parsing: Excel XML Spreadsheet 2003
  console.log('\n--- 3. Testing XML Parsing: Excel XML Spreadsheet 2003 ---');
  const xmlSpreadsheet2003 = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="DataKuesioner">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">No</Data></Cell>
    <Cell><Data ss:Type="String">Gender</Data></Cell>
    <Cell><Data ss:Type="String">X1_1</Data></Cell>
    <Cell><Data ss:Type="String">X1_2</Data></Cell>
    <Cell><Data ss:Type="String">Y1</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="Number">1</Data></Cell>
    <Cell><Data ss:Type="String">Pria</Data></Cell>
    <Cell><Data ss:Type="Number">4</Data></Cell>
    <Cell><Data ss:Type="Number">5</Data></Cell>
    <Cell><Data ss:Type="Number">5</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="Number">2</Data></Cell>
    <Cell><Data ss:Type="String">Wanita</Data></Cell>
    <Cell><Data ss:Type="Number">3</Data></Cell>
    <Cell><Data ss:Type="Number">4</Data></Cell>
    <Cell><Data ss:Type="Number">4</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

  const xmlBuffer1 = new TextEncoder().encode(xmlSpreadsheet2003).buffer;
  const xmlFile1 = {
    name: 'survey_excel_2003.xml',
    size: xmlBuffer1.byteLength,
    arrayBuffer: async () => xmlBuffer1,
  };

  const parsedXml1 = await parseSpreadsheetFile(xmlFile1 as any);
  assert(parsedXml1.rows.length === 2, `Excel XML 2003 berhasil diurai: 2 baris (ditemukan: ${parsedXml1.rows.length})`);
  assert(parsedXml1.columns.includes('X1_1') && parsedXml1.columns.includes('Y1'), 'Kolom X1_1 dan Y1 terdeteksi di Excel XML');

  // 4. Test XML Parsing: Generic Tabular XML
  console.log('\n--- 4. Testing XML Parsing: Generic Tabular XML ---');
  const genericXml = `<?xml version="1.0" encoding="UTF-8"?>
<kuesioner>
  <responden>
    <No>1</No>
    <Jenis_Kelamin>Laki-laki</Jenis_Kelamin>
    <X1_1>4</X1_1>
    <X1_2>5</X1_2>
    <Y1>5</Y1>
    <Komentar>Pelayanan sangat memuaskan</Komentar>
  </responden>
  <responden>
    <No>2</No>
    <Jenis_Kelamin>Perempuan</Jenis_Kelamin>
    <X1_1>3</X1_1>
    <X1_2>4</X1_2>
    <Y1>4</Y1>
    <Komentar>Harga produk cukup terjangkau</Komentar>
  </responden>
  <responden>
    <No>3</No>
    <Jenis_Kelamin>Laki-laki</Jenis_Kelamin>
    <X1_1>5</X1_1>
    <X1_2>5</X1_2>
    <Y1>5</Y1>
    <Komentar>Sangat merekomendasikan tempat ini</Komentar>
  </responden>
</kuesioner>`;

  const xmlBuffer2 = new TextEncoder().encode(genericXml).buffer;
  const xmlFile2 = {
    name: 'angket_penelitian.xml',
    size: xmlBuffer2.byteLength,
    arrayBuffer: async () => xmlBuffer2,
  };

  const parsedXml2 = await parseSpreadsheetFile(xmlFile2 as any);
  assert(parsedXml2.rows.length === 3, `Generic Tabular XML berhasil diurai: 3 baris (ditemukan: ${parsedXml2.rows.length})`);
  assert(parsedXml2.columns.includes('Komentar'), 'Kolom Komentar ada di kolom hasil XML');
  const komentarCol = parsedXml2.columnMeta.find((c) => c.name === 'Komentar');
  assert(komentarCol?.role === 'open_question', `Kolom komentar naratif ber-role 'open_question' (ditemukan: ${komentarCol?.role})`);

  console.log('\n====================================================================');
  console.log(` HASIL: ${passed} dari ${total} pengujian lulus!`);
  console.log('====================================================================\n');
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
