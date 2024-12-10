const express = require('express');
const redis = require('redis');
const app = express();

// Tạo và kết nối Redis client
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.connect();

// API đặt hàng
app.get('/order', async (req, res) => {
    const time = new Date().getTime();
    const keyName = 'iphone16';
    const slTonKho = 10;
    const slMua = 1;

    try {
        // Kiểm tra trạng thái Redis client
        if (!redisClient.isReady) {
            console.error('Redis client chưa sẵn sàng');
            return res.status(500).json({ message: 'Redis client chưa sẵn sàng', time });
        }

        // Watch key trước khi giao dịch
        await redisClient.watch(keyName);

        // Lấy số lượng đã bán
        const slBanRa = parseInt(await redisClient.get(keyName) || 0);

        // Kiểm tra tồn kho
        if (slBanRa + slMua > slTonKho) {
            await redisClient.unwatch();
            return res.status(400).json({ message: 'Hết hàng', time });
        }

        // Thực hiện giao dịch
        const multi = redisClient.multi();
        multi.INCRBY(keyName, slMua);
        const result = await multi.exec();

        // Kiểm tra kết quả giao dịch
        if (!result) {
            throw new Error('Giao dịch thất bại do xung đột dữ liệu');
        }

        return res.status(200).json({ message: 'Đặt hàng thành công', time });
    } catch (error) {
        console.error('Lỗi:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống', time });
    }
});

// Đóng Redis client khi ứng dụng tắt
process.on('SIGINT', async () => {
    await redisClient.quit();
    console.log('Redis client disconnected');
    process.exit(0);
});

// Khởi động server
app.listen(3000, () => {
    console.log('Server đang chạy tại http://localhost:3000');
});
