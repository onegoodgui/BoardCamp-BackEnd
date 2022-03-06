import { Router } from "express";
import { gamesValidation } from "../middlewares/gamesValidation.js";
import { insertGame, getGames } from "../controllers/gamesController.js";

const gamesRouter = Router();


gamesRouter.post('/games',gamesValidation, insertGame)
gamesRouter.get('/games', getGames)


export default gamesRouter