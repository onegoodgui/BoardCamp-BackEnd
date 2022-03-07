import db from '../db.js'

export async function insertCategory(req, res){

    const {name} = req.body;

    try{
        const existentCategory = await db.query('SELECT name FROM categories WHERE lower(name) = lower($1)',[name]);
        if(existentCategory.rows.length > 0){
            res.status(409).send('Categoria já existente');
            return
        }
        await db.query('INSERT INTO categories (name) VALUES ($1)',[name]);
        res.status(201).send('item inserido');
    }
    catch(error){
        res.status(500).send(error);
    }

}

export async function getCategories(req, res){

    let offset = '';
    if (req.query.offset) {
        offset = `OFFSET ${req.query.offset}`;
    }

    let limit = '';
    if (req.query.limit) {
        limit = `LIMIT ${req.query.limit}`;
    }  

    try{
       const categories = await db.query(
           `SELECT * 
            FROM 
                categories
            ${limit}
            ${offset}`
        );
        res.status(201).send(categories.rows);
    }
    catch(error){
        res.status(500).send(error);
    }

}


