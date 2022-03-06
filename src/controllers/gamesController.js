import db from '../db.js'

export async function insertGame(req, res){

    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;
    

    try{
        const existentGame = await db.query('SELECT name FROM games WHERE name = $1',[name]);

        if(existentGame.rows.length > 0){
            res.status(409).send('Jogo já existente');
            return
        }

        await db.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',[name, image, stockTotal, categoryId, pricePerDay]);
        res.status(201).send('game inserido');
    }
    catch(error){
        res.status(500).send(error);
    }

}

export async function getGames(req, res){


    try{
        if(Object.keys(req.query)=== undefined){
            const {name} = req.query;
            const gameQuery = await db.query(
                `SELECT games.*,categories.* from games 
                    WHERE lower(name) LIKE lower('%${name}%')
                    JOIN categories ON games."categoryId" = categories.id
                `
                        
            );
            const games = gameQuery.rows;
            res.status(200).send(games);
            return
        }
        
       const categories = await db.query(   
           `SELECT games.*, 
                categories.id AS "categoryId", 
                categories.name AS "categoryName" 
            FROM games 
            JOIN categories 
                ON games."categoryId"=categories.id;
            `
       );
        res.status(201).send(categories.rows);
    }
    catch(error){
        res.status(500).send(error);
    }

}
