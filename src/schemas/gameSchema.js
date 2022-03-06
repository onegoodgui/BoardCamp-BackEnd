import joi from "joi";

const gameSchema = joi.object({
    name: joi.string().required().min(1),
    image: joi.string().uri().required(),
    stockTotal: joi.number().positive().required(),
    categoryId: joi.number().positive().required(),
    pricePerDay: joi.number().positive().required(),
  });

  export default gameSchema
