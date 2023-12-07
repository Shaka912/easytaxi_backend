var jwt = require('jsonwebtoken');
const drivermodel = require('../models/driver')
const ratingmodel = require('../models/userrating')

const SECRET_KEY = 'hello$123'

const Login = async (request, response) => {
    const { phone } = request.body;
    try {
        const checkuser = await drivermodel.findOne({ phone: phone });
        if (checkuser) {
            response.status(200).json({
                message: 'User Login Success',
                data: checkuser._doc,
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
    const checkuser = await drivermodel.findOne({ phone: request.body.phone });

    if (checkuser) {
        response.status(200).json({
            message: 'Driver Already Exists',
        });
    } else {
        try {
            if (!request.files) {
                return response.status(400).json({ error: 'Image upload failed' });
            }

            // // Get the image URL from the request file object
            const vehicle_image = request.files[0].location;
            const license_image = request.files[1].location;
            const driver_image = request.files[2].location;

            const newDriver = new drivermodel({
                first_name: request.body.first_name,
                last_name: request.body.last_name,
                email: request.body.email,
                city: request.body.city,
                phone: request.body.phone,
                gender: request.body.gender,
                vehicle: {
                    brand: request.body.brand,
                    vehicletype: request.body.vehicletype,
                    model: request.body.model,
                    year: request.body.year,
                    plate_number: request.body.plate_number,
                    images: {
                        vehicle_image: vehicle_image,
                        license_image: license_image,
                        driver_image: driver_image
                    }
                }
            });

            const saveuser = await newDriver.save();
            response.status(200).json({
                message: 'User Register Success',
                data: saveuser,
            });
        } catch (error) {
            console.error(error);
            response.status(500).json({ error: 'Driver Not Created' });
        }
    }
}

const verifyotp = async (request, response) => {
    try {
        const checkuser = await drivermodel.findOne({ _id: request.body.id });
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


const driver_to_user = async (request, response) => {
    try {
        const rating = new ratingmodel({
            userid: request.body.userid,
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
    driver_to_user
}