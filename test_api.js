const http = require('http');
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/nilai-ekskul?siswa_id=48&tahun_ajaran_id=1',
  method: 'GET'
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("RESPONSE FROM SERVER:");
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});
req.end();
