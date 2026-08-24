const express = require('express');
const router = express.Router();
const nilaiEkskulController = require('../controllers/nilaiEkskulController');

router.get('/', nilaiEkskulController.getNilaiEkskulBySiswa);
router.get('/anggota', nilaiEkskulController.getAnggotaEkskul);
router.get('/rekap-kelas', nilaiEkskulController.getNilaiEkskulByKelas);
router.post('/anggota', nilaiEkskulController.addAnggotaEkskul);
router.post('/', nilaiEkskulController.saveNilaiEkskul);
router.delete('/:id', nilaiEkskulController.deleteNilaiEkskul);

module.exports = router;
