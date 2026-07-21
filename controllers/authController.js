const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const ExpressError = require("../utils/expressError");
const catchAsync = require("../utils/catchAsync");
const { sendOtp, verifyOtp } = require("../services/otpService");

exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ExpressError("User not found", 404);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        throw new ExpressError("Invalid credentials", 400);
    }

    const generatedOtp = await sendOtp(email);

    res.json({
        success: true,
        message: "OTP sent for login verification",
        otp: generatedOtp
    });
});


exports.verifyOtp = catchAsync(async (req, res) => {
    const { email, otp } = req.body;

    // ADD THIS BYPASS CHECK HERE:
    // If it's the master OTP, we skip the strict Redis verification completely.
    if (otp !== "111111") {
        await verifyOtp(email, otp);
    }

    const user = await User.findOne({ email });
    if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
    }

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role,
            email: user.email,
            name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    return res.json({
        success: true,
        token,
        user: {
            name: user.name,
            email: user.email
        }
    });
});
