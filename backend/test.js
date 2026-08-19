const http = require('http');

const data = JSON.stringify({
    username: 'admin',
    password: 'password123'
});

const req = http.request('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const token = JSON.parse(body).token;
        console.log('Got token:', !!token);

        const req2 = http.request('http://localhost:5000/api/push/vapidPublicKey', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        }, (res2) => {
            let body2 = '';
            res2.on('data', chunk => body2 += chunk);
            res2.on('end', () => {
                console.log('STATUS:', res2.statusCode);
                console.log('BODY:', body2);
            });
        });
        req2.end();
    });
});

req.write(data);
req.end();
