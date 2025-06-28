// script.js
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

// DOM Elements
const judulObjekInput = document.getElementById('judul_objek');
const lokasiObjekInput = document.getElementById('lokasi_objek');
const deskripsiKunciInput = document.getElementById('deskripsi_kunci');
const gayaBahasaSelect = document.getElementById('gaya_bahasa');
const targetAudiensInput = document.getElementById('target_audiens');
const generateBtn = document.getElementById('generateBtn');

const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessageDiv = document.getElementById('errorMessage');
const errorTextSpan = document.getElementById('errorText');

const narrationOutputSection = document.getElementById('narrationOutputSection');
const narrationContentDiv = document.getElementById('narrationContent');
const downloadNarrationBtn = document.getElementById('downloadNarrationBtn');

const analysisOutputSection = document.getElementById('analysisOutputSection');
const analysisContentDiv = document.getElementById('analysisContent');
const downloadAnalysisBtn = document.getElementById('downloadAnalysisBtn');

// Fungsi untuk menampilkan pesan error
function showError(message) {
    errorMessageDiv.classList.remove('hidden');
    errorTextSpan.textContent = message;
    loadingIndicator.classList.add('hidden');
    narrationOutputSection.classList.add('hidden');
    analysisOutputSection.classList.add('hidden');
}

// Fungsi untuk menyembunyikan pesan error
function hideError() {
    errorMessageDiv.classList.add('hidden');
}

// Fungsi untuk memanggil Gemini API untuk narasi
async function callGeminiAPIForNarration(judul, lokasi, deskripsi, target, gaya) {
    const prompt = `
    Anda adalah seorang ahli narasi budaya dan pariwisata Indonesia. Buatlah narasi yang memukau dan informatif tentang objek budaya/pariwisata berikut:

    Nama Objek: ${judul}
    Lokasi: ${lokasi}
    Deskripsi Kunci/Fakta Sejarah: ${deskripsi}

    Target Audiens (jika ada): ${target || 'Umum'}
    Gaya Bahasa (jika dipilih): ${gaya !== 'Pilih Gaya' ? gaya : 'Informatif dan Menarik'}

    Fokuskan pada:
    1. Keunikan dan daya tarik utama objek tersebut.
    2. Sejarah atau latar belakang budaya yang relevan (jika ada dalam deskripsi kunci).
    3. Potensi pengalaman bagi pengunjung/pembaca.
    4. Gunakan bahasa yang kaya dan deskriptif.
    5. Panjang narasi sekitar 400-600 kata.

    Pastikan narasi tersebut otentik dan menggugah minat.
    `;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Respons narasi dari AI tidak valid atau kosong.");
        }
    } catch (error) {
        console.error("Error generating narration:", error);
        showError(`Gagal merangkai narasi: ${error.message}.`);
        return null;
    }
}

