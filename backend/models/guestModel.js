import mongoose from "mongoose";

const { Schema } = mongoose;

const guestSchema = new Schema({
	guest_id: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	userName: {
		type: String,
		required: true,
		trim: true,
	},
	eventId: {
		type: Schema.Types.ObjectId,
		ref: "Event",
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const Guest = mongoose.model("Guest", guestSchema);

export default Guest;
