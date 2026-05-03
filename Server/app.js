import express from "express";
import { config } from "dotenv";
import cors from "cors";
import morgan from "morgan";

import departmentRoutes     from "./routes/department.routes.js";
import courseRoutes         from "./routes/course.route.js";
import teacherRoutes        from "./routes/teacher.route.js";
import subjectRoutes        from "./routes/subject.route.js";
import teacherSubjectRoutes from "./routes/teacherSubject.routes.js";
import sectionRoutes        from "./routes/section.route.js";
import timeSlotsRoutes      from "./routes/timeSlots.routes.js";
import timetablesRoutes     from "./routes/timetable.route.js";
import buildingRoutes       from "./routes/building.route.js";
import roomRoutes           from "./routes/room.route.js";
import authRoutes           from "./routes/auth.route.js";
import bulkRoutes           from "./routes/bulk.route.js";
import notifyRoutes         from "./routes/notify.routes.js";
import { sendTimetableEmailController } from "./Controller/timetable.controller.js";
import errorMiddleware      from "./middleware/error.middleware.js";
import AppError             from "./utils/appError.js";
import { protect, restrictTo } from "./middleware/auth.middleware.js";

config();

const app = express();

/* ── CORS ── */
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── REQUEST LOGGER ── */
app.use(morgan("dev"));

/* ── PUBLIC: Auth routes (login) ── */
app.use("/api/v1/bulk", bulkRoutes);

/* ── BULK UPLOAD ── */
app.use("/api/v1/auth", authRoutes);

/* ── PROTECTED: Admin-only management routes ── */
app.use("/api/v1/departments",      protect, restrictTo("admin"), departmentRoutes);
app.use("/api/v1/courses",          protect, restrictTo("admin"), courseRoutes);
app.use("/api/v1/teachers",         protect, restrictTo("admin"), teacherRoutes);
app.use("/api/v1/subjects",         protect, restrictTo("admin"), subjectRoutes);
app.use("/api/v1/teacher-subjects", protect, restrictTo("admin"), teacherSubjectRoutes);
app.use("/api/v1/sections",         protect, restrictTo("admin"), sectionRoutes);
app.use("/api/v1/time-slots",       protect, restrictTo("admin"), timeSlotsRoutes);
app.use("/api/v1/buildings",        protect, restrictTo("admin"), buildingRoutes);
app.use("/api/v1/rooms",            protect, restrictTo("admin"), roomRoutes);

/* ── NOTIFY: Send credentials + change password ── */
app.use("/api/v1/notify", notifyRoutes);

/* ── PROTECTED: Timetable — all roles can read, only admin can generate ── */
app.use("/api/v1/timetables", protect, timetablesRoutes);
app.post("/api/v1/send-timetable-email", protect, restrictTo("admin"), sendTimetableEmailController);

/* ── HEALTH CHECK ── */
app.get("/ping", (_req, res) => res.json({ status: "ok" }));

/* ── 404 ── */
app.use((req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

/* ── GLOBAL ERROR HANDLER ── */
app.use(errorMiddleware);

export default app;
