import db from "../db.js";
import dayjs from "dayjs";

export async function insertRental(req, res){

    const rentDate = dayjs().format('YYYY-MM-DD');
    const {gameId, customerId, daysRented} = req.body;

    try{

        const existenceValidation = await db.query(
            `SELECT customers.id, games.id 
            FROM rentals
                JOIN games
                    ON games.id = $1
                JOIN customers
                    ON customers.id = $2`
        ,[gameId, customerId])
        
        if(existenceValidation.rows.length > 0){
            res.status(400).send();
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

    try{
        let rentalsQuery = '';

        if(req.query.customerId){
            rentalsQuery = await db.query(`SELECT * from rentals WHERE "customerId" = $1`,[req.query.customerId]);
        }
        else if(req.query.gameId){
            rentalsQuery = await db.query(`SELECT * from rentals WHERE "gameId" = $1`, [req.query.gameId]);
        }
        else{
            rentalsQuery = await db.query(`SELECT * from rentals`);
        }
        
        const customersQuery = await db.query(`SELECT * FROM customers`);
        const categoriesQuery = await db.query(`SELECT * from categories`)
        const gamesQuery = await db.query('SELECT * FROM games');

        const rentalsJSON = rentalsQuery.rows.map((rental, index) => {
            
    // *********Pesquisando pelo jogo referenciado pelo id em 'gameId' no objeto de rentals**********
            const rentedGameArray = gamesQuery.rows.map((game) => {
                const {id, name, categoryId} = game
                if(rental.gameId === game.id){
                    const rentedGame = {game: {id, name, categoryId}} 
                    return rentedGame
                }
            })
            const rentedGame = rentedGameArray[0];
// ***************************************************************************************************

// *******Pesquisando pelo nome da categoria referenciada pelo 'categoryId' no objeto de rentals******
            categoriesQuery.rows.map((category) => {

                const {categoryId} = rentedGame.game;
                const {name} = category;

                if(categoryId === category.id){
                    rentedGame.game.categoryName = name;
                    return true
                }
        })

// ***************************************************************************************************

// ***********Pesquisando pelo cliente referenciado pelo 'customerId' no objeto de rentals************
            const customerArray = customersQuery.rows.map((customer) => {
                const {name, id} = customer;
                if(customer.id === rental.customerId){
                    const customer = {customer: {id, name}};
                    return customer
                }

            })
            const customer = customerArray[0];
// ***************************************************************************************************
            

            return {...rental, ...customer, ...rentedGame}
        })
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