const mongoose = require("mongoose");

mongoose.connect(`mongodb://127.0.0.1:27017/test`);

const userSchema = mongoose.Schema({
	username: String,
	email: String,
	password: String,
	posts: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "posts",
		},
	],
});

module.exports = mongoose.model("user", userSchema);
