const BookingModel = require('../models/Booking');

const PostBooking = async (request, response) => {
    try {
        let newBooking;

        if (request.files.length == 2) {
            const national_id_image = request.files[0].location;
            const guarantee_image = request.files[1].location;
            const license_image = "Null";

            newBooking = new BookingModel({
                userid: request.user.id,
                booking_duration: request.body.booking_duration,
                booking_helper: request.body.booking_helper,
                booking_origin: request.body.booking_origin,
                booking_destination: request.body.booking_destination,
                booking_cost: request.body.booking_cost,
                verification: {
                    national_id_image,
                    guarantee_image,
                    license_image,
                },
            });
        } else {
            const national_id_image = request.files[0].location;
            const guarantee_image = request.files[1].location;
            const license_image = request.files[2].location;

            newBooking = new BookingModel({
                userid: request.user.id,
                booking_duration: request.body.booking_duration,
                booking_helper: request.body.booking_helper,
                booking_origin: request.body.booking_origin,
                booking_destination: request.body.booking_destination,
                booking_cost: request.body.booking_cost,
                verification: {
                    national_id_image,
                    guarantee_image,
                    license_image,
                },
            });
        }

        const savedBooking = await newBooking.save();

        response.status(201).json({
            success: true,
            message: 'Booking added successfully',
            booking: savedBooking,
        });
    } catch (error) {
        response.status(500).json({
            success: false,
            message: 'Failed to add booking',
            error: error.message,
        });
    }
};

const get_userbooking = async (request, response) => {
    const booking = await BookingModel.find({ userid: request.user.id })
    if (booking) {
        response.status(201).json({
            success: true,
            message: 'Booking Found',
            booking: booking,
        });
    } else {
        response.status(500).json({
            success: true,
            message: 'Booking Not Found',
            booking: booking,
        });
    }
}

module.exports = {
    PostBooking,
    get_userbooking
};
