import express, { json } from 'express';
import { config } from 'dotenv';
const app = express();

config();

app.use(express.json());

app.get("/ping", (_req, res) => {
    res.send('pong');
});

export default app;