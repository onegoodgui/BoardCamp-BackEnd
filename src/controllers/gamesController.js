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

    let offset = '';
    if (req.query.offset) {
        offset = `OFFSET ${req.query.offset}`;
    }

    let limit = '';
    if (req.query.limit) {
        limit = `LIMIT ${req.query.limit}`;
    }  


    try{
        if(req.query.name !== undefined){
            const {name} = req.query;
            const gameQuery = await db.query(
                `SELECT 
                    games.*,
                    categories.id AS "categoryId",  
                    categories.name AS "categoryName",
                    COUNT(rentals) AS "rentalsCount" 
                FROM games 
                    LEFT JOIN categories 
                        ON games."categoryId" = categories.id 
                    LEFT JOIN rentals
                        ON rentals."gameId" = games.id
                WHERE 
                    lower(games.name) LIKE lower('${name}%')
                GROUP BY
                    games.id, categories.id
                 ${offset}
                 ${limit}
                    
                `         
            );
            const games = gameQuery.rows;
            res.status(200).send(games);
            return
        }
        
       const games = await db.query(   
           `SELECT games.*, 
                categories.id AS "categoryId", 
                categories.name AS "categoryName",
                COUNT(rentals) AS "rentalsCount"
            FROM games 
                LEFT JOIN categories 
                    ON games."categoryId" = categories.id 
                LEFT JOIN rentals
                    ON rentals."gameId" = games.id
            GROUP BY
                games.id, categories.id

            ${offset}
            ${limit}
            `
       );
        res.status(201).send(games.rows);
    }
    catch(error){
        res.status(500).send(error);
    }

}
