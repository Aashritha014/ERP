import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const sessions = new Map<string, any>();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET ?? "erp-secret"));

app.use((req: Request, _res: Response, next: NextFunction): void => {
  const sessionId = (req as any).signedCookies?.["erp-session"] || req.cookies?.["erp-session"];
  if (sessionId && sessions.has(sessionId)) {
    (req as any).session = sessions.get(sessionId);
    (req as any).sessionId = sessionId;
  }
  next();
});

app.use("/api", (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);
  (res as any).json = (data: any) => {
    const sessionData = (req as any).session;
    const sessionId = (req as any).sessionId;

    if (sessionData && !sessionId) {
      const newSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessions.set(newSessionId, sessionData);
      res.cookie("erp-session", newSessionId, {
        httpOnly: true,
        signed: false,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
    }

    if (sessionData === undefined && sessionId) {
      sessions.delete(sessionId);
      res.clearCookie("erp-session");
    }

    return originalJson(data);
  };
  next();
});

app.use("/api", router);

export default app;
