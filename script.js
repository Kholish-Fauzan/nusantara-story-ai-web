// script.js
// Frontend JavaScript - Memanggil Netlify Function untuk interaksi Gemini API

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

// Fungsi untuk memanggil Netlify Function
async function callNetlifyFunction(type, data) {
    try {
        const response = await fetch('/.netlify/functions/generate', { // Endpoint Netlify Function
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data }) // Kirim tipe permintaan dan data
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        return await response.json(); // Mengembalikan respons dari fungsi Netlify
    } catch (error) {
        console.error("Error calling Netlify Function:", error);
        showError(`Gagal memproses permintaan: ${error.message}.`);
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
        loadingIndicator.classList.add('hidden'); // Hide loading if validation fails
        return;
    }

    let generatedNarration = null;
    let analysisResult = null;

    // Call Netlify Function for Narration
    const narrationResponse = await callNetlifyFunction("narration", { judul, lokasi, deskripsi, target, gaya });
    if (!narrationResponse || narrationResponse.type !== "narration") {
        showError(narrationResponse.content || "Gagal mendapatkan narasi dari AI."); // Use content for specific error if available
        return; // Stop if narration failed
    }
    generatedNarration = narrationResponse.content;
    narrationContentDiv.innerHTML = generatedNarration.replace(/\n/g, '<br/>'); // Preserve line breaks
    narrationOutputSection.classList.remove('hidden');

    // Call Netlify Function for Analysis
    const analysisResponse = await callNetlifyFunction("analysis", { lokasi, narrative: generatedNarration });
    if (!analysisResponse || analysisResponse.type !== "analysis") {
        showError(analysisResponse.content || "Gagal mendapatkan analisis dari AI."); // Use content for specific error if available
        return; // Stop if analysis failed
    }
    analysisResult = analysisResponse.content;
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