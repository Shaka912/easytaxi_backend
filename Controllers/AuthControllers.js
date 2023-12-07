var jwt = require('jsonwebtoken');
const authmodel = require('../models/users')
const ratingmodel = require('../models/driverratings')

const SECRET_KEY = 'hello$123'

const Login = async (request, response) => {
    const { phone } = request.body;
    try {
        const checkuser = await authmodel.findOne({ phone: phone });
        if (checkuser) {
            response.status(200).json({
                message: 'User Login Success',
                data: checkuser._doc, // Removed unnecessary spread operator
            });
        } else {
            response.status(200).json({
                message: 'Phone Number Not Exist',
            });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};

const Register = async (request, response) => {
    const checkuser = await authmodel.findOne({ phone: request.body.phone });

    if (checkuser) {
        response.status(200).json({
            message: 'User Already Exists',
        });
    } else {
        try {
            if (!request.file) {
                // Get the image URL from the request file object
                const imageUrl = "Null";
                const newuser = new authmodel({
                    name: request.body.name,
                    phone: request.body.phone,
                    gender: request.body.gender,
                    dob: request.body.dob,
                    image: imageUrl
                });

                const saveuser = await newuser.save();
                response.status(200).json({
                    message: 'User Register Success',
                    data: saveuser,
                });
            } else {
                // Get the image URL from the request file object
                const imageUrl = request.file.location;
                const newuser = new authmodel({
                    name: request.body.name,
                    phone: request.body.phone,
                    gender: request.body.gender,
                    dob: request.body.dob,
                    image: imageUrl
                });

                const saveuser = await newuser.save();
                response.status(200).json({
                    message: 'User Register Success',
                    data: saveuser,
                });
            }
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: 'User Not Created' });
        }
    }
};


const verifyotp = async (request, response) => {
    try {
        const checkuser = await authmodel.findOne({ _id: request.body.id });
        if (checkuser) {
            if (!checkuser.isValid) {
                checkuser.isValid = true;
                const user_info = await checkuser.save();
                const data = {
                    user: {
                        id: user_info._id,
                        phone: user_info.phone
                    },
                };
                const token = jwt.sign(data, SECRET_KEY);
                response.status(200).json({
                    message: 'isValid field updated successfully',
                    data: {
                        ...user_info._doc,
                        token: token,
                    },
                });
            } else {
                const data = {
                    user: {
                        id: checkuser._id,
                        phone: checkuser.phone
                    },
                };
                const token = jwt.sign(data, SECRET_KEY);
                response.status(200).json({
                    message: 'Field Already Updated',
                    data: {
                        ...checkuser._doc,
                        token: token,
                    },
                });
            }
        } else {
            response.status(200).json({
                message: 'User not found',
            });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Internal Server Error' });
    }
};


const user_to_driver = async (request, response) => {
    try {
        const rating = new ratingmodel({
            driverinfo: request.body.driverinfo,
            ratedBy: request.user.id,
            rating: request.body.rating,
            rideRequestId: request.body.rideRequestId,
            comment: request.body.comment,
        });

        const result = await rating.save();
        response.status(200).json({
            message: 'Your Response was successfully saved',
            data: result,
        });
    } catch (error) {
        response.status(200).json({
            message: 'Something went wrong',
        });
    }
}

module.exports = {
    Login,
    Register,
    verifyotp,
    user_to_driver
}