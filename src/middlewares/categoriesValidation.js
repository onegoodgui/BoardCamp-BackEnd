import categorySchema from "../schemas/categorySchema.js";

export async function categoriesValidation(req, res, next){


    const category  = req.body;

const validation = categorySchema.validate(category);
if(validation.error){
    return res.sendStatus(422);
}

next()
}