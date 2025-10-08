import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy ở cổng ${PORT}`));
