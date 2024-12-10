const { createClient } = require('redis');

// Tạo Redis client
const redisClient = createClient();

// Kết nối đến Redis
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect();

module.exports = redisClient;
