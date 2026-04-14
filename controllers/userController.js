import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";
// import payments from "razorpay/dist/types/payments.js";
// import Razorpay from "razorpay";

//.....📍API TO REGISTER USER📍.....

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !password || !email) {
      return res.json({ success: false, message: "Misssing Details" });
    }

    // validating email
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please provide a valide email address",
      });
    }

    // validating password

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "enter a strong password",
      });
    }

    //hashing user password

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();
    //in DB there will be generate a  _id property.  by using that will  create one token so user can login in the website.

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log("error", error);
    return res.json({ success: false, message: " error.message" });
  }
};

//.....📍API TO USER LOGIN📍.....
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: " User doesnot exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log("error", error);
    return res.json({ success: false, message: " error.message" });
  }
};

//.....📍API TO GET USE RPROFILE DATA📍.....
const getProfile = async (req, res) => {
  try {
    const { userId } = req;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//     .....📍API TO UPDATE USER PROFILE DATA📍.....
const updateProfile = async (req, res) => {
  try {
    console.log("HEADERS:", req.headers["content-type"]);
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("USER ID:", req.userId);
    const { name, email, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    const userId = req.userId; // ✅ from middleware

    if (!name || !phone || !gender || !dob) {
      return res.json({ success: false, message: "Missing Data" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });

      await userModel.findByIdAndUpdate(userId, {
        image: imageUpload.secure_url,
      });
    }

    return res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//.....📍API TO BOOK APPOINTMENT📍.....

const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    let slots_booked = docData.slots_booked;
    //checking for slot availabiity
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slots not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select("-password");
    delete docData.slots_booked;

   const appointmentData = {
  userId,
  docId,
  userData,
  docData,
  amount: docData.fees,
  slotTime,
  slotDate,
  date: Date.now(),
  cancelled: false,
  payment: false
};
    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    //save new slot data in doctors data
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//.....📍API TO GET USER APPOINTMENTS FOR FRONTEND USER APPOINTMENT PAGE📍.....
const listAppointment = async (req, res) => {
  try {
    // const { userId } = req.body; was reason of a big error
    const userId = req.userId;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//       .....📍API TO CANCEL APPOINTMENT📍.....
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    //verify appointmment user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    //Releasing doctors slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime,
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// .....📍API TO MAKE PAYMENT OF APPOINTMENT USING RAZORPAY📍.....

const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }

    //creationg options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY || "INR",
      receipt: appointmentId,
    };
    //CREATION OF A  ORDER
    const order = await razorpayInstance.orders.create(options);

    res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API TO VERIFY PAYMENT OF RAZORPAY
const verifyRazorpay = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !appointmentId
    ) {
      return res.json({ success: false, message: "Missing payment details" });
    }

    const paymentInfo = await razorpayInstance.payments
      .fetch(razorpay_payment_id)
      .catch(() => null);

    const paymentVerified =
      paymentInfo?.order_id === razorpay_order_id &&
      (paymentInfo?.status === "captured" ||
        paymentInfo?.status === "authorized");

    let signatureVerified = false;

    if (razorpay_signature) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      signatureVerified = expectedSignature === razorpay_signature;
    }

    if (!paymentVerified && !signatureVerified) {
      return res.json({
        success: false,
        message: "Payment verification failed",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      payment: true,
    });

    res.json({ success: true, message: "Payment Successful" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
};
