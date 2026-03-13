
import express from "express";
import { config } from "dotenv";
import cors from 'cors';
import departmentRoutes from "./routes/department.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";
import AppError from "./utils/appError.js";
import courseRoutes from "./routes/course.route.js";
import teacherRoutes from "./routes/teacher.route.js";
import subjectRoutes  from "./routes/subject.route.js";
import teacherSubjectRoutes from "./routes/teacherSubject.routes.js";
import sectionRoutes from "./routes/section.route.js";
import timeSlotsRoutes from "./routes/timeSlots.routes.js";
import timetablesRoutes from "./routes/timetable.route.js";
import buildingRoutes from "./routes/building.route.js";
import roomRoutes from "./routes/room.route.js"

config();

const app = express();



app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ROUTES */
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/courses",courseRoutes);
app.use("/api/v1/teachers", teacherRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/teacher-Subjects", teacherSubjectRoutes);
app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/time-slots", timeSlotsRoutes);
app.use("/api/v1/timetables", timetablesRoutes);
app.use("/api/v1/buildings",buildingRoutes);
app.use("/api/v1/rooms",roomRoutes)

app.get("/ping", (_req, res) => {
  res.send("pong");
});

/*  UNKNOWN ROUTES (NO '*') */
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

/* GLOBAL ERROR HANDLER (ALWAYS LAST) */
app.use(errorMiddleware);

export default app;
