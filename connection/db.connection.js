import mongoose from "mongoose";


async function connectionDB(){
    try {
        const connection = await mongoose.connect(process.env.MONGO_URL);
        console.log("mongoDB connected successfully");
    } catch (error) {
        throw error;
    }
    
}

export default connectionDB;
