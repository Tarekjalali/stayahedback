const express = require('express');

const { validationCreate, Validation } = require('../MiddleWares/Validator');
const { IsAuthorized } = require('../MiddleWares/IsAuthorized');
const { createAccount, activateAccount, signIn, deleteAccount, updateAccount, updatePassword, getCurrentUser } = require('../Controllers/User');

const userRouter = express.Router();

userRouter.post('/createAccount', validationCreate, Validation, createAccount);

userRouter.get('/activate/:code', activateAccount);

userRouter.post('/signIn', signIn);

userRouter.delete('/deleteAccount/:id', deleteAccount);

userRouter.put('/updateAccount/:id', updateAccount);

userRouter.put('/updatePassword/:id',updatePassword);


userRouter.get('/getcurrentuser', IsAuthorized, getCurrentUser)

module.exports = userRouter;
