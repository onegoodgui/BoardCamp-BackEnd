import gameSchema from "../schemas/gameSchema.js";

export async function gamesValidation(req, res, next){

const game  = req.body;

const validation = gameSchema.validate(game);
if(validation.error){
    return res.sendStatus(422);
}

next()
}