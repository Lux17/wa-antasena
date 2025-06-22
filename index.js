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
        else if (lowerText === 'tutor') {
            pesan =`Hi ${mentionTag},\n \n ${harga}`;
        }
        else if (lowerText === 'help') {
            pesan =`Hi ${mentionTag},\n \n ${harga}`;
        }
        else if (lowerText === 'morning all') {
            pesan =`Hi Member,\n \n ${harga}`;
        }
        else if (lowerText === 'night all') {
            pesan =`Hi Member,\n  \n ${harga}`;
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