// Fungsi untuk memanggil Gemini API untuk analisis
async function callGeminiAPIForAnalysis(lokasi, narrative) {
    const prompt = `
    Berdasarkan narasi tentang objek budaya/pariwisata dari ${lokasi} ini, berikan analisis mendalam yang berfokus pada potensi promosi dan pengembangan ekonomi lokal.

    Narasi:
    ${narrative}

    Berikan output dalam format JSON yang terstruktur dengan kunci-kunci berikut. Untuk setiap kunci, berikan minimal 3 poin (jika relevan).

    {
      "Poin Jual Utama": [
        {"poin": "Poin utama 1", "deskripsi": "Deskripsi poin 1"},
        {"poin": "Poin utama 2", "deskripsi": "Deskripsi poin 2"}
      ],
      "Segmen Wisatawan Ideal": [
        {"poin": "Segmen 1", "deskripsi": "Deskripsi segmen 1"},
        {"poin": "Segmen 2", "deskripsi": "Deskripsi segmen 2"}
      ],
      "Ide Monetisasi & Produk Pariwisata": [
        {"poin": "Ide 1", "deskripsi": "Deskripsi ide 1"},
        {"poin": "Ide 2", "deskripsi": "Deskripsi ide 2"}
      ],
      "Saran Peningkatan Pesan Promosi": [
        {"poin": "Saran 1", "deskripsi": "Deskripsi saran 1"},
        {"poin": "Saran 2", "deskripsi": "Deskripsi saran 2"}
      ],
      "Potensi Kolaborasi Lokal": [
        {"poin": "Kolaborasi 1", "deskripsi": "Deskripsi kolaborasi 1"},
        {"poin": "Kolaborasi 2", "deskripsi": "Deskripsi kolaborasi 2"}
      ]
    }

    Pastikan output adalah JSON yang valid dan dapat di-parse langsung.
    `;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT", // Changed to OBJECT to match the top-level JSON structure
                    properties: {
                        "Poin Jual Utama": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "poin": { "type": "STRING" },
                                    "deskripsi": { "type": "STRING" }
                                }
                            }
                        },
                        "Segmen Wisatawan Ideal": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "poin": { "type": "STRING" },
                                    "deskripsi": { "type": "STRING" }
                                }
                            }
                        },
                        "Ide Monetisasi & Produk Pariwisata": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "poin": { "type": "STRING" },
                                    "deskripsi": { "type": "STRING" }
                                }
                            }
                        },
                        "Saran Peningkatan Pesan Promosi": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "poin": { "type": "STRING" },
                                    "deskripsi": { "type": "STRING" }
                                }
                            }
                        },
                        "Potensi Kolaborasi Lokal": {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    "poin": { "type": "STRING" },
                                    "deskripsi": { "type": "STRING" }
                                }
                            }
                        }
                    }
                }
            }
        };

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const jsonString = result.candidates[0].content.parts[0].text;
            try {
                // Gemini API might return JSON wrapped in markdown, so remove it
                const cleanedJsonString = jsonString.replace(/```json\n|\n```/g, '').trim();
                return JSON.parse(cleanedJsonString);
            } catch (jsonError) {
                throw new Error(`Gagal mengurai JSON dari respons AI: ${jsonError.message}. Respons mentah: ${jsonString}`);
            }
        } else {
            throw new Error("Respons analisis dari AI tidak valid atau kosong.");
        }
    } catch (error) {
        console.error("Error generating analysis:", error);
        showError(`Gagal menganalisis data: ${error.message}.`);
        return null;
    }
}

// Fungsi untuk merender analisis ke DOM
function renderAnalysis(analysisData) {
    analysisContentDiv.innerHTML = ''; // Clear previous content

    const allKeys = [
        "Poin Jual Utama",
        "Segmen Wisatawan Ideal",
        "Ide Monetisasi & Produk Pariwisata",
        "Saran Peningkatan Pesan Promosi",
        "Potensi Kolaborasi Lokal"
    ];

    const col1Keys = allKeys.slice(0, 3); // First 3 for column 1
    const col2Keys = allKeys.slice(3, 5); // Last 2 for column 2

    const col1Div = document.createElement('div');
    col1Div.className = 'md:col-span-1'; // Ensure it takes one column
    const col2Div = document.createElement('div');
    col2Div.className = 'md:col-span-1'; // Ensure it takes one column

    // Helper to render cards
    function createAnalysisCard(key, items) {
        const card = document.createElement('div');
        card.className = 'bg-lightgray rounded-lg p-6 shadow-md border-l-4 border-primary mb-4'; // Tailwind classes for info-card

        const title = document.createElement('h4');
        title.className = 'text-xl font-bold text-primary mb-3';
        title.textContent = key;
        card.appendChild(title);

        if (items && Array.isArray(items)) {
            items.forEach(item => {
                const point = document.createElement('p');
                point.className = 'text-gray-800 font-semibold mb-1';
                point.innerHTML = `👉 ${item.poin}`;
                card.appendChild(point);

                const description = document.createElement('p');
                description.className = 'text-gray-700 text-sm mb-3 ml-5'; // Added ml-5 for indentation
                description.textContent = item.deskripsi;
                card.appendChild(description);
            });
        }
        return card;
    }

    col1Keys.forEach(key => {
        if (analysisData[key]) {
            col1Div.appendChild(createAnalysisCard(key, analysisData[key]));
        }
    });

    col2Keys.forEach(key => {
        if (analysisData[key]) {
            col2Div.appendChild(createAnalysisCard(key, analysisData[key]));
        }
    });

    analysisContentDiv.appendChild(col1Div);
    analysisContentDiv.appendChild(col2Div);
}


