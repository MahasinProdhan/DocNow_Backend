// The token is stored in localStorage at the moment when login or registration succeeds on the frontend.The FRONTEND reads the token from localStorage and sends it to the BACKEND in headers. authUser only reads it from req.headers.Backend never touches localStorage.

// req.headers is NOT something you created manually.It is automatically created by:Browser,Axios,HTTP ,protocol,Express,Whenever a request is sent from frontend to backend, it always contains headers.Express automatically puts them inside req.headersBackend simply reads them.

//     // After verifying the JWT token, we extract the user ID from it and attach it to the request object so that controllers can identify the authenticated user.”

import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, login again",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id; // ✅ FIXED (matches controller)
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export default authUser;
