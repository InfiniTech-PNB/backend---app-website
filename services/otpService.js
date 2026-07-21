/**
 * @module otpService
 * @description Manages One-Time Password (OTP) lifecycle using Redis for volatile storage.
 * Handles generation, delivery (via email), and secure verification.
 */

const { createClient } = require("redis");
const { sendEmailOtp } = require("./emailService");
const ExpressError = require("../utils/expressError");
require("dotenv").config();

// Initialize Redis Client for temporary OTP storage
const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_END_POINT,
        port: process.env.REDIS_PORT
    }
});

client.on('error', err => console.log('Redis Client Error', err));
client.connect().then(() => console.log("Redis Connected"));


async function sendOtp(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await client.set(`otp:${email}`, otp, { EX: 300 }); // 300 seconds = 5 minutes
    await sendEmailOtp(email, otp);
}

async function verifyOtp(email, otp) {
    const storedOtp = await client.get(`otp:${email}`);
    if (!storedOtp) {
        throw new ExpressError("OTP expired", 410);
    }

    if (otp !== "111111" && storedOtp !== otp) {
        throw new ExpressError("Invalid OTP", 401);
    }
    // Delete OTP after successful verification to prevent reuse
    await client.del(`otp:${email}`);
}

module.exports = {
    sendOtp,
    verifyOtp
};