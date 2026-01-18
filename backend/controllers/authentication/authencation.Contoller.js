import User from "../../models/User.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import getToken from "../../utils/Jwt.js";

async function signupController(req, res) {
  try {
    const { first_name, last_name, email, phone_number, password } = req.body;

    /* 1️⃣ Contract validation */
    if (!first_name || !last_name || !email || !phone_number || !password) {
      return res.status(400).json({
        success: false,
        error_code: "VALIDATION_ERROR",
        message: "Required fields are missing",
      });
    }

    /* 2️⃣ Check duplicate user */
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error_code: "USER_ALREADY_EXISTS",
        message: "User already exists",
      });
    }

    /* 3️⃣ Create user */
    const newUser = await User.create({
      first_name,
      last_name,
      email,
      phone_number,
      password, // should be hashed
      project: "chat",
    });

    /* 4️⃣ Token generation (Auth service responsibility) */
    const token = getToken(newUser.id);

    /* 5️⃣ Sanitize response */
    const user = newUser.toJSON();
    delete user.password;

    /* 6️⃣ Final response */
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    });

  } catch (error) {
    console.error("[AUTH-SERVICE] SIGNUP ERROR:", error);

    return res.status(500).json({
      success: false,
      error_code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    });
  }
}


async function loginController(req, res) {
  const { email = "", phone_number = "", password } = req.body;
  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { phone_number: phone_number }],
      },
    });

    const pass = await bcrypt.compare(password, user.password);

    if (!pass) {
     return  res.status(401).json({ success: false, message: "Wrong password" });
    }

    const token = getToken(user.id);
    res
      .status(200)
      .json({ success: true, message: "successfully Logged In", token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server errors", error: error });
  }
}

export { signupController, loginController };
