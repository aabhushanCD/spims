import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.send("Server is healthy");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
