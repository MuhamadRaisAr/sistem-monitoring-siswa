const fs = require('fs');

let idCounter = 2;
function getId() { return idCounter++; }

const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile>
  <diagram id="diagram1" name="Use Case">
    <mxGraphModel dx="1000" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1000" pageHeight="1000" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="box" value="Sistem Monitoring Siswa" style="shape=rect;html=1;verticalAlign=top;align=center;fillColor=none;strokeColor=#000000;" vertex="1" parent="1">
          <mxGeometry x="250" y="20" width="500" height="850" as="geometry" />
        </mxCell>`;

const xmlFooter = `
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

let xmlBody = '';

const nodes = {};

function addActor(name, x, y) {
    const id = getId();
    nodes[name] = id;
    xmlBody += `
        <mxCell id="${id}" value="${name}" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=none;strokeColor=#000000;" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="30" height="60" as="geometry" />
        </mxCell>`;
}

function addUseCase(name, x, y, label) {
    const id = getId();
    nodes[name] = id;
    const cleanLabel = label.replace(/\n/g, '&#xa;');
    xmlBody += `
        <mxCell id="${id}" value="${cleanLabel}" style="ellipse;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="140" height="60" as="geometry" />
        </mxCell>`;
}

function addSolidEdge(source, target) {
    const id = getId();
    xmlBody += `
        <mxCell id="${id}" style="endArrow=none;html=1;rounded=0;strokeColor=#000000;" edge="1" parent="1" source="${nodes[source]}" target="${nodes[target]}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
}

function addDashedEdge(source, target, labelText) {
    const edgeId = getId();
    xmlBody += `
        <mxCell id="${edgeId}" style="endArrow=open;html=1;rounded=0;dashed=1;endFill=0;strokeColor=#000000;" edge="1" parent="1" source="${nodes[source]}" target="${nodes[target]}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
    const labelId = getId();
    xmlBody += `
        <mxCell id="${labelId}" value="&amp;lt;&amp;lt;${labelText}&amp;gt;&amp;gt;" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];backgroundColor=#ffffff;" vertex="1" connectable="0" parent="${edgeId}">
          <mxGeometry x="0" y="0" relative="1" as="geometry">
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>`;
}

addActor('Admin', 100, 200);
addActor('Guru / Wali Kelas', 100, 500);
addActor('Guru BK', 850, 150);
addActor('Bendahara', 850, 450);
addActor('Wali Siswa', 850, 700);

addUseCase('UC_DataMaster', 280, 50, 'Kelola Data Master\n(User, Guru, Siswa,\nKelas, Mapel)');
addUseCase('UC_Jadwal', 280, 130, 'Kelola Jadwal\nPelajaran');
addUseCase('UC_TahunAjaran', 280, 210, 'Kelola Tahun\nAjaran');
addUseCase('UC_Mutasi', 280, 290, 'Kelola Mutasi dan\nPengumuman');

addUseCase('UC_Absensi', 280, 440, 'Kelola Input\nAbsensi');
addUseCase('UC_Nilai', 280, 520, 'Kelola Input Nilai');
addUseCase('UC_RekapAbsensi', 280, 600, 'Kelola Rekap\nAbsensi dan Nilai');
addUseCase('UC_Raport', 280, 710, 'Cetak Raport');

addUseCase('UC_Pelanggaran', 580, 50, 'Kelola catatan\npelanggaran');
addUseCase('UC_BK', 580, 150, 'Kelola Bimbingan\nKonseling');
addUseCase('UC_RekapPelanggaran', 580, 250, 'Kelola Rekap\nPelanggaran');

addUseCase('UC_Tagihan', 580, 360, 'Kelola Tagihan\nAktif');
addUseCase('UC_Validasi', 580, 460, 'Kelola Validasi\nPembayaran');
addUseCase('UC_Riwayat', 580, 560, 'Kelola Riwayat\nPembayaran');
addUseCase('UC_Tunggakan', 580, 660, 'Kelola Data\nTunggakan');

addUseCase('UC_Memantau', 580, 780, 'Memantau\nperkembangan\nanaknya');

addUseCase('Login', 430, 350, 'Login');
addUseCase('Logout', 430, 470, 'Logout');

addSolidEdge('Admin', 'UC_DataMaster');
addSolidEdge('Admin', 'UC_Jadwal');
addSolidEdge('Admin', 'UC_TahunAjaran');
addSolidEdge('Admin', 'UC_Mutasi');
addSolidEdge('Admin', 'Login');
addSolidEdge('Admin', 'Logout');

addSolidEdge('Guru / Wali Kelas', 'UC_Absensi');
addSolidEdge('Guru / Wali Kelas', 'UC_Nilai');
addSolidEdge('Guru / Wali Kelas', 'UC_RekapAbsensi');
addSolidEdge('Guru / Wali Kelas', 'Login');
addSolidEdge('Guru / Wali Kelas', 'Logout');

addSolidEdge('Guru BK', 'UC_Pelanggaran');
addSolidEdge('Guru BK', 'UC_BK');
addSolidEdge('Guru BK', 'UC_RekapPelanggaran');
addSolidEdge('Guru BK', 'Login');
addSolidEdge('Guru BK', 'Logout');

addSolidEdge('Bendahara', 'UC_Tagihan');
addSolidEdge('Bendahara', 'UC_Validasi');
addSolidEdge('Bendahara', 'UC_Riwayat');
addSolidEdge('Bendahara', 'UC_Tunggakan');
addSolidEdge('Bendahara', 'Login');
addSolidEdge('Bendahara', 'Logout');

addSolidEdge('Wali Siswa', 'UC_Memantau');
addSolidEdge('Wali Siswa', 'Login');
addSolidEdge('Wali Siswa', 'Logout');

addDashedEdge('UC_DataMaster', 'Login', 'include');
addDashedEdge('UC_Mutasi', 'Login', 'include');
addDashedEdge('UC_Absensi', 'Login', 'include');
addDashedEdge('UC_Nilai', 'Login', 'include');
addDashedEdge('UC_Pelanggaran', 'Login', 'include');
addDashedEdge('UC_Tagihan', 'Login', 'include');
addDashedEdge('UC_Memantau', 'Login', 'include');

// Adding dashed edge from Logout to Login
addDashedEdge('Logout', 'Login', 'include');

addDashedEdge('UC_Raport', 'UC_RekapAbsensi', 'include');
addDashedEdge('UC_BK', 'UC_Pelanggaran', 'extend');
addDashedEdge('UC_Validasi', 'UC_Tagihan', 'extend');

fs.writeFileSync('D:\\\\ITG 2025 semester 7\\\\SKRIPSI\\\\Use_Case_Sistem_Monitoring_Siswa.drawio', xmlHeader + xmlBody + xmlFooter);
console.log("File generated successfully.");
