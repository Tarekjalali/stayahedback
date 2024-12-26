const {body, validationResult } = require('express-validator');

exports.validationCreate =[

    body('email','bad email format').isEmail(),
    body('password','your password length must be 6 characters at least').isLength({min : 6})
]

exports.Validation =(req,res,next)=>{

    const errors = validationResult(req)

    if(!errors.isEmpty()){return res.status(400).send(errors)}

    next()

}