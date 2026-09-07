const fs = require('fs');

function refactorFile(filePath, isComponent) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Remove avoid: 'tr'
    content = content.replace(/pagebreak:\s*\{\s*mode:\s*\['css',\s*'legacy'\],\s*avoid:\s*'tr'\s*\}/, "pagebreak:   { mode: ['css', 'legacy'] }");

    // 2. Change arrow function to block body
    const matchStart = content.indexOf('const RaportContent = ({');
    if (matchStart === -1) return;
    
    // Find the end of arguments
    const closeArgs = content.indexOf('}) => (', matchStart);
    if (closeArgs === -1) return;

    // We will extract the JSX body
    let head = content.substring(0, closeArgs + 6);
    head = head.replace('}) => (', '}) => {');
    
    // Calculate logic
    const calcLogic = `
        const processedGrades = {};
        
        if (listMapelKelas && Array.isArray(listMapelKelas)) {
            listMapelKelas.forEach(mp => {
                processedGrades[mp] = { total: 0, count: 0, keterangan: '' };
            });
        }

        if (dataRaport && dataRaport.mapels && Array.isArray(dataRaport.mapels)) {
            dataRaport.mapels.forEach(item => {
                if (!processedGrades[item.mata_pelajaran]) {
                    processedGrades[item.mata_pelajaran] = { total: 0, count: 0, keterangan: item.keterangan || '' };
                }
                if (item.rata_rata > 0) {
                    processedGrades[item.mata_pelajaran].total += Number(item.rata_rata || 0);
                    processedGrades[item.mata_pelajaran].count += 1;
                }
                if (item.keterangan && !processedGrades[item.mata_pelajaran].keterangan) {
                     processedGrades[item.mata_pelajaran].keterangan = item.keterangan;
                }
            });
        }
        
        const finalGradesList = Object.keys(processedGrades).map(mp => {
            const avg = processedGrades[mp].count > 0 ? Math.round(processedGrades[mp].total / processedGrades[mp].count) : '-';
            let capaian = processedGrades[mp].keterangan;
            if (!capaian && avg !== '-') {
                if (avg >= 85) capaian = \`Sangat baik dalam memahami dan menguasai materi pembelajaran, serta mampu mengaplikasikan pengetahuannya dengan sangat efektif.\`;
                else if (avg >= 75) capaian = \`Menunjukkan pemahaman yang baik dalam materi pembelajaran dan mampu menyelesaikan tugas dengan hasil yang memuaskan.\`;
                else capaian = \`Menunjukkan pemahaman dasar dalam materi pembelajaran, namun masih memerlukan bimbingan dan peningkatan lebih lanjut.\`;
            } else if (!capaian) {
                capaian = "Belum ada nilai yang diinputkan.";
            }
            return { mata_pelajaran: mp, nilai: avg, capaian };
        });

        // Use standard function to sort if getMapelSortIndex exists in scope
        try {
            finalGradesList.sort((a, b) => getMapelSortIndex(a.mata_pelajaran) - getMapelSortIndex(b.mata_pelajaran));
        } catch(e) {}

        const chunk1 = finalGradesList.slice(0, 11);
        const chunk2 = finalGradesList.slice(11);

        const renderRows = (list, startIndex) => {
            if (list.length === 0 && startIndex === 0) {
                return (
                    <tr>
                        <td colSpan="4" className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-8 text-center italic text-gray-500">Belum ada data mata pelajaran (jadwal kelas kosong).</td>
                    </tr>
                );
            }
            return list.map((item, index) => (
                <tr key={index} className="print:break-inside-avoid">
                    <td className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-1 text-center align-top">{startIndex + index + 1}</td>
                    <td className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-2 align-top">{item.mata_pelajaran}</td>
                    <td className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-1 text-center align-top">{item.nilai}</td>
                    <td 
                        className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-3 text-justify align-top leading-tight outline-none focus:bg-emerald-50 transition-colors"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                    >
                        <span className={item.nilai === '-' ? 'text-gray-400 italic' : ''}>{item.capaian}</span>
                    </td>
                </tr>
            ));
        };
`;

    // 3. Extract extraTables JSX
    // It starts at "{/* Table Ekstrakurikuler */}" and ends right before "{/* Halaman Kelima - Buku Induk */}"
    // OR right before closing div of RaportContent if Buku Induk doesn't exist
    const ekskulIdx = content.indexOf('{/* Table Ekstrakurikuler */}');
    let extraTablesEndIdx = content.indexOf('{/* Halaman Kelima - Buku Induk */}');
    
    // If Buku Induk not found, find the closing of the Halaman Keempat div
    if (extraTablesEndIdx === -1) {
        // Find the last </div> before the end of the file? No, just find Signatures
        const signIdx = content.indexOf('{/* Signatures */}');
        if (signIdx !== -1) {
            // find the end of Signatures block. It ends with </div></div></div>
            // Just use a regex to find the end of the sign block
            const mt4Idx = content.indexOf('className="mt-4 flex justify-center text-[13px]">', signIdx);
            extraTablesEndIdx = content.indexOf('</div>', mt4Idx + 50); // rough estimate, but we will refine
        }
    }

    if (ekskulIdx === -1) return;

    // Let's accurately parse the end of extraTables by slicing up to "</div>\n                </div>\n\n                {/* Halaman Kelima"
    let endOfPage4 = content.indexOf('</div>\n\n                {/* Halaman Kelima', ekskulIdx);
    if (endOfPage4 === -1) {
        endOfPage4 = content.indexOf('</div>\n            </div>\n        </div>\n    );\n}', ekskulIdx); // close of raport content
    }
    if (endOfPage4 === -1) {
        // manual search
        const textToFind = '</div>\n                </div>\n\n                {/* Halaman Kelima';
        endOfPage4 = content.indexOf(textToFind, ekskulIdx);
    }
    
    // More robust way: Extract everything between ekskulIdx and end of Halaman Keempat
    // Halaman Keempat ends with `</div>` right before Halaman Kelima.
    let page5Idx = content.indexOf('{/* Halaman Kelima - Buku Induk */}');
    if (page5Idx === -1) {
        page5Idx = content.indexOf('</div>\n            </div>\n        </div>\n    );'); // fallback
    }

    // find the </div> that closes Halaman Keempat.
    let closePage4 = content.lastIndexOf('</div>', page5Idx - 5);

    let extraTablesJSX = content.substring(ekskulIdx, closePage4);

    const extraTablesCode = `
        const extraTables = (
            <>
                ${extraTablesJSX}
            </>
        );

        return (
    `;

    // 4. Construct the Table Nilai Replacement
    const tableNilaiStart = content.indexOf('{/* Table Nilai */}');
    let tableNilaiEnd = ekskulIdx;

    const tableNilaiReplacement = `
                    {/* Table Nilai */}
                    <div className="flex justify-end mb-1 no-print">
                    </div>
                    <table className="w-full border-collapse ${isComponent ? '' : 'border border-black'} text-[13px]">
                        <thead>
                            <tr className="${isComponent ? '' : 'bg-gray-100/50'}">
                                <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-1 w-10 text-center font-semibold">No</th>
                                <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-2 w-48 text-center font-semibold">Muatan Pelajaran</th>
                                <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-1 w-16 text-center font-semibold">Nilai<br/>Akhir</th>
                                <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-3 text-center font-semibold">Capaian Kompetensi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderRows(chunk1, 0)}
                        </tbody>
                    </table>
                    
                    {chunk2.length === 0 && extraTables}
                </div>

                {chunk2.length > 0 && (
                    <div className="flex flex-col min-h-[850px] w-full bg-white text-black pt-16 px-12" style={{ pageBreakAfter: 'always' }}>
                        <div className="text-center mb-8 font-semibold uppercase tracking-wider">
                            Lanjutan Nilai (Muatan Pelajaran)
                        </div>
                        <table className="w-full border-collapse ${isComponent ? '' : 'border border-black'} text-[13px]">
                            <thead>
                                <tr className="${isComponent ? '' : 'bg-gray-100/50'}">
                                    <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-1 w-10 text-center font-semibold">No</th>
                                    <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-2 w-48 text-center font-semibold">Muatan Pelajaran</th>
                                    <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-1 w-16 text-center font-semibold">Nilai<br/>Akhir</th>
                                    <th className="border ${isComponent ? 'border-slate-600 border-[0.5px]' : 'border-black'} py-2 px-3 text-center font-semibold">Capaian Kompetensi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderRows(chunk2, 11)}
                            </tbody>
                        </table>
                        
                        {extraTables}
    `;

    // 5. Piece it all together
    let newContent = head; // up to "}) => {"
    newContent += calcLogic;
    newContent += extraTablesCode;
    
    // Everything between `}) => (` and ` {/* Table Nilai */}`
    let bodyStart = content.substring(closeArgs + 7, tableNilaiStart);
    newContent += bodyStart;
    
    // The new table block (which already includes the close `</div>` for Page 4)
    newContent += tableNilaiReplacement;

    // Everything after the close of page 4
    let bodyEnd = content.substring(closePage4);
    
    // Also, remember to add closing bracket for RaportContent if needed.
    // wait, RaportContent is currently implicitly returning JSX: `const RaportContent = () => ( <div>...</div> );`
    // We changed it to `() => { return ( <div>...</div> ); }`
    // So the very end of the file or function needs to have `};` instead of just `);`
    
    // Let's replace the ending of the component
    // If the file ends with `export default RaportContent;`
    // Then we need to replace the `);` right before it with `); \n};`
    let exportIdx = bodyEnd.lastIndexOf('export default');
    if (exportIdx !== -1) {
        let beforeExport = bodyEnd.substring(0, exportIdx);
        let lastParen = beforeExport.lastIndexOf(');');
        if (lastParen !== -1) {
            beforeExport = beforeExport.substring(0, lastParen) + ');\n};\n' + beforeExport.substring(lastParen + 2);
        }
        bodyEnd = beforeExport + bodyEnd.substring(exportIdx);
    } else {
        // maybe it's just exported inline?
        let lastParen = bodyEnd.lastIndexOf(');');
        if (lastParen !== -1) {
            bodyEnd = bodyEnd.substring(0, lastParen) + ');\n};\n' + bodyEnd.substring(lastParen + 2);
        }
    }

    newContent += bodyEnd;

    fs.writeFileSync(filePath, newContent);
    console.log('Refactored ' + filePath);
}

const basePath = 'D:/ITG 2025 semester 7/SKRIPSI/monitoring-siswa/frontend/src';
refactorFile(basePath + '/app/guru/cetak_raport/page.js', false);
refactorFile(basePath + '/app/admin/cetak_raport/page.js', false);
refactorFile(basePath + '/components/RaportContent.js', true);
