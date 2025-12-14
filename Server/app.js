config();
import express from 'express';
import { config } from 'dotenv';
const app = express();

app.get("/ping", (_req, res) => {
    res.send('pong');
});

export default app;