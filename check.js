const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/users',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' // We don't have a token, we might get 401.
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if(res.statusCode !== 200) console.log(data);
  });
});

req.on('error', e => console.error(e));
req.end();
