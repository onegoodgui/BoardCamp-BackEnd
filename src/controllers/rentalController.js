import db from "../db.js";
import dayjs from "dayjs";

export async function insertRental(req, res){

    const rentDate = dayjs().format('YYYY-MM-DD');
    const {gameId, customerId, daysRented} = req.body;

    try{

        const existenceValidation = await db.query(
            `SELECT 
                customers.id AS customerId, games.id AS gameId
            FROM games
            JOIN customers
                ON customers.id = $1
            WHERE games.id = $2`               
        ,[customerId, gameId])
    
        if(existenceValidation.rows.length === 0){
            res.status(400).send();
            return
        }

        const availabilityQuery = await db.query(
            `SELECT
                rentals."returnDate", rentals."rentDate"
            FROM 
                rentals
            WHERE rentals."gameId" = $1`,
            [gameId]
        )
        const availability = availabilityQuery.rows;
        let count = 0;

        for(let i=0; i< availability.length; i++){
            if(availability[i].returnDate === null && availability[i].rentDate !== null){
                count ++
            }
        }

        const stockTotalQuery = await db.query(
            `SELECT "stockTotal"
             FROM games
             WHERE games.id = $1
            `
            ,[gameId]
        )
        const {stockTotal} = stockTotalQuery.rows[0];

        if(count === stockTotal){
            res.status(400).send('Todos os jogos estão alugados no momento');
            return
        }

        const rentalFeeQuery = await db.query(
            `SELECT games."pricePerDay" FROM games WHERE games.id = $1` 
        ,[gameId])

        const rentalFee = rentalFeeQuery.rows[0];
        const originalPrice = rentalFee.pricePerDay*daysRented;

        await db.query(
        `INSERT INTO rentals ("customerId", "gameId", "daysRented", "rentDate", "originalPrice", "returnDate", "delayFee")
        VALUES ($1, $2, $3, $4, $5, $6, $7)`
        ,[customerId, gameId, daysRented, rentDate, originalPrice, null, null]
        )

        res.status(200).send('aluguel criado');
    }
    catch(error){
        res.status(500).send(error);
    }

}




export async function getRentals(req, res){

    let offset = '';
    if (req.query.offset) {
        offset = `OFFSET ${req.query.offset}`;
    }

    let limit = '';
    if (req.query.limit) {
        limit = `LIMIT ${req.query.limit}`;
    }  

    try{
        let rentalsQuery = '';

        if(req.query.customerId){
            rentalsQuery = await db.query(
                `SELECT * 
                FROM 
                    rentals 
                WHERE 
                    "customerId" = $1
                ${limit}
                ${offset}`
            ,[req.query.customerId]
            );
        }
        else if(req.query.gameId){
            rentalsQuery = await db.query(
                `SELECT *
                 FROM 
                    rentals
                 WHERE
                    "gameId" = $1
                ${limit}
                ${offset}`
            ,[req.query.gameId]
            );
        }
        else{
            rentalsQuery = await db.query(
                `SELECT *
                 FROM 
                    rentals
                ${limit}
                ${offset}`
            );
        }
        
        const customersQuery = await db.query(`SELECT * FROM customers`);
        const categoriesQuery = await db.query(`SELECT * from categories`)
        const gamesQuery = await db.query('SELECT * FROM games');

        const rentalsJSON = rentalsQuery.rows.reduce((rentalsArray, rental) => {
            
    // *********Pesquisando pelo jogo referenciado pelo id em 'gameId' no objeto de rentals**********
            const rentedGameObject = gamesQuery.rows.find((game) => {
                const {id, name, categoryId} = game
                if(rental.gameId === game.id){
                    const rentedGame = {game: {id, name, categoryId}} 
                    return true
                }
            })
            const {id, name, categoryId} = rentedGameObject;
            const rentedGame = {game: {id, name, categoryId}}
// ***************************************************************************************************

// *******Pesquisando pelo nome da categoria referenciada pelo 'categoryId' no objeto de rentals******
            categoriesQuery.rows.map((category) => {

                const {categoryId} = rentedGame;
                const {name} = category;

                if(categoryId === category.id){
                    rentedGame.categoryName = name;
                    return true
                }
        })

// ***************************************************************************************************

// ***********Pesquisando pelo cliente referenciado pelo 'customerId' no objeto de rentals************
            const customerObject = customersQuery.rows.find((customer) => {
                if(customer.id === rental.customerId){
                    
                    return true
                }
            })
            const customer = {customer: {id: customerObject.id, name: customerObject.name}};
// ***************************************************************************************************
            
            if(req.query.status){
                const status = req.query.status;
                if(status === 'closed'){
                    if (rental.returnDate !== null){
                        rentalsArray.push({...rental, ...customer, ...rentedGame});
                        return rentalsArray
                    }
                    else{
                        return rentalsArray
                    }
                }
                else if(status === 'open'){
                    if(rental.returnDate === null){
                        rentalsArray.push({...rental, ...customer, ...rentedGame});
                        return rentalsArray 
                    }
                    else{
                        return rentalsArray
                    } 
                }
            }
            else if(req.query.startDate){
                const rentDate = dayjs(rental.rentDate).format('YYYY-MM-DD');
                const isAfter = dayjs(rentDate).isAfter(req.query.startDate, 'days');
                if(isAfter){
                    rentalsArray.push({...rental, ...customer, ...rentedGame});
                    return rentalsArray 
                }
                else{
                    return rentalsArray
                }
            } 
            else{

                rentalsArray.push({...rental, ...customer, ...rentedGame});
                return rentalsArray
            }

        },[])
        res.send(rentalsJSON);
        

    }
    catch(error){
        res.status(500).send(error)
    }
}


