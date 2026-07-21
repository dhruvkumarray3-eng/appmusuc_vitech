import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import historyRouter from "./history";
import favoritesRouter from "./favorites";
import playlistRouter from "./playlist";
import musicRouter from "./music";
import botRouter from "./bot";
import downloadRouter from "./download";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);
router.use(historyRouter);
router.use(favoritesRouter);
router.use(playlistRouter);
router.use(musicRouter);
router.use(botRouter);
router.use(downloadRouter);

export default router;
