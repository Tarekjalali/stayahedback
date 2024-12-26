const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name : {type :String, required : true},
    email : {type : String , unique : true , required : true },
    password : {type : String ,  required : true },
    isActive : {type : Boolean , default : false},
    activationCode : {type : String , default : ""}
})

module.exports = mongoose.model('UserModel',userSchema)