export async function checkoutRental(req, res){

    const {id} = req.params;
    const checkOutDate = dayjs().format('YYYY-MM-DD');

    try{
        const rentalQuery = await db.query('SELECT * from rentals WHERE id = $1', [id]);
        const rentalObj = rentalQuery.rows[0];

        if(!rentalObj){
            res.status(404).send('Id de aluguel inválido');
            return
        }

        if(rentalObj.returnDate !== null){
            res.status(400).send('Aluguel já finalizado');
            return
        }

        const checkoutDateLimit = dayjs(rentalObj.rentDate).add(rentalObj.daysRented, 'days').format('YYYY-MM-DD') 
        const timeDiff = dayjs(checkOutDate).diff(checkoutDateLimit, 'days');
        if(timeDiff > 0){
        
            const dayFee = await db.query('SELECT games."pricePerDay" FROM games WHERE games.id = $1', [rentalObj.gameId]);
            const {pricePerDay} = dayFee.rows[0];

            rentalObj.delayFee = timeDiff*pricePerDay;
        }
       
        rentalObj.returnDate = checkOutDate;

        await db.query('UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3', [rentalObj.returnDate, rentalObj.delayFee, id])

        res.send('Aluguel atualizado com sucesso')

    }
    catch(error){
        res.status(500).send(error)
    }

}

export async function deleteRental(req, res){

    const {id} = req.params;
    try{
        const rentalQuery = await db.query('SELECT * from rentals WHERE id = $1', [id]);
        const rentalObj = rentalQuery.rows[0];

        if(!rentalObj){
            res.status(404).send('Id de aluguel inválido');
            return
        }

        if(rentalObj.returnDate !== null){
            res.status(400).send('Aluguel já finalizado');
            return
        }

        await db.query('DELETE FROM rentals WHERE id = $1', [id]);
        res.sendStatus(200);
    }
    catch(error){

    }

}

export async function rentalsMetrics(req, res){

    try{

        if(req.query.startDate || req.query.endDate){
            const {startDate, endDate} = req.query;
            let startDateString, endDateString = ' ';

            if(startDate){
                    startDateString = ` "rentDate" >= '${startDate}'`
            }
            if(endDate){
                if(startDate){
                    endDateString = ` AND "rentDate" <= '${endDate}'`
                }
                else{
                    startDateString = ' ';
                    endDateString = ` "rentDate" <= '${endDate}'`
                }
            }

            const metricsQuery = await db.query(
                `SELECT
                    SUM("originalPrice" + COALESCE("delayFee", 0)) AS revenue,
                    count(*) AS rentals,
                    AVG("originalPrice" + COALESCE("delayFee", 0)) AS average
                 FROM rentals

                 WHERE
                    ${startDateString}
                    ${endDateString}
                 `
                ,[])
            const metrics = metricsQuery.rows[0];
            res.send(metrics);

        }
        else{

            const metricsQuery = await db.query(
                `SELECT
                    SUM("originalPrice" + COALESCE("delayFee", 0)) AS revenue,
                    count(*) AS rentals,
                    AVG("originalPrice" + COALESCE("delayFee", 0)) AS average
                     FROM rentals `
                ,[])
            const metrics = metricsQuery.rows[0];
            res.send(metrics);
        }
    }
    catch(error){
        res.status(500).send(error);
    }
}