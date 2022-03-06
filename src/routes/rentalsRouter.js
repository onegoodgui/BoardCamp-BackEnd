import { Router } from "express";
import { rentalsValidation } from "../middlewares/rentalsValidation.js";
import { insertRental, getRentals, checkoutRental, deleteRental } from "../controllers/rentalController.js";

const rentalsRouter = Router();

rentalsRouter.post('/rentals', rentalsValidation, insertRental);
rentalsRouter.get('/rentals', getRentals);
rentalsRouter.post('/rentals/:id/return', checkoutRental);
rentalsRouter.delete('/rentals/:id', deleteRental);

export default rentalsRouter;