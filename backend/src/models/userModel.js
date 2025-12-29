const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    otp: { type: String },
    otpExpires: { type: Date }
  },
  { timestamps: true }
);

// encrytion password before saving
userSchema.pre('save', async function(next){
   if(!this.isModified('password')){
    return;
   }
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
});
// check the password
userSchema.methods.matchPassword = async function(enterPass) {
    return await bcrypt.compare(enterPass, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;