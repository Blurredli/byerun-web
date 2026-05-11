const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const morgan = require('morgan');
const { createLogger, transports, format } = require('winston');

const app = express();
const port = 3000;

// 创建日志记录器
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'combined.log' })
    ]
});

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 处理跨域预检请求
app.use((req, res, next) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*'
    });
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ...前面的代码保持不变
app.all('*', async (req, res) => {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    const backendUrl = 'https://run-lb.tanmasports.com/v1' + url.pathname + url.search;

    const newHeaders = { ...req.headers };
    delete newHeaders.host;
    delete newHeaders.origin;   // 解决 405 关键：删除跨域源信息
    delete newHeaders.referer;
    delete newHeaders['content-length']; // 解决 405 关键：让 fetch 重新计算长度

    newHeaders['user-agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

    try {
        const response = await fetch(backendUrl, {
            method: req.method,
            headers: newHeaders,
            body: (req.method === 'GET' || req.method === 'HEAD') ? null : JSON.stringify(req.body)
        });
        const body = await response.text();
        res.status(response.status).send(body);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

// Vercel 适配：必须导出 app 实例
module.exports = app;

app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});