const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

let userSchema = new mongoose.Schema({
    name : String,
    email : String,
    role : String,
    gender : String,
    contact : String,
    image : {
        type : String,
        default : '/profiles/default_user.png'
    },
    password : {
        type : String,
        select : false,
        require : true
    },
    status: {
        type: String,
        enum: ['pending', 'active'],
        default: 'pending',
      },
    resetPasswordToken : String,
    resetPasswordExpires : Date
});

userSchema.plugin(passportLocalMongoose, {usernameField : 'email'});
module.exports = mongoose.model('User', userSchema);
