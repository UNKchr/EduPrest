import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler";
import protectedRoutes from "./routes/protected.routes";
import itemsRoutes from "./routes/items.routes";
import loansRoutes from "./routes/loans.routes";
import auditRoutes from "./routes/audit.routes";
import reportsRoutes from "./routes/reports.routes";
import organizationsRoutes from "./routes/organizations.routes";
import usersRoutes from "./routes/users.routes";
import userReportsRoutes from "./routes/userReports.routes";
import banRequestsRoutes from "./routes/banRequests.routes";
import accessRequestsRoutes from "./routes/accessRequests.routes";
import orgRequestsRoutes from "./routes/orgRequests.routes";

const app = express();

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    if (env.corsOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error("CORS not allowed"), false);
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/items", itemsRoutes);
app.use("/loans", loansRoutes);
app.use("/audit", auditRoutes);
app.use("/reports", reportsRoutes);

app.use("/orgs", organizationsRoutes);
app.use("/users", usersRoutes);
app.use("/user-reports", userReportsRoutes);
app.use("/ban-requests", banRequestsRoutes);
app.use("/access-requests", accessRequestsRoutes);
app.use("/org-requests", orgRequestsRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});