import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween.js'
import customerSchema from "../schemas/customerSchema.js";
dayjs.extend(isBetween);

export async function customersValidation(req, res, next){

    const customer  = req.body;
    
    const validation = customerSchema.validate(customer);
    if(validation.error){
        return res.sendStatus(422);
    }
    else if(dayjs(customer.birthday).isBetween('1900-01-01', dayjs().subtract(10, 'year'), null, '[)')){
        next()
    }
    else{
        res.status(422).send('Data inválida');
        return
    }
}