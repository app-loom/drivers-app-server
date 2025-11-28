const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, default: "" },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: undefined },
    image: {
      type: String,
      default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYOvDs-ry3nz6dC7R-Ut7z78f98QnTkD4bTsWCXman027r53vIrXhiMS7hJ6tUyMjb6mE&usqp=CAU",
    },
    address: { type: addressSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const User = mongoose.model("Users", userSchema);

module.exports = User;
