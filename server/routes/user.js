import { Router } from "express";
import { connection } from "../connection/connection.js";
import { comparePassword, hashPassword } from "../utils/helper.js";
import { sendEmail } from "../utils/SendEmail.js";
const user = Router();

// =======================
// GET ALL USERS
// =======================
user.get("/", async (req, res) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM user_info");

        res.status(200).json({
            status: 200,
            message: "Users fetched successfully",
            data: rows
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});

user.get("/userprofile", (req, res) => {
    // console.log(req.session);
    console.log(req.session.isAuthenticated);
    if (!req.session || !req.session.isAuthenticated) {
        return res.status(401).json({
            status: 401,
            message: "Unauthorized",
            data: null,
        });
    }
    res.json({
        status: 200,
        message: "User fetched successfully",
        data: req.session.user,
    });
});

user.get("/:id", async (req, res) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM user_info where u_id=?", [req.params.id]);

        if (rows.length == 0) {
            return res.json({
                status: 404,
                message: 'User not found'
            })
        }

        res.status(200).json({
            status: 200,
            message: "Users fetched successfully",
            data: rows
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});

//Post
user.post("/", async (req, res) => {
    try {

        const {
            u_first_name,
            u_last_name,
            u_email,
            u_password,
            u_is_verified
        } = req.body

        const hashedPassword = hashPassword(u_password);

        // const [rows] = await connection.execute("Insert into user_info (u_first_name,u_last_name,u_email,u_password,u_is_verified) values (?,?,?,?,?)", [u_first_name, u_last_name, u_email, u_password, u_is_verified]);
        const [rows] = await connection.execute("Insert into user_info (u_first_name,u_last_name,u_email,u_password,u_is_verified) values (?,?,?,?,?)", [u_first_name, u_last_name, u_email, hashedPassword, u_is_verified]);
        res.status(200).json({
            status: 200,
            message: "Users created successfully",
            data: rows.insertId
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});

user.get('/test', (req, res) => {
    res.json({
        "status": 200,
        "message": "Response by get api"
    })
})

user.put("/:id", async (req, res) => {

    try {
        const { u_first_name, u_last_name } = req.body;

        if (!u_first_name || !u_last_name) {
            return res.status(400).json({
                status: 400,
                message: "Missing required fields",
                data: null
            });
        }

        const [result] = await connection.execute(
            "UPDATE user_info SET u_first_name = ?, u_last_name = ? WHERE u_id = ?",
            [u_first_name, u_last_name, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not found",
                data: null
            });
        }
        res.status(200).json({
            status: 200,
            message: "User updated successfully",
            data: { affectedRows: result.affectedRows }
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});

user.delete("/:id", async (req, res) => {
    try {
        const [result] = await connection.execute(
            "DELETE FROM user_info WHERE u_id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not found",
                data: null
            });
        }

        res.status(200).json({
            status: 200,
            message: "User deleted successfully",
            data: { affectedRows: result.affectedRows }
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});


//========================
//Login API
//========================
user.post("/login", async (req, res) => {
    try {
        // Debug (optional)
        // console.log("headers content-type:", req.headers["content-type"]);
        // console.log("body:", req.body);


        const { u_email, u_password } = req.body || {};

        // 1) Validate input
        if (!u_email || !u_password) {
            return res.status(400).json({
                status: 400,
                message: "Email and password are required",
                data: null,
            });
        }

        // 2) Query user by email
        const [rows] = await connection.execute(
            "SELECT * FROM user_info WHERE u_email =? LIMIT 1",
            [u_email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                status: 401,
                message: "Invalid email or password",
                data: null,
            });
        }

        const userRecord = rows[0];

        // 3) Password check (PLAIN TEXT version - for class demo only)
        // if (userRecord.u_password !== u_password) {
        if (!comparePassword(u_password, userRecord.u_password)) {  //changes after hashed password explanation
            return res.status(401).json({
                status: 401,
                message: "Invalid email or password",
                data: null,
            });
        }

        // 4) Remove password before sending back
        const { u_password: _, ...safeUser } = userRecord;
        // const { u_password:_, u_is_admin,u_is_verified, ...safeUser } = userRecord;

        // 5) Generate OTP and store in DB (5 min expiry)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await connection.execute(
            `
          INSERT INTO email_otp (email, otp, expires_at)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            otp = VALUES(otp),
            expires_at = VALUES(expires_at)
          `,
            [u_email, otp, expiresAt]
        );

        // 6) Send OTP via email
        const subject = "Your Login OTP";
        const body = `
          <h2>Login Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing:2px;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
        `;

        sendEmail(u_email, subject, body);

        return res.status(200).json({
            status: 200,
            // message: "Login successful",
            // data: safeUser,
            message: "OTP sent to your email. Please verify to complete login.", // changes after 2FA  - frontend OTP is required now            
            email: u_email
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            message: err.message,
            data: null,
        });
    }
});



//======================== 
//Verify Login OTP (Step 2: verify -> login complete)
//========================
user.post("/verify-login-otp", async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        if (!email || !otp) {
            return res.status(400).json({
                status: 400,
                message: "Email and OTP are required",
                data: null,
            });
        }

        const [rows] = await connection.execute(
            `SELECT otp, expires_at FROM email_otp WHERE email = ? LIMIT 1`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                status: 400,
                message: "OTP not found. Please request again.",
                data: null,
            });
        }

        const record = rows[0];
        const expiresAt = new Date(record.expires_at);

        if (Date.now() > expiresAt.getTime()) {
            await connection.execute(`DELETE FROM email_otp WHERE email = ?`, [email]);
            return res.status(400).json({
                status: 400,
                message: "OTP expired. Please request again.",
                data: null,
            });
        }

        if (record.otp !== otp) {
            return res.status(400).json({
                status: 400,
                message: "Invalid OTP.",
                data: null,
            });
        }

        // OTP correct -> delete (one-time use)
        await connection.execute(`DELETE FROM email_otp WHERE email = ?`, [email]);

        // Fetch user and return safe user
        const [userRows] = await connection.execute(
            "SELECT * FROM user_info WHERE u_email = ? LIMIT 1",
            [email]
        );

        const userRecord = userRows[0];
        const { u_password: _, ...safeUser } = userRecord;

        // Create session after successful OTP verification
        req.session.user = {
            u_id: userRecord.u_id,
            u_email: userRecord.u_email,
            u_first_name: userRecord.u_first_name,
            u_last_name: userRecord.u_last_name,
            u_is_admin: userRecord.u_is_admin,
            u_is_verified: userRecord.u_is_verified,
        };

        req.session.isAuthenticated = true;

        console.log(req.session.user)
        console.log(req.session.isAuthenticated)

        return res.status(200).json({
            status: 200,
            message: "OTP verified. Login complete.",
            otp_required: false,
            data: safeUser,
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            message: err.message,
            data: null,
        });
    }
});

// =======================
// LOGOUT API
// =======================
user.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                status: 500,
                message: "Logout failed",
                data: null
            });
        }
        // remove session cookie from browser
        res.clearCookie("connect.sid");

        return res.status(200).json({
            status: 200,
            message: "Logged out successfully",
            data: null
        });
    });
});

user.post("/verify-recaptcha", async (req, res) => {
    const token = req.body.token;
    if (!token) {
        return res
            .status(400)
            .json({ success: false, message: "No token provided" });
    }
    console.log("Token:", token);
    const secret = process.env.RECAPTCHA_SECRET;
    const verifyURL = "https://www.google.com/recaptcha/api/siteverify";
    const params = new URLSearchParams({ secret, response: token });

    try {
        const googleRes = await fetch(verifyURL, { method: "POST", body: params });
        const data = await googleRes.json();

        console.log("Google status:", googleRes.status);
        console.log("Google response:", data);
        res.json(data);
    } catch (err) {
        console.error("Error verifying reCAPTCHA:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

export default user;