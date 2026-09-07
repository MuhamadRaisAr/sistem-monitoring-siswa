/**
 * Utility function untuk melakukan fetch ke API dengan penanganan error yang aman.
 * Mencegah SyntaxError ketika server mengembalikan response bukan JSON (misalnya 500 Internal Server Error).
 *
 * @param {string} url - URL endpoint API
 * @param {RequestInit} options - Opsi fetch (method, headers, body, dll)
 * @returns {Promise<any>} - Data JSON dari response
 * @throws {Error} - Melempar error jika response tidak OK atau bukan JSON
 */
export async function apiFetch(url, options = {}) {
    const res = await fetch(url, options);

    // Coba parse sebagai JSON terlebih dahulu
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        // Jika bukan JSON (mis. response HTML dari error 500), baca sebagai teks
        const text = await res.text();
        try {
            data = JSON.parse(text);
        } catch {
            // Response bukan JSON sama sekali — buat pesan error yang informatif
            if (!res.ok) {
                throw new Error(`Server error ${res.status}: ${res.statusText}`);
            }
            throw new Error(`Response bukan JSON: ${text.substring(0, 100)}`);
        }
    }

    if (!res.ok) {
        throw new Error(data?.message || `Error ${res.status}: ${res.statusText}`);
    }

    return data;
}
