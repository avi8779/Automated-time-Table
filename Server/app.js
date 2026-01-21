
import express from "express";
import { config } from "dotenv";
import departmentRoutes from "./routes/department.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import AppError from "./utils/appError.js";
import courseRoutes from "./routes/course.route.js";
import teacherRoutes from "./routes/teacher.route.js";
import subjectRoutes  from "./model/subject.model.js";

config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ROUTES */
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/courses",courseRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/subjects/", subjectRoutes);

app.get("/ping", (_req, res) => {
  res.send("pong");
});

/* ❗ UNKNOWN ROUTES (NO '*') */
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

/* ❗ GLOBAL ERROR HANDLER (ALWAYS LAST) */
app.use(errorMiddleware);

export default app;
