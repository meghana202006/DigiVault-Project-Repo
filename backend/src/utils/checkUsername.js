const checkUsername = async (username) => {
    // normalize the username
    try{
    const normalizedUsername = username.toLowerCase().trim();

    const userExists = await UserActivation.findOne({
        username:{ $regex: new RegExp(`^${normalizedUsername}$`, 'i')}
    })
    if(userExists){
        return res.status(200).json({
            available: false,
            message: 'Username already exists'

        });
    }else{
        return res.status(200).json({
            available: true,
            message: 'Username is available'
        });
    }
}catch(err){
    console.log(err);
    return res.status(500).json({
        available: false,
        message: 'Server error'
    });
}
}
