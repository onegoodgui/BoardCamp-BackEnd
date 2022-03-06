import { Router } from "express";
import { insertCategory, getCategories } from "../controllers/categoryController.js";
import { categoriesValidation } from "../middlewares/categoriesValidation.js";

const categoriesRouter = Router();

categoriesRouter.post('/categories', categoriesValidation, insertCategory)
categoriesRouter.get('/categories', getCategories)


export default categoriesRouter