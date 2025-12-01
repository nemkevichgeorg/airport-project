// create-hash.js
const bcrypt = require('bcryptjs');

const password = 'display'; // пароль который хотите захешировать
bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    console.log(`Пароль: ${password}`);
    console.log(`Хеш:    ${hash}`);
    console.log(`SQL:    INSERT INTO users (username, password_hash, role) VALUES ('username', '${hash}', 'role');`);
});