const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const SANDI = 'rahasia123'; // Ganti dengan sandi kamu

// Ambil harga dari file
const getHarga = () => {
    const data = fs.readFileSync('./harga.json');
    return JSON.parse(data);
};

// Simpan harga ke file
const setHarga = (produk, hargaBaru) => {
    const data = getHarga();
    data[produk] = hargaBaru;
    fs.writeFileSync('./harga.json', JSON.stringify(data, null, 2));
};

// Fungsi ambil dan simpan stok
const getStok = () => {
    if (!fs.existsSync('./stok.json')) fs.writeFileSync('./stok.json', '{}');
    const data = fs.readFileSync('./stok.json');
    return JSON.parse(data);
};

const setStok = (produk, jumlah) => {
    const data = getStok();
    data[produk] = jumlah;
    fs.writeFileSync('./stok.json', JSON.stringify(data, null, 2));
};


// Format waktu lokal Indonesia
const getDateTimeNow = () => {
    const now = new Date();
    return now.toLocaleString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long',
        year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
};

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('Bot siap digunakan.'));

client.on('message', async message => {
    const text = message.body.trim();
    const lowerText = text.toLowerCase();
    const hargaData = getHarga();
    const produkList = Object.keys(hargaData);

    // Ambil ID user dan format @mention
    const pengirim = message.author || message.from;
    const noHp = pengirim.split('@')[0];
    const mentionTag = `@${noHp}`;
    

    // ➤ Jika pesan cocok dengan nama produk
    if (produkList.includes(lowerText)) {
        const harga = hargaData[lowerText];
        const waktu = getDateTimeNow();

        let pesan = '';

        if (lowerText === 'list') {
            pesan =`Hi ${mentionTag},\n \n ${waktu} \n ${harga}`;
        } 
        else if (lowerText === 'morning all') {
            pesan =`Hi Member,\n \n ${harga}`;
        }
        else if (lowerText === 'night all') {
            pesan =`Hi Member,\n  \n ${harga}`;
        }
        else if (lowerText === 'tutor') {
            pesan =`Hi ${mentionTag},\n \n ${harga}`;
        }
        else if (lowerText === 'help') {
            pesan =`Hi ${mentionTag},\n \n ${harga}`;
        }
        else if (lowerText === 'proses') {
            pesan =` ${harga}\n \n 📆 TANGGAL : ${waktu}`;
        }
        else if (lowerText === 'done') {
            pesan =` ${harga}\n \n 📆 TANGGAL : ${waktu}`;
        }
        else if (lowerText === 'payment') {
            if (fs.existsSync('./images/payment.jpg')) {
            const media = MessageMedia.fromFilePath('./images/payment.jpg');
            await client.sendMessage(message.from, media);
            }
            pesan =`${mentionTag},${harga}`;
        }
        else {
            pesan =`Hi ${mentionTag}, Berikut harga & deskripsinya: \n \n ${harga}`;
        }

        await client.sendMessage(message.from, pesan, {
            mentions: [pengirim]
        });
    }


    // ➤ Jika pesan cocok dengan nama produk
    // if (produkList.includes(lowerText)) {
    //     const harga = hargaData[lowerText];
    //     const waktu = getDateTimeNow();
    //     if ($harga == list){
    //     const pesan =`Hi ${mentionTag},\n(${waktu})\n ${harga}`;

    //     await client.sendMessage(message.from, pesan, {
    //         mentions: [pengirim]
    //     });
    //     }
    //     const pesan =`Hi ${mentionTag},\n ${harga}`;

    //     await client.sendMessage(message.from, pesan, {
    //         mentions: [pengirim]
    //     });
    // }

    // ➤ Jika pesan adalah "payment"
    // else if (lowerText === 'payment') {
    //     if (fs.existsSync('./images/payment.jpg')) {
    //         const media = MessageMedia.fromFilePath('./images/payment.jpg');
    //         // await client.sendMessage(message.from, media);
    //     }

    //     await client.sendMessage(message.from,
    //         media
    //         `${mentionTag}\nSilakan lakukan pembayaran ke rekening berikut:\n\nBANK ABC\nNo. Rek: 1234567890\nA/N: Toko Sederhana`, {
    //         mentions: [pengirim]
    //     });
    // }
    // Tambah stok
if (lowerText.startsWith('tambahstok')) {
    const parts = text.split(' ');
    if (parts.length === 4) {
        const nama = parts[1].toLowerCase();
        const jumlah = parseInt(parts[2]);
        const sandi = parts[3];

        if (isNaN(jumlah) || jumlah <= 0) return await client.sendMessage(message.from, '❗ Jumlah harus berupa angka positif.');
        if (sandi !== SANDI) return await client.sendMessage(message.from, '❌ Sandi salah.');

        const stokData = getStok();
        const stokLama = stokData[nama] || 0;
        setStok(nama, stokLama + jumlah);

        return await client.sendMessage(message.from, `✅ Stok "${nama}" berhasil ditambah menjadi ${stokLama + jumlah}`);
    } else {
        return await client.sendMessage(message.from, '❗ Format salah:\n`tambahstok [produk] [jumlah] [sandi]`');
    }
}

// Kurang stok
if (lowerText.startsWith('kurangstok')) {
    const parts = text.split(' ');
    if (parts.length === 4) {
        const nama = parts[1].toLowerCase();
        const jumlah = parseInt(parts[2]);
        const sandi = parts[3];

        const stokData = getStok();
        const stokLama = stokData[nama] || 0;

        if (isNaN(jumlah) || jumlah <= 0) return await client.sendMessage(message.from, '❗ Jumlah harus angka positif.');
        if (sandi !== SANDI) return await client.sendMessage(message.from, '❌ Sandi salah.');
        if (stokLama < jumlah) return await client.sendMessage(message.from, `❌ Stok "${nama}" tidak cukup. Sisa: ${stokLama}`);

        setStok(nama, stokLama - jumlah);
        return await client.sendMessage(message.from, `✅ Stok "${nama}" berhasil dikurangi menjadi ${stokLama - jumlah}`);
    } else {
        return await client.sendMessage(message.from, '❗ Format salah:\n`kurangstok [produk] [jumlah] [sandi]`');
    }
}

if (lowerText === 'stok') {
    const stokData = getStok();

    if (Object.keys(stokData).length === 0) {
        return await client.sendMessage(message.from, '📦 Belum ada stok produk yang tersedia.');
    }

    let pesan = '📦 *Daftar Stok Produk Saat Ini:*\n\n';
    for (const [produk, jumlah] of Object.entries(stokData)) {
      pesan += `• *${produk.toUpperCase()}* : ${jumlah}\n`;

    }

    return await client.sendMessage(message.from, pesan);
}



    // ➤ Jika pesan diawali dengan "ubahharga"
    else if (lowerText.startsWith('ubahharga')) {
        const parts = text.split(' ');
        if (parts.length >= 4) {
            const produk = parts[1].toLowerCase();
            const sandi = parts[2];
            const hargaBaru = parts.slice(3).join(' ');

            if (!produkList.includes(produk)) {
                return await client.sendMessage(message.from, `❌ Produk "${produk}" tidak ditemukan.`);
            }

            if (sandi !== SANDI) {
                return await client.sendMessage(message.from, '❌ Sandi salah.');
            }

            setHarga(produk, hargaBaru);
            await client.sendMessage(message.from, `✅ Harga ${produk} berhasil diubah menjadi:\n${hargaBaru}`);
        } else {
            await client.sendMessage(message.from,
                '❗ Format salah. Gunakan format:\n\n`ubahharga [produk] [harga panjang] [sandi]`\n\nContoh:\n`ubahharga garam Rp3.000 per bungkus rahasia123`');
        }
    }
});

// WAJIB: Inisialisasi WhatsApp client agar QR muncul
client.initialize();
