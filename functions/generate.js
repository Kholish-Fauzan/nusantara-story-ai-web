// functions/generate.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    // Ambil API Key dari Environment Variable Netlify
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Gemini API Key is not configured." })
        };
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    try {
        const body = JSON.parse(event.body);
        const { type, data } = body;

        let prompt = "";
        let generationConfig = {}; // Untuk responseMimeType dan schema

        if (type === "narration") {
            const { judul, lokasi, deskripsi, target, gaya } = data;
            prompt = `
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
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return {
                statusCode: 200,
                body: JSON.stringify({ type: "narration", content: text })
            };

        } else if (type === "analysis") {
            const { lokasi, narrative } = data;
            prompt = `
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
            
            generationConfig = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
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
            };

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: generationConfig
            });
            const response = await result.response;
            const jsonString = response.text();

            // Gemini API might return JSON wrapped in markdown, so remove it
            const cleanedJsonString = jsonString.replace(/```json\n|\n```/g, '').trim();
            const analysisJson = JSON.parse(cleanedJsonString);

            return {
                statusCode: 200,
                body: JSON.stringify({ type: "analysis", content: analysisJson })
            };

        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Invalid request type." })
            };
        }

    } catch (error) {
        console.error("Error in Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message })
        };
    }
};