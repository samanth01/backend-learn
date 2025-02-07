import mongoose from "mongoose";


const subscriptionSchema = new mongoose.SchemaType({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        
    },
    
}, {
    timestamps: true,
})




export const Subscription = mongoose.model("Subscription", subscriptionSchema)