// Event Listener for Generate Button
generateBtn.addEventListener('click', async () => {
    hideError(); // Sembunyikan error sebelumnya
    narrationOutputSection.classList.add('hidden');
    analysisOutputSection.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');

    const judul = judulObjekInput.value.trim();
    const lokasi = lokasiObjekInput.value.trim();
    const deskripsi = deskripsiKunciInput.value.trim();
    const gaya = gayaBahasaSelect.value;
    const target = targetAudiensInput.value.trim();

    if (!judul || !lokasi || !deskripsi) {
        showError("Mohon lengkapi semua kolom yang bertanda '*' (Wajib diisi) sebelum melanjutkan! 🙏");
        return;
    }

    let generatedNarration = null;
    let analysisResult = null;

    // Generate Narration
    generatedNarration = await callGeminiAPIForNarration(judul, lokasi, deskripsi, target, gaya);
    if (!generatedNarration) {
        return; // Stop if narration failed
    }
    narrationContentDiv.innerHTML = generatedNarration.replace(/\n/g, '<br/>'); // Preserve line breaks
    narrationOutputSection.classList.remove('hidden');

    // Generate Analysis
    analysisResult = await callGeminiAPIForAnalysis(lokasi, generatedNarration);
    if (!analysisResult) {
        return; // Stop if analysis failed
    }
    renderAnalysis(analysisResult);
    analysisOutputSection.classList.remove('hidden');


    loadingIndicator.classList.add('hidden');

    // Store generated content for PDF
    localStorage.setItem('generatedNarrationText', generatedNarration);
    localStorage.setItem('generatedAnalysisData', JSON.stringify(analysisResult));
    localStorage.setItem('generatedTitle', judul);
});

// PDF Generation (using jsPDF)
const { jsPDF } = window.jspdf;

downloadNarrationBtn.addEventListener('click', () => {
    const text = localStorage.getItem('generatedNarrationText');
    const title = localStorage.getItem('generatedTitle');
    if (text && title) {
        const doc = new jsPDF();
        doc.setFont('helvetica'); // Default font
        doc.setFontSize(24);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(text, 10, 30, { maxWidth: 190 }); // Adjust margins and max width
        doc.save(`Kisah_${title}.pdf`);
    } else {
        alert("Tidak ada narasi yang dihasilkan untuk diunduh.");
    }
});

downloadAnalysisBtn.addEventListener('click', () => {
    const analysisDataString = localStorage.getItem('generatedAnalysisData');
    const title = localStorage.getItem('generatedTitle');
    if (analysisDataString && title) {
        const analysisData = JSON.parse(analysisDataString);
        const doc = new jsPDF();
        let y = 20;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(`Analisis Promosi untuk ${title}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 15;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Dibuat pada: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
        y += 20;

        for (const key in analysisData) {
            if (analysisData.hasOwnProperty(key)) {
                const items = analysisData[key];

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text(key, 15, y);
                y += 10;

                if (Array.isArray(items)) {
                    items.forEach(item => {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(12);
                        doc.text(`👉 ${item.poin}`, 20, y);
                        y += 7;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(10);
                        // Using splitTextToSize for multi-line description
                        const splitDesc = doc.splitTextToSize(item.deskripsi, 170); // Max width 170
                        doc.text(splitDesc, 25, y);
                        y += (splitDesc.length * 6) + 5; // Adjust y based on lines and add spacing

                        if (y > doc.internal.pageSize.getHeight() - 40) { // Check if new page is needed
                            doc.addPage();
                            y = 20; // Reset y for new page
                        }
                    });
                }
                y += 10; // Extra space after each main section
            }
        }
        doc.save(`Analisis_Promosi_${title}.pdf`);
    } else {
        alert("Tidak ada data analisis yang dihasilkan untuk diunduh.");
    }
});