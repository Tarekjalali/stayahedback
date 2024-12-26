const User = require("../Models/User");
var jwt = require('jsonwebtoken');

exports.IsAuthorized=async(req,res,next)=>{

    try {

        const token = req.header('authorized')
        var decoded = jwt.verify(token, process.env.privateKey);


        if(!decoded){
            return res.status(400).send({errors : [{msg : "wrong token"}]})
        }

        const authUser = await User.findById(decoded.id)

        req.authUser = authUser

        next()
        
    } catch (error) {
        res.status(500).send({errors : [{msg:"wrong token"}]})
    }

}