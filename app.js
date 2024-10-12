const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const userModel = require("./models/user");
const postModel = require("./models/posts");
const bcrpyt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", (req, res) => {
	res.render("index");
});

app.get("/create", (req, res) => {
	res.render("create");
});
app.post("/create", (req, res) => {
	let { username, email, password } = req.body;

	bcrpyt.genSalt(10, (err, salt) => {
		bcrpyt.hash(password, salt, async (err, hash) => {
			let createdUser = await userModel.create({
				username,
				email,
				password: hash,
			});
			let token = jwt.sign({ email }, "security");
			res.cookie("token", token);

			res.redirect("/");
		});
	});
});

app.get("/login", (req, res) => {
	res.render("login");
});

app.post("/login", async (req, res) => {
	let user = await userModel.findOne({ email: req.body.email });
	if (!user) return res.redirect("/login");

	bcrpyt.compare(req.body.password, user.password, (err, result) => {
		if (result) {
			let token = jwt.sign({ email: user.email }, "security");
			res.cookie("token", token);
			res.redirect("/");
		} else {
			res.redirect("/login");
		}
	});
});

app.get("/posts", isLoggedIn, async (req, res) => {
	let data = jwt.verify(req.cookies.token, "security");
	let user = await userModel.findOne({ email: data.email }).populate("posts");
	res.render("posts", { user });
});

app.post("/post/create", isLoggedIn, async (req, res) => {
	let data = jwt.verify(req.cookies.token, "security");
	let user = await userModel.findOne({ email: data.email });
	let createdPost = await postModel.create({
		user: user._id,
		content: req.body.content,
	});
	await user.posts.push(createdPost._id);
	await user.save();
});

app.get("/posts/like/:id", async (req, res) => {
	let data = jwt.verify(req.cookies.token, "security");
	let user = await userModel.findOne({ email: data.email });

	let post = await postModel.findOne({ _id: req.params.id }).populate("user");
	if (post.likes.indexOf(user._id) == -1) {
		await post.likes.push(user._id);
	} else {
		post.likes.splice(user._id, 1);
	}
	await post.save();
	console.log(post);
	res.redirect("/posts");
});

app.get("/posts/edit/:id", async (req, res) => {
	let post = await postModel.findOne({ _id: req.params.id }).populate("content");
	res.render("edit", { post });
});

app.post("/post/edit/:id", async (req, res) => {
	let edittedPost = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content }, { new: true });
	console.log(edittedPost);
	res.redirect("/posts");
});

app.get("/logout", (req, res) => {
	res.cookie("token", "");
	res.redirect("/");
});
function isLoggedIn(req, res, next) {
	if (req.cookies.token === "") {
		res.redirect("/login");
	} else {
		next();
	}
}
app.listen(3000);
