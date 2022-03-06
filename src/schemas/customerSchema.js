import joi from "joi";


const customerSchema = joi.object({
    name: joi.string().required().min(1),
    phone: joi.string().pattern(new RegExp(/^[0-9]{10,11}$/)).required(),
    cpf: joi.string().pattern(new RegExp(/^[0-9]{11}$/)).required(),
    birthday: joi.string().pattern(new RegExp(/^[0-9]{4}[-]([0][1-9]|[1][0-2])[-]([3][0-1]|[1-2][0-9]|[0][1-9])$/)).required()
  });

  export default customerSchema

