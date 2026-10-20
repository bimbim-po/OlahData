const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'app', 'proyek', '[id]', 'hasil', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

const target = `    {
      key: 'significant',
      header: 'Signifikansi',
      align: 'center',
      render: (r) => (
        <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[13px] min-h-[24px]">
          {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
        </Badge>
      ),
      getValue: (r) => (r.significant ? 'Signifikan' : 'Tidak'),
    },`;

const replacement = `    {
      key: 'significant',
      header: 'Signifikansi',
      align: 'center',
      render: (r) => {
        const isConst = r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant');
        if (isConst) {
          return <span className="text-muted-foreground font-mono">-</span>;
        }
        return (
          <Badge variant={r.significant ? 'pine' : 'secondary'} className="text-[13px] min-h-[24px]">
            {r.significant ? 'Signifikan' : 'Tidak Signifikan'}
          </Badge>
        );
      },
      getValue: (r) => {
        const isConst = r.variable.toLowerCase().includes('konstanta') || r.variable.toLowerCase().includes('constant');
        return isConst ? '-' : (r.significant ? 'Signifikan' : 'Tidak');
      },
    },`;

if (norm.includes(target)) {
  norm = norm.replace(target, replacement);
  fs.writeFileSync(filePath, isCRLF ? norm.replace(/\n/g, '\r\n') : norm, 'utf8');
  console.log('SUCCESS: Konstanta row now renders "-" for hypothesis significance');
} else {
  console.log('Target block not found');
}
