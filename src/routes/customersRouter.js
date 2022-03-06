import { Router } from "express";
import { customersValidation } from "../middlewares/customersValidation.js";
import { insertCustomer, getCustomers, updateCustomer} from "../controllers/customerController.js";

const customersRouter = Router();


customersRouter.post('/customers', customersValidation, insertCustomer);
customersRouter.get('/customers/:id', getCustomers);
customersRouter.get('/customers', getCustomers);
customersRouter.put('/customers/:id', customersValidation, updateCustomer)


export default customersRouter