import db from "../db.js";

export async function insertCustomer(req, res){

    const {name, phone, cpf, birthday} = req.body;

    try{
        const existentCPF = await db.query('SELECT cpf FROM customers WHERE cpf = $1',[cpf]);
        if(existentCPF.rows.length > 0){
            res.status(409).send('Cliente já existente');
            return
        }

        await db.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)',[name, phone, cpf, birthday]);
        res.status(200).send('Cliente inserido com sucesso')
    }
    catch(error){
        res.status(500).send(error)
    }
}

export async function getCustomers(req, res){

    try{
        if(req.query.cpf){
            
            const {cpf} = req.query;
            const cpfQuery = await db.query(`SELECT * FROM customers WHERE cpf LIKE '${cpf}%'`);
            const CPF_List = cpfQuery.rows;
            res.send(CPF_List);
            return

        }
        if(req.params.id){
            const {id} = req.params
            const idQuery = await db.query(`SELECT * from customers where id = $1`, [id]);
            const selectedUser = idQuery.rows;
            if(selectedUser.length === 0){
                res.status(404).send('ID de usuário inexistente');
                return
            }
            res.send(selectedUser[0]);
            return
        }

        const customersQuery = await db.query('SELECT * FROM customers');
        const customersList = customersQuery.rows;
        res.send(customersList);

    }
    catch(error){
        res.status(500).send(error)
    }
}

export async function updateCustomer(req, res){

    const {id} = req.params;

    try{
        
        if(!id){
            res.status(400).send('id não encontrado');
            return
        } 
    
                
        const cpfQuery = await db.query(`SELECT cpf FROM customers WHERE NOT id = $1`, [id]);
        const existingCPF = cpfQuery.rows;
    
        if(existingCPF.length === 1){
            res.status(409).send('Este CPF já está cadastrado');
            return
        }
    
        
        
        const initialUserQuery = await db.query(`SELECT * FROM customers WHERE id = $1`, [id]);
        const initialUser = initialUserQuery.rows[0];

        const updatedUser = {};

        const userKeys = Object.keys(req.body);
        for(let i = 0; i < userKeys.length; i++){
            if(req.body[userKeys[i]] !== initialUser[userKeys[i]]){
                updatedUser[userKeys[i]] = req.body[userKeys[i]]
            }
        }

        if(Object.keys(updatedUser).length === 0){
            res.send(initialUser);
            return
        }
        else{
            const updatedUserKeys = Object.keys(updatedUser);

            for(let i=0; i< updatedUserKeys.length; i++){
                await db.query(`UPDATE customers SET ${updatedUserKeys[i]}='${updatedUser[updatedUserKeys[i]]}' WHERE id = $1`,[id])
            }

            const updatedUserQuery = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
            const updatedUserObject = updatedUserQuery.rows[0];
            res.send(updatedUserObject);
        }

    }
    catch(error){
        res.status(500).send(error)
    }

        
}