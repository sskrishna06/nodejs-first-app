// TimeStamp : 2:56:00
// npm start : to run node.js
// npm run dev : to run nodemon
import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();
app.set("view engine", "ejs");


mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "Backend",
}).then(() => console.log("Database Connected")).catch(() => console.log("Error"))

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(path.resolve(), "public")));
app.use(cookieParser());

const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;

    if (token) {

        const decoded = jwt.verify(token, "hbdi3b2i3biub32bb");

        req.user = await User.findById(decoded._id);

        next();
    }
    else {
        res.redirect("/login");
    }
};

app.get("/", isAuthenticated, (req, res) => {
    res.render("logout", { name: req.user.name })
});
app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user) return res.redirect("/register")

    const isMatch = await bcrypt.compare(password,user.password);

    if (!isMatch) return res.render("login", { email, message: "Incorrect Password" })

    const token = jwt.sign({ _id: user._id }, "hbdi3b2i3biub32bb")

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000),
    });
    res.redirect("/");
});

app.post("/register", async (req, res) => {

    const { name, email, password } = req.body

    let user = await User.findOne({ email })
    if (user) {
        return res.redirect("/login")
    };

    const hasedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
        name,
        email,
        password: hasedPassword,
    });
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");

});

app.listen(5000, () => {
    console.log("Server is Working")